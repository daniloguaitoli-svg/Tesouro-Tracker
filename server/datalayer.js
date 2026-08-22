// server/datalayer.js — a fachada de dados. Combina o que está versionado em
// dados/ (Tesouro + ANBIMA, escritos pelo coletor) com as séries macro do Banco
// Central (lidas na hora), normaliza tudo e monta os payloads que as rotas
// /api devolvem — as mesmas em dev (middleware do vite.config.js) e em produção
// (funções da Vercel em api/*.js).
//
// DIVISÃO DE TRABALHO, e o porquê:
//   - hora do request: dados/ (arquivo local, instantâneo) + BCB (rápido).
//   - job agendado:    CSV do Tesouro (dezenas de MB) + ANBIMA.
// O arquivo pesado nunca é tocado numa função serverless. Em troca, a taxa é
// tão nova quanto a última coleta — e por isso todo item carrega a data do
// preço e a marca de desatualizado, em vez de fingir tempo real.
//
// A MATEMÁTICA MORA AQUI (e em util.js), não nos componentes: duration,
// variação, estatísticas e sensibilidade a juros saem prontas para a tela.

import { CATALOGO, CATEGORIAS, porSlug, DESTAQUES, MACRO, IBOVESPA, rotuloGenerico } from "./catalogo.js";
import * as cache from "./cache.js";
import * as bcb from "./providers/bcb.js";
import * as bcglobais from "./providers/globais.js";
import { ibovespa } from "./providers/yahoo.js";
import { REGIOES, manchetes } from "./providers/noticias.js";
import {
  variacaoPeriodo,
  calcularDuration,
  precoPor100,
  temDuration,
  anosEntre,
  diasUteisEntre,
  hojeISO,
  LIMITE_DIAS_UTEIS,
} from "./util.js";

export const AVISO =
  "Dados de fontes públicas (Tesouro Nacional, ANBIMA e Banco Central), com defasagem de pelo menos um dia útil. " +
  "Duration e sensibilidade são calculadas em dias corridos/365, aproximação da convenção oficial de dias úteis/252. " +
  "Uso informativo — não é recomendação de investimento.";

// Janelas do gráfico do Detalhe, em dias corridos. MAX = tudo que houver.
const TF_DIAS = { "1M": 30, "3M": 91, "6M": 182, "1A": 365, "5A": 1826, MAX: null };
export const TIMEFRAMES = Object.keys(TF_DIAS);

// ---------- Anotações comuns ----------

// Marca cada item com há quanto tempo o preço não se move e se isso já é
// "velho" para a periodicidade dele.
function anotarData(item) {
  const hoje = hojeISO();
  if (!item.data) return { ...item, diasSemAtualizar: null, desatualizado: false };
  const dias = diasUteisEntre(item.data, hoje);
  const limite = LIMITE_DIAS_UTEIS[item.periodicidade || "diaria"] ?? LIMITE_DIAS_UTEIS.diaria;
  return { ...item, diasSemAtualizar: dias, desatualizado: dias > limite };
}

// Variação entre os dois últimos pontos. Para um título de renda fixa as duas
// coisas interessam e contam histórias opostas: a TAXA varia em pontos
// percentuais, o PREÇO em porcentagem — e quando uma sobe a outra cai.
function variacaoDaSerie(serie) {
  if (!serie || serie.length < 2) return { taxaVarPP: null, puVarPct: null, anterior: null };
  const ult = serie[serie.length - 1];
  const ant = serie[serie.length - 2];
  return {
    anterior: ant.date,
    taxaVarPP: ult.taxa != null && ant.taxa != null ? ult.taxa - ant.taxa : null,
    puVarPct: ult.pu != null && ant.pu != null && ant.pu !== 0 ? ((ult.pu - ant.pu) / ant.pu) * 100 : null,
  };
}

// Monta um item completo (metadados + taxa + PU + duration) a partir do slug.
function montarItem(slug, { comSerie = false } = {}) {
  const meta = cache.metaDe(slug);
  if (!meta) return null;
  const serie = cache.serieDe(slug);
  const ultimo = serie[serie.length - 1] || null;
  const doCatalogo = porSlug[slug] || null;

  const tipo = meta.tipo;
  const vencimento = meta.vencimento;
  const comCupom = meta.comCupom === true;
  const cupomAnual = meta.cupomAnual ?? undefined;
  const taxa = ultimo?.taxa ?? null;

  // A taxa vem em % a.a. no arquivo; a matemática do título trabalha em
  // decimal. LFT fica sem duration de propósito (pós-fixada; a taxa cotada é
  // ágio/deságio sobre a Selic) — null, nunca um zero com cara de análise.
  const duration = temDuration(tipo)
    ? calcularDuration({
        vencimentoISO: vencimento,
        comCupom,
        cupomAnual,
        taxaReal: taxa == null ? null : taxa / 100,
      })
    : { macaulay: null, modificada: null, convexidade: null, variacaoPor1pp: null, variacaoMenos1pp: null };

  const item = {
    slug,
    tipo,
    vencimento,
    comCupom,
    nome: doCatalogo?.nome || rotuloGenerico(tipo, vencimento),
    cupomAnual: meta.cupomAnual ?? null,
    noCatalogo: !!doCatalogo,
    destaque: doCatalogo?.destaque === true,
    periodicidade: "diaria",
    fonte: "Tesouro Nacional (Tesouro Transparente)",
    data: ultimo?.date ?? null,
    taxa,
    pu: ultimo?.pu ?? null,
    anosAteVencer: anosEntre(hojeISO(), vencimento),
    pontos: serie.length,
    ...variacaoDaSerie(serie),
    duration: {
      macaulay: duration.macaulay,
      modificada: duration.modificada,
      convexidade: duration.convexidade,
      variacaoPor1pp: duration.variacaoPor1pp,
      variacaoMenos1pp: duration.variacaoMenos1pp,
    },
  };

  // Enriquecimento do mercado secundário, quando a coleta conseguiu ler o
  // arquivo da ANBIMA. Ausente é ausente — nunca substituído por estimativa.
  const daPonte = (cache.ponte().titulos || []).find((t) => t.slug === slug);
  if (daPonte?.secundario) item.secundario = daPonte.secundario;

  // Renda de cupom sobre o PREÇO, não sobre o valor de face. Um título com
  // cupom de 6% comprado com deságio rende mais que 6% sobre o que se pagou —
  // é essa a taxa que responde "quanto isso me paga por ano". A conta é do
  // servidor porque exige descontar todo o fluxo; o componente só multiplica.
  if (comCupom && taxa != null && meta.cupomAnual != null) {
    const preco100 = precoPor100({ vencimentoISO: vencimento, comCupom: true, cupomAnual: meta.cupomAnual, taxaReal: taxa / 100 });
    const cupomAnualPor100 = 200 * (Math.pow(1 + meta.cupomAnual, 1 / 2) - 1);
    item.rendaCupomAnualPct = preco100 ? (cupomAnualPor100 / preco100) * 100 : null;
  } else {
    item.rendaCupomAnualPct = null;
  }

  // Série curta para o sparkline da lista: 45 pontos é o que cabe num traço de
  // 60px e evita uma requisição por linha.
  item.spark = serie.slice(-45).map((p) => p.taxa);

  if (comSerie) item.serie = serie;
  return anotarData(item);
}

// ---------- /api/titulos ----------

export async function getTitulos() {
  const hoje = hojeISO();
  const todos = cache
    .titulos()
    // Vencidos saem da lista pelo mesmo motivo que saem do arquivo-ponte: a
    // última taxa de um título que já venceu é ruído, não cotação. O histórico
    // deles continua em dados/historico.json, e /api/detalhe ainda abre por
    // slug para quem tiver o link.
    .filter((t) => t.vencimento > hoje)
    .map((t) => montarItem(t.slug))
    .filter(Boolean)
    // Vencimento mais curto primeiro: é a ordem em que a curva se lê.
    .sort((a, b) => (a.vencimento < b.vencimento ? -1 : a.vencimento > b.vencimento ? 1 : 0));

  const categorias = CATEGORIAS.map((c) => ({
    id: c.id,
    nome: c.nome,
    curto: c.curto,
    resumo: c.resumo,
    itens: todos.filter((t) => t.tipo === c.id),
  })).filter((c) => c.itens.length > 0);

  const macro = await getMacro().catch(() => null);

  return {
    fetchedAt: new Date().toISOString(),
    atualizadoEm: cache.historico().atualizadoEm,
    coletadoEm: cache.ponte().atualizadoEm,
    // Vazio antes da primeira coleta — a UI usa isto para explicar a espera em
    // vez de mostrar uma tela quebrada.
    pendente: todos.length === 0,
    categorias,
    destaques: todos.filter((t) => t.destaque),
    desatualizados: todos.filter((t) => t.destaque && t.desatualizado).map((t) => t.nome),
    macro,
    catalogo: { total: CATALOGO.length, destaques: DESTAQUES.length, conhecidos: todos.filter((t) => t.noCatalogo).length },
    aviso: AVISO,
  };
}

// ---------- /api/detalhe ----------

export async function getDetalhe(slug, tf = "1A") {
  const item = montarItem(slug, { comSerie: true });
  if (!item) {
    const erro = new Error(`Vencimento desconhecido: ${slug}`);
    erro.status = 404;
    throw erro;
  }

  const dias = TF_DIAS[tf] ?? TF_DIAS["1A"];
  const serieCompleta = item.serie || [];
  const corte = dias == null ? null : new Date(Date.now() - dias * 864e5).toISOString().slice(0, 10);
  const pontos = corte ? serieCompleta.filter((p) => p.date >= corte) : serieCompleta;

  const taxas = pontos.map((p) => p.taxa).filter((v) => v != null);
  const estatisticas = taxas.length
    ? {
        atual: taxas[taxas.length - 1],
        minima: Math.min(...taxas),
        maxima: Math.max(...taxas),
        media: taxas.reduce((s, v) => s + v, 0) / taxas.length,
        variacaoPP: taxas.length > 1 ? taxas[taxas.length - 1] - taxas[0] : null,
        pontos: taxas.length,
      }
    : null;

  // O fluxo de caixa futuro, que é o que explica a duration de um título com
  // cupom: dá para ver o dinheiro voltando antes do vencimento. A LFT não tem
  // fluxo a mostrar nessa régua — ela rende Selic diária até o resgate.
  const duration = temDuration(item.tipo)
    ? calcularDuration({
        vencimentoISO: item.vencimento,
        comCupom: item.comCupom,
        cupomAnual: item.cupomAnual ?? undefined,
        taxaReal: item.taxa == null ? null : item.taxa / 100,
      })
    : { fluxos: [] };

  const { serie, ...semSerie } = item;
  return {
    slug,
    tf,
    timeframes: TIMEFRAMES,
    item: semSerie,
    pontos,
    estatisticas,
    fluxos: duration.fluxos ?? [],
    notaHistorico:
      pontos.length < 2
        ? "Série ainda curta para este vencimento no arquivo do Tesouro — o gráfico ganha corpo a cada coleta diária."
        : null,
    aviso: AVISO,
  };
}

// ---------- /api/curva ----------

// Curvas de juros: taxa por prazo. Duas famílias, DE PROPÓSITO em curvas
// separadas: a curva real (IPCA+) e a nominal (Prefixado) não são comparáveis
// ponto a ponto — a diferença entre elas é a inflação implícita. A LFT fica
// fora das duas: o "preço" dela é um spread sobre a Selic, não um ponto de
// curva.
const FAMILIAS_CURVA = [
  { id: "real", nome: "Real (IPCA+)", tipos: ["ipca", "ipca-juros"], sufixo: "a.a. + IPCA" },
  { id: "prefixada", nome: "Prefixada (nominal)", tipos: ["prefixado", "prefixado-juros"], sufixo: "a.a." },
];

export async function getCurva() {
  const hoje = hojeISO();
  const todosVivos = cache.titulos().filter((t) => t.vencimento > hoje && t.taxa != null);

  const montarCurva = (tipos) => {
    const pontos = todosVivos
      .filter((t) => tipos.includes(t.tipo))
      .map((t) => {
        const doCatalogo = porSlug[t.slug] || null;
        return {
          slug: t.slug,
          tipo: t.tipo,
          nome: doCatalogo?.nome || rotuloGenerico(t.tipo, t.vencimento),
          vencimento: t.vencimento,
          anos: anosEntre(hoje, t.vencimento),
          taxa: t.taxa,
          data: t.data,
          destaque: doCatalogo?.destaque === true,
        };
      })
      .filter((p) => p.anos > 0)
      .sort((a, b) => a.anos - b.anos);

    const curvaEm = (diasAtras) => {
      const alvo = new Date(Date.now() - diasAtras * 864e5).toISOString().slice(0, 10);
      return pontos
        .map((p) => {
          const serie = cache.serieDe(p.slug).filter((x) => x.date <= alvo);
          const ult = serie[serie.length - 1];
          return ult?.taxa == null ? null : { anos: anosEntre(alvo, p.vencimento), taxa: ult.taxa, slug: p.slug };
        })
        .filter(Boolean)
        .filter((p) => p.anos > 0)
        .sort((a, b) => a.anos - b.anos);
    };

    return { agora: pontos, umMesAtras: curvaEm(30), umAnoAtras: curvaEm(365) };
  };

  const curvas = FAMILIAS_CURVA.map((f) => ({ id: f.id, nome: f.nome, sufixo: f.sufixo, ...montarCurva(f.tipos) }));

  return {
    fetchedAt: new Date().toISOString(),
    atualizadoEm: cache.historico().atualizadoEm,
    pendente: curvas.every((c) => c.agora.length === 0),
    curvas,
    aviso: AVISO,
  };
}

// ---------- /api/macro ----------

// As duas janelas que a moldura mostra. Calculadas da série COMPLETA e ANTES
// do slice(-120) que enxuga o payload: 120 pontos diários são ~6 meses, então
// calcular depois do corte daria null em "12 meses" — e o erro seria mudo.
function janelas(pontos) {
  return {
    var12m: variacaoPeriodo(pontos, 365),
    var1sem: variacaoPeriodo(pontos, 7),
  };
}

export async function getMacro() {
  const pedidos = MACRO.map((m) =>
    bcb.ultimo(m.serie, { dias: m.id === "ipca" ? 2000 : 800 }).then((r) => [m, r])
  );
  // O Ibovespa entra no mesmo allSettled: uma bolsa fora do ar não pode
  // derrubar o IPCA nem a Selic.
  const [resultados, ibov] = await Promise.all([
    Promise.allSettled(pedidos),
    ibovespa().catch(() => null),
  ]);

  const saida = {
    fetchedAt: new Date().toISOString(),
    fonte: "Banco Central do Brasil (SGS); Ibovespa via Yahoo Finance",
    indicadores: {},
    aviso: AVISO,
  };

  if (ibov) {
    saida.indicadores.ibovespa = anotarData({
      id: IBOVESPA.id,
      nome: IBOVESPA.nome,
      descricao: IBOVESPA.descricao,
      unidade: IBOVESPA.unidade,
      periodicidade: IBOVESPA.periodicidade,
      valor: ibov.valor,
      data: ibov.data,
      change: ibov.change,
      changePct: ibov.changePct,
      ...janelas(ibov.pontos),
      pontos: ibov.pontos.slice(-120),
    });
  }
  for (const r of resultados) {
    if (r.status !== "fulfilled" || !r.value) continue;
    const [meta, dado] = r.value;
    if (!dado) continue;
    saida.indicadores[meta.id] = anotarData({
      id: meta.id,
      nome: meta.nome,
      descricao: meta.descricao,
      unidade: meta.unidade,
      periodicidade: meta.periodicidade,
      valor: dado.valor,
      data: dado.data,
      change: dado.change,
      changePct: dado.changePct,
      ...janelas(dado.pontos),
      pontos: dado.pontos.slice(-120),
    });
    // O IPCA mensal só vira informação útil acumulado: é ele que corrige o VNA.
    if (meta.id === "ipca") {
      saida.indicadores.ipca.acumulado12m = bcb.acumular(dado.pontos, 12);
    }
    // A última decisão do Copom mora dentro da própria série da meta: o dia em
    // que o valor mudou. É data de VIGÊNCIA, não da reunião — a UI diz isso.
    if (meta.id === "selic") {
      saida.indicadores.selic.decisao = bcglobais.ultimaDecisao(dado.pontos);
    }
  }
  return saida;
}

// ---------- /api/mercado ----------

// O quadro de juros e câmbio: as três decisões de política monetária (Copom ao
// vivo pelo BCB; Fed e BCE do arquivo versionado dados/global.json, coletado
// duas vezes ao dia), o câmbio PTAX e o par CDI × Selic.
export async function getMercado() {
  const macro = await getMacro().catch(() => ({ indicadores: {} }));
  const ind = macro.indicadores || {};
  const g = cache.globais();

  const copom = ind.selic
    ? {
        nome: "Copom (Banco Central do Brasil)",
        indicador: "Meta da Selic",
        taxa: ind.selic.valor,
        vigenteDesde: ind.selic.decisao?.vigenteDesde ?? null,
        variacaoPP: ind.selic.decisao?.variacaoPP ?? null,
        data: ind.selic.data,
        fonte: "BCB / SGS (série 432)",
      }
    : null;

  return {
    fetchedAt: new Date().toISOString(),
    decisoes: { copom, fed: g.fed, bce: g.bce },
    globaisAtualizadosEm: g.atualizadoEm,
    cambio: { usd: ind.usdbrl ?? null, eur: ind.eurbrl ?? null },
    juros: { cdi: ind.cdi ?? null, selic: ind.selic ?? null },
    aviso: AVISO,
  };
}

// ---------- /api/noticias ----------

// Manchetes por região, melhor esforço: cada região é independente e uma fora
// do ar não derruba as outras. Manchete é contexto, não dado de decisão.
export async function getNoticias() {
  const resultados = await Promise.allSettled(REGIOES.map((r) => manchetes(r)));
  const regioes = REGIOES.map((r, i) => ({
    id: r.id,
    nome: r.nome,
    itens: resultados[i].status === "fulfilled" ? resultados[i].value : [],
    erro: resultados[i].status === "rejected" ? String(resultados[i].reason?.message || resultados[i].reason) : null,
  }));
  return {
    fetchedAt: new Date().toISOString(),
    regioes,
    pendente: regioes.every((x) => x.itens.length === 0),
    fonte: "Manchetes via RSS do Google News; cada link leva à fonte original.",
    aviso: AVISO,
  };
}
