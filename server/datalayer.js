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

import { CATALOGO, CATEGORIAS, porSlug, DESTAQUES, MACRO, IBOVESPA, INDICES, JUROS_DIARIOS, INFLACAO, macroPorId, rotuloGenerico } from "./catalogo.js";
import * as cache from "./cache.js";
import * as bcb from "./providers/bcb.js";
import * as bcglobais from "./providers/globais.js";
import { ibovespa, todosIndices } from "./providers/yahoo.js";
import { todasInflacoes } from "./providers/inflacao.js";
import { REGIOES, manchetes } from "./providers/noticias.js";
import { caminhoDaSelic, rotuloFocus, CALENDARIO_ATE, CALENDARIO_CONFERIDO_EM } from "./selic.js";
import { acharEpisodios, choqueNoPrazo, familiaDoChoque } from "./episodios.js";
import { FUTURO_DA_FAMILIA, curvaDoFuturo, taxaDoFuturo, paradoEm12Meses } from "./futuro.js";
import { focusNoPeriodo } from "./providers/focus.js";
import {
  variacaoPeriodo,
  variacaoNoAno,
  variacoesDoTitulo,
  percentilDoUltimo,
  valorDeFace,
  recebimentosFuturos,
  cuponsPagos,
  cruzarSeries,
  retornoPeriodo,
  retornoNoAno,
  calcularDuration,
  precoPor100,
  temDuration,
  anosUteisEntre,
  diasUteisEntre,
  hojeISO,
  brDeISO,
  LIMITE_DIAS_UTEIS,
  arred,
} from "./util.js";

// A ANBIMA saiu desta lista DE PROPOSITO. O caminho publico do mercado
// secundario responde 404 desde que o app existe (a ferramenta migrou para a
// plataforma ANBIMA Data), entao `dados/ntnb.json` sai com `anbima: null` e
// nenhum titulo carrega campo vindo dela. Creditar uma fonte que nao entrega
// nada sugere ao leitor que os numeros estao corroborados por ela — e nao
// estao. Se o seam ANBIMA_MS_URL um dia apontar para um endereco que responde,
// devolva o nome aqui.
export const AVISO =
  "Dados de fontes públicas (Tesouro Nacional e Banco Central), com defasagem de pelo menos um dia útil. " +
  "Prazo, duration e sensibilidade em dias úteis/252, a convenção do Tesouro e da ANBIMA. " +
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

// A variação do DIA, tirada da mesma conta das outras janelas (1D em
// variacoesDoTitulo) e não de uma segunda fórmula: assim ela herda a regra do
// cupom. Até 11/2026 esta função subtraía os dois últimos PUs direto, e no dia
// em que um cupom saía do preço a tela mostrava "preço −5,23%" em vermelho
// num título que não tinha perdido nada.
//
// Para um título de renda fixa as duas coisas interessam e contam histórias
// opostas: a TAXA varia em pontos percentuais, o PREÇO em porcentagem — e
// quando uma sobe a outra cai.
function variacaoDoDia(variacoes) {
  const dia = variacoes["1D"];
  return {
    anterior: dia?.de ?? null,
    taxaVarPP: dia?.taxaPP ?? null,
    puVarPct: dia?.puPct ?? null,
  };
}

// Os cupons já pagos de cada título com juros. A série só cresce na ponta e o
// processo vive entre duas coletas, então a conta — um desconto de fluxo
// inteiro por pagamento — é feita uma vez por título e por data do último
// preço, e não a cada /api/titulos.
const cuponsGuardados = new Map();
function cuponsDoTitulo(slug, meta, serie) {
  const chave = `${slug}|${serie[serie.length - 1]?.date}|${hojeISO()}`;
  if (!cuponsGuardados.has(chave)) {
    cuponsGuardados.set(chave, cuponsPagos({ tipo: meta.tipo, vencimentoISO: meta.vencimento, cupomAnual: meta.cupomAnual, serie }));
  }
  return cuponsGuardados.get(chave);
}

// O resumo gerado pelo coletor, só se for da MESMA data dos preços em tela.
function resumoDoDia(itens) {
  const r = cache.resumo();
  if (!r?.texto || !r.dataDosPrecos) return null;
  const dataDosPrecos = itens.reduce((m, t) => (t.data && t.data > m ? t.data : m), "");
  if (r.dataDosPrecos !== dataDosPrecos) return null;
  return { texto: r.texto, dataDosPrecos: r.dataDosPrecos, geradoEm: r.geradoEm, geradoPor: r.geradoPor, aviso: r.aviso };
}

// ---------- Os piores momentos do histórico ----------

// O piso da curva vale aqui também (definido mais abaixo, junto das curvas):
// é uma `const` do módulo, e só é LIDA dentro de função, depois da carga.

// As janelas em que as taxas mais subiram (server/episodios.js). O histórico
// não muda dentro de um processo — o cache o lê uma vez —, então a varredura
// é feita na primeira chamada e nunca mais.
let episodiosGuardados = null;
function episodiosDoHistorico() {
  if (!episodiosGuardados) {
    const titulos = Object.values(cache.historico().titulos || {});
    episodiosGuardados = acharEpisodios(titulos, { prazoMinimo: PRAZO_MINIMO_CURVA });
  }
  return episodiosGuardados;
}

// O que cada episódio faria com ESTE título hoje: a alta de taxa daquela
// janela, no prazo que o título tem agora, e o efeito no preço — por
// REPRECIFICAÇÃO do fluxo, não pela aproximação de duration: os choques daqui
// passam de 2 p.p., onde o termo que a expansão despreza já pesa.
//
// { [id do episódio]: [Δ taxa em p.p., Δ preço em %] }. null para a LFT (sem
// choque de taxa) e para título sem taxa.
function choquesDoTitulo({ tipo, vencimento, comCupom, cupomAnual, taxa, anos }) {
  const familia = familiaDoChoque(tipo);
  if (!familia || taxa == null) return null;
  const base = { vencimentoISO: vencimento, comCupom, cupomAnual };
  const precoHoje = precoPor100({ ...base, taxaReal: taxa / 100 });
  if (!(precoHoje > 0)) return null;
  const saida = {};
  for (const ep of episodiosDoHistorico()) {
    const delta = choqueNoPrazo(ep[familia], anos);
    if (delta == null) continue;
    const precoDepois = precoPor100({ ...base, taxaReal: (taxa + delta) / 100 });
    saida[ep.id] = [arred(delta, 3), arred((precoDepois / precoHoje - 1) * 100, 3)];
  }
  return saida;
}

// ---------- O título contra o futuro ----------

// Em quantos pregões a média do prêmio é tirada. Teto, não alvo: o histórico
// de futuros nasceu em 10/2026 e cresce um dia por coleta. O teto existe
// para a conta não crescer para sempre — cada pregão é um fluxo inteiro
// descontado por título.
const PREGOES_DO_PREMIO = 60;
// Menos que isto e "média" seria o nome de dois ou três números.
const MIN_PREGOES_DO_PREMIO = 5;

// A curva de futuros de uma família numa data, guardada por (ativo, data): a
// mesma serve a todos os títulos da família.
const curvasGuardadas = new Map();
function curvaDoFuturoEm(ativo, dataISO) {
  const chave = `${ativo}|${dataISO}`;
  if (!curvasGuardadas.has(chave)) {
    // A ponta curta da DAP é distorcida pelo IPCA já conhecido (ver
    // curvasDeFuturos): mesmo piso da tela. O DI1 é limpo desde o primeiro dia.
    const duMinimo = ativo === "DAP" ? Math.round(PRAZO_MINIMO_CURVA * 252) : 0;
    curvasGuardadas.set(chave, curvaDoFuturo(cache.futuros(), ativo, dataISO, { duMinimo }));
  }
  return curvasGuardadas.get(chave);
}

let datasDeFuturos = null;
function pregoesColetados() {
  if (!datasDeFuturos) {
    const datas = new Set();
    for (const c of Object.values(cache.futuros().contratos || {})) for (const d of Object.keys(c.serie || {})) datas.add(d);
    datasDeFuturos = [...datas].sort();
  }
  return datasDeFuturos;
}

// O prêmio do título sobre o futuro e o que ele rende parado em 12 meses.
//
// NA MESMA DATA, SEMPRE: a taxa do título é a do último preço do Tesouro, e a
// curva é a do futuro NAQUELE dia — não a mais recente. Medido em 13/11/2026
// com 12 pregões: casando a mesma data o desvio do prêmio fica entre 0,03 e
// 0,15 p.p.; casando com o pregão anterior, um único dia de reprecificação
// (26/10) abre 2,76 p.p. num Prefixado 2029. Sem futuro coletado na data do
// preço não há leitura — null, nunca a data vizinha.
const leiturasGuardadas = new Map();
function contraFuturoDe(slug) {
  const meta = cache.metaDe(slug);
  const ativo = meta && FUTURO_DA_FAMILIA[meta.tipo];
  if (!ativo) return null;
  const serie = cache.serieDe(slug);
  const ultimo = serie[serie.length - 1];
  if (ultimo?.taxa == null) return null;
  const chave = `${slug}|${ultimo.date}`;
  if (leiturasGuardadas.has(chave)) return leiturasGuardadas.get(chave);

  const base = { vencimentoISO: meta.vencimento, comCupom: meta.comCupom === true, cupomAnual: meta.cupomAnual ?? undefined };
  const premioEm = (ponto) => {
    const futuro = taxaDoFuturo({ ...base, dataISO: ponto.date, curva: curvaDoFuturoEm(ativo, ponto.date) });
    return futuro == null ? null : { futuro, premio: ponto.taxa - futuro };
  };

  let leitura = null;
  const hoje = premioEm(ultimo);
  if (hoje) {
    const coletados = new Set(pregoesColetados().slice(-PREGOES_DO_PREMIO));
    const premios = serie
      .filter((p) => p.taxa != null && coletados.has(p.date))
      .map((p) => premioEm(p)?.premio)
      .filter((v) => v != null);
    leitura = {
      ativo,
      data: ultimo.date,
      taxaFuturo: arred(hoje.futuro, 3),
      premioPP: arred(hoje.premio, 3),
      media:
        premios.length >= MIN_PREGOES_DO_PREMIO
          ? { pp: arred(premios.reduce((s, v) => s + v, 0) / premios.length, 3), pregoes: premios.length }
          : null,
      parado: paradoEm12Meses({ ...base, taxa: ultimo.taxa, dataISO: ultimo.date, curva: curvaDoFuturoEm(ativo, ultimo.date) }),
    };
  }
  leiturasGuardadas.set(chave, leitura);
  return leitura;
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
  const variacoes = variacoesDoTitulo(serie, { comCupom, vencimentoISO: vencimento });

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
    : {
        macaulay: null, modificada: null, convexidade: null,
        variacaoPor1pp: null, variacaoMenos1pp: null,
        variacaoPor2pp: null, variacaoMenos2pp: null,
      };

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
    anosAteVencer: anosUteisEntre(hojeISO(), vencimento),
    pontos: serie.length,
    ...variacaoDoDia(variacoes),
    // As três janelas do cartão do Painel (1 dia, 1 semana, 1 mês). Cada uma
    // é null quando a série não alcança a data, e traz `cupom` quando um
    // pagamento saiu do preço no meio — aí o preço vem null de propósito.
    variacoes,
    // Campo a campo, e não `...duration`, porque `fluxos` não cabe aqui: o
    // payload de /api/titulos leva dezenas de vencimentos, e o fluxo de caixa
    // de cada um só interessa na tela de detalhe. Ao acrescentar um cenário,
    // lembre de listá-lo aqui também — foi o que faltou quando os ±2 p.p.
    // nasceram e chegaram à tela como "—".
    duration: {
      macaulay: duration.macaulay,
      modificada: duration.modificada,
      convexidade: duration.convexidade,
      variacaoPor1pp: duration.variacaoPor1pp,
      variacaoMenos1pp: duration.variacaoMenos1pp,
      variacaoPor2pp: duration.variacaoPor2pp,
      variacaoMenos2pp: duration.variacaoMenos2pp,
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

  // O QUE A CARTEIRA PRECISA SABER DO TÍTULO — e só do título: quantos a
  // pessoa tem e quanto pagou ficam no aparelho dela e nunca chegam aqui.
  // `face` e `recebimentos` dizem o que um título ainda paga se não for
  // vendido; `cuponsPagos`, o que já pagou a quem o tinha em cada data.
  item.face = valorDeFace({ tipo, vencimentoISO: vencimento, comCupom, cupomAnual: meta.cupomAnual, taxa, pu: ultimo?.pu ?? null, dataISO: ultimo?.date ?? null });
  item.recebimentos = recebimentosFuturos({ face: item.face, vencimentoISO: vencimento, comCupom, cupomAnual: meta.cupomAnual });
  if (comCupom) item.cuponsPagos = cuponsDoTitulo(slug, meta, serie);

  // O que os piores momentos do histórico fariam com este título hoje. A
  // Carteira multiplica pela quantidade, no aparelho.
  item.choques = choquesDoTitulo({ tipo, vencimento, comCupom, cupomAnual: meta.cupomAnual ?? undefined, taxa, anos: item.anosAteVencer });

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
    // Desde quando há preço no arquivo. A Carteira usa para não somar cupons
    // de uma compra mais antiga que o histórico — os de antes ela não conhece.
    historicoDesde: cache.historico().desde ?? null,
    // As janelas em que as taxas mais subiram, para a Carteira repetir no que
    // a pessoa tem. Só o cabeçalho de cada uma: o efeito em cada título já
    // vai em `choques`, e o formato do choque por prazo não interessa à tela.
    episodios: episodiosDoHistorico().map(({ id, horizonte, de, ate, realPP, nominalPP }) => ({
      id, horizonte, de, ate, realPP: arred(realPP, 2), nominalPP: arred(nominalPP, 2),
    })),
    // O resumo do dia, quando há um E ele é dos preços que estão na tela. Um
    // resumo de anteontem ao lado de preços de ontem descreveria outro dia.
    resumo: resumoDoDia(todos),
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

// ---------- O que o DI embute para o Copom ----------

// Quantas reuniões à frente a tela mostra. A conta vai mais longe, mas a
// partir daí os vencimentos mensais do DI quase não negociam — o preço deles
// é interpolado pela bolsa entre os vencimentos líquidos, e a escada que sai
// disso oscila (+39, −62, +85 pontos-base em reuniões seguidas, medido em
// 10/11/2026) por artefato da interpolação, não por opinião de mercado.
// Quatro reuniões são uns seis meses, onde a leitura é estável.
const REUNIOES_A_MOSTRAR = 4;

// Uma variação maior que isto numa reunião só não é leitura de mercado: é a
// conta amplificando ruído. A lista para ali.
const MAX_VARIACAO_PLAUSIVEL_PP = 1.5;

// PURA sobre o arquivo de futuros, para o verificar.mjs e o coletor (que a
// usa nos fatos do resumo) chamarem sem rede. `cdiHoje` e `metaHoje` em %.
export function selicImplicitaDe(futuros, { cdiHoje = null, metaHoje = null, focus = null } = {}) {
  // O que os economistas esperam para a MESMA reunião (pesquisa Focus), para
  // ficar ao lado do que os preços embutem. A reunião é achada pelo nome que
  // a pesquisa lhe dá ("R8/2026"), tirado do mesmo calendário da conta.
  const doFocus = new Map((focus?.reunioes || []).map((r) => [r.reuniao, r.mediana]));
  const di = Object.values(futuros?.contratos || {}).filter((c) => c.ativo === "DI1" && c.serie);
  const dataRef = di.reduce((m, c) => {
    const ult = Object.keys(c.serie).sort().pop();
    return ult && ult > m ? ult : m;
  }, "");
  if (!dataRef) return null;
  const vertices = di
    .map((c) => ({ vencimento: c.vencimento, taxa: c.serie[dataRef]?.[0] ?? null }))
    .filter((v) => v.taxa != null);
  const caminho = caminhoDaSelic({ dataRef, vertices, cdiHoje });

  const reunioes = [];
  for (const r of caminho.reunioes.slice(0, REUNIOES_A_MOSTRAR)) {
    if (Math.abs(r.variacaoPP) > MAX_VARIACAO_PLAUSIVEL_PP) break;
    reunioes.push({
      data: r.data,
      variacaoPP: r.variacaoPP,
      acumuladoPP: r.acumuladoPP,
      // O NÍVEL sai da meta de hoje mais o que os preços embutem, e não do
      // CDI implícito: o CDI anda uns 0,10 p.p. abaixo da meta, e mostrar
      // "13,69%" ao lado de uma meta de 13,75% leria como corte.
      metaImplicita: metaHoje != null ? metaHoje + r.acumuladoPP : null,
      focus: doFocus.get(rotuloFocus(r.data)) ?? null,
    });
  }
  return {
    dataRef,
    metaHoje,
    cdiDePartida: caminho.cdiDePartida,
    reunioes,
    calendarioAte: CALENDARIO_ATE,
    calendarioConferidoEm: CALENDARIO_CONFERIDO_EM,
    // A data da pesquisa só viaja se alguma reunião da tela a usou.
    focusDe: reunioes.some((r) => r.focus != null) ? focus?.data ?? null : null,
    fonte: "B3 — ajustes do DI1 (arquivo público UP2DATA)",
  };
}

// ---------- /api/cdi ----------

// O CDI acumulado, dia a dia, como um ÍNDICE que começa em 1.
//
// PARA QUE: a Carteira compara cada compra com o que o mesmo dinheiro teria
// rendido no CDI desde a data da compra. A data da compra é da pessoa e NÃO
// vem para cá — o servidor manda a série inteira, igual para todo mundo, e o
// aparelho divide dois pontos dela. É por isso que este endpoint não aceita
// parâmetro nenhum, e não pode passar a aceitar.
//
// Série 12 do SGS (taxa DI em % ao dia). O índice num dia é o produto de
// (1 + taxa) de todos os dias até ele, inclusive.
const DIAS_DO_CDI = 3000; // cobre o histórico do app (2019) com folga

export async function getCdi() {
  const serie = JUROS_DIARIOS.find((j) => j.id === "cdi").serie;
  const pontos = await bcb.serie(serie, { dias: DIAS_DO_CDI });
  if (!pontos.length) {
    const erro = new Error("CDI indisponível no Banco Central agora");
    erro.status = 502;
    throw erro;
  }
  let indice = 1;
  const acumulado = pontos.map((p) => {
    indice *= 1 + p.close / 100;
    return [p.date, Number(indice.toFixed(8))];
  });
  return {
    fetchedAt: new Date().toISOString(),
    fonte: `BCB / SGS (série ${serie})`,
    desde: acumulado[0][0],
    ate: acumulado[acumulado.length - 1][0],
    pontos: acumulado,
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

  // `in`, e não `??`: o valor de MAX é null DE PROPÓSITO ("sem corte"), e o
  // `??` lia esse null como "período desconhecido" e caía em 1A. O botão MAX
  // mostrava um ano desde que existe — 246 pontos de um título com 1.957.
  const dias = tf in TF_DIAS ? TF_DIAS[tf] : TF_DIAS["1A"];
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
        // Onde a taxa de hoje cai dentro da própria janela: acima de quantos %
        // dos outros dias. É o que dá escala a "7,6% é muito ou pouco?" — a
        // média sozinha não diz se hoje é um extremo ou um dia qualquer.
        percentil: percentilDoUltimo(taxas),
      }
    : null;

  // O fluxo de caixa futuro, que é o que explica a duration de um título com
  // cupom: dá para ver o dinheiro voltando antes do vencimento. A LFT não tem
  // fluxo a mostrar nessa escala — ela rende Selic diária até o resgate.
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
    // O título contra a curva de juros futuros, na data do preço dele: o
    // prêmio e o que ele rende em 12 meses se a curva ficar onde está. null
    // para a LFT e quando não há futuro coletado naquela data.
    contraFuturo: contraFuturoDe(slug),
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
//
// E o IPCA+ vem em DUAS curvas, não uma. Zero-cupom e com cupom nunca caíram
// sobre a mesma curva — cinco vencimentos existem nas duas formas, com a mesma
// data e taxas diferentes. Desenhá-los juntos já tinha sido resolvido no
// gráfico (uma polilinha por família); em curvas separadas cada uma ganha
// também o próprio eixo Y, que é o que deixa a forma de cada uma legível em
// vez de espremida pela amplitude da outra.
//
// A prefixada segue a mesma regra: LTN num quadro, NTN-F noutro. São curvas
// magras — três e cinco pontos hoje — e é o preço de não misturar duas coisas
// que o mercado preça diferente.
const FAMILIAS_CURVA = [
  { id: "ipca-sem-cupom", nome: "IPCA+ sem cupom", tipos: ["ipca"], sufixo: "a.a. + IPCA" },
  { id: "ipca-com-cupom", nome: "IPCA+ com cupom", tipos: ["ipca-juros"], sufixo: "a.a. + IPCA" },
  { id: "pre-sem-cupom", nome: "Prefixado sem cupom", tipos: ["prefixado"], sufixo: "a.a." },
  { id: "pre-com-cupom", nome: "Prefixado com cupom", tipos: ["prefixado-juros"], sufixo: "a.a." },
];

// Os tipos que formam cada curva INTEIRA. A separação acima é de tela; a
// inflação implícita continua saindo das duas curvas completas, como sempre
// saiu. Trocar a base dela junto com um ajuste visual mexeria, calado, no
// número que decide entre IPCA+ e Prefixado.
//
// Estas duas listas são a razão de a implícita não ter quebrado ao separar as
// curvas: ela nunca leu de `curvas`, lê daqui.
const TIPOS_REAL = ["ipca", "ipca-juros"];
const TIPOS_PREFIXADA = ["prefixado", "prefixado-juros"];

// Interpola uma curva (ordenada por prazo) num prazo qualquer, linearmente.
// Devolve null FORA do intervalo observado — extrapolar a ponta longa de uma
// curva de juros é inventar o número mais sensível da tela.
function interporTaxa(pontos, anos) {
  if (!pontos.length || anos < pontos[0].anos || anos > pontos[pontos.length - 1].anos) return null;
  for (let i = 1; i < pontos.length; i++) {
    if (pontos[i].anos >= anos) {
      const a = pontos[i - 1];
      const b = pontos[i];
      const vao = b.anos - a.anos;
      if (vao <= 0) return b.taxa;
      return a.taxa + ((anos - a.anos) / vao) * (b.taxa - a.taxa);
    }
  }
  return null;
}

// Inflação implícita (breakeven) pela relação de Fisher, não pela subtração:
// (1+nominal)/(1+real) − 1. Nesses níveis a diferença importa — a 14,33% nominal
// contra 7,57% real, subtrair dá 6,76% e a conta certa dá 6,29%, quase meio
// ponto de diferença no número que decide entre IPCA+ e Prefixado.
//
// O prazo de cada ponto nominal vira a grade, e a curva real é INTERPOLADA nele:
// LTN/NTN-F vencem em 01/01 e NTN-B em 15/05 ou 15/08, então não há par exato
// para casar. Pontos nominais no mesmo prazo (uma LTN e uma NTN-F de 2031, por
// exemplo) entram como média — senão a curva derivada herdaria o dente de serra
// de misturar dois instrumentos.
function inflacaoImplicita(real, nominal) {
  if (!real.length || !nominal.length) return [];
  const porPrazo = new Map();
  for (const p of nominal) {
    const chave = p.anos.toFixed(2);
    const g = porPrazo.get(chave) || { anos: p.anos, vencimento: p.vencimento, soma: 0, n: 0 };
    g.soma += p.taxa;
    g.n += 1;
    porPrazo.set(chave, g);
  }
  return [...porPrazo.values()]
    .map((g) => {
      const nom = g.soma / g.n;
      const r = interporTaxa(real, g.anos);
      if (r == null) return null;
      const taxa = ((1 + nom / 100) / (1 + r / 100) - 1) * 100;
      return { anos: g.anos, vencimento: g.vencimento, taxa: arred(taxa, 2), nominal: arred(nom, 2), real: arred(r, 2) };
    })
    .filter(Boolean)
    .sort((a, b) => a.anos - b.anos);
}

// Prazo mínimo para um título valer como PONTO DE CURVA.
//
// Perto do vencimento a taxa anualizada explode: um ruído pequeno no PU vira
// pontos percentuais quando o prazo tende a zero. Medindo o desvio absoluto de
// cada ponto contra a barriga da própria curva (3–6a) NA MESMA DATA, ao longo de
// todo o histórico:
//
//   IPCA+       1,00a: 1,88pp · 1,25a: 1,11pp · 1,50a: 0,38pp · 1,75a: 0,37pp
//   Prefixado   0,75a: 3,43pp · 1,00a: 1,89pp · 1,50a: 1,80pp   (p90)
//
// Em 1,5a o desvio do IPCA+ cai por um fator de três e estabiliza; o prefixado
// já está no patamar baixo. Abaixo disso o ponto não descreve a curva, descreve
// o vencimento chegando — o mesmo motivo pelo qual títulos vencidos ficam fora
// do arquivo-ponte. Vale para as TRÊS curvas, senão a de hoje e a de um ano
// atrás não começariam no mesmo lugar, que é justamente o que se quer comparar.
const PRAZO_MINIMO_CURVA = 1.5;

// ---------- /api/futuros ----------

// As duas curvas do mercado futuro da B3, lidas do arquivo-ponte que o coletor
// acumula. Endpoint próprio, e não um campo a mais no /api/curva, por dois
// motivos: a fonte é outra (B3, não Tesouro) e a falha é independente — um dia
// sem coleta da B3 não pode esvaziar a curva dos títulos, que está perfeita.
//
// CADA CURVA FICA NA SUA MOLDURA, com o x na PRÓPRIA convenção: dias
// úteis/252 no DI, dias corridos/360 no cupom. A alternativa seria inventar um
// eixo comum em anos corridos só para as duas caberem lado a lado — uma
// terceira régua, criada para o desenho e não para a matemática, logo depois
// de o repositório ter gasto quatro PRs para ficar com uma régua só por
// sentido. Molduras separadas custam mais pixels e não custam verdade.
// A montagem é PURA e recebe o arquivo em vez de lê-lo, pelo mesmo motivo que
// os parsers são exportados: com a semente vazia (que é o estado até a
// primeira coleta) não haveria como exercitar nada, e a lógica da curva
// chegaria à tela sem um teste sequer. O verificar passa duas datas de
// mentira aqui e confere a seleção, a ordenação e o vértice.
export function curvasDeFuturos(arquivo) {
  const contratos = Object.entries(arquivo?.contratos || {});

  // Todas as datas já coletadas, para achar "hoje" e "um mês atrás" dentro do
  // que existe. A B3 serve poucos meses e o histórico nasce da primeira
  // coleta, então pedir uma data que ainda não foi coletada é o caso NORMAL no
  // começo — e tem de devolver nada, não um erro.
  const datas = new Set();
  for (const [, c] of contratos) for (const d of Object.keys(c.serie || {})) datas.add(d);
  const ordenadas = [...datas].sort();
  const ultima = ordenadas[ordenadas.length - 1] || null;

  // A data coletada mais próxima de 30 dias atrás, nunca a mais recente: sem
  // esse piso, no primeiro mês de vida "um mês atrás" seria o próprio dia de
  // hoje e o gráfico mostraria duas linhas idênticas como se fossem duas
  // leituras.
  const alvoMes = ultima ? new Date(Date.parse(ultima) - 30 * 86400000).toISOString().slice(0, 10) : null;
  const umMes = alvoMes ? [...ordenadas].reverse().find((d) => d <= alvoMes) || null : null;

  const dias = (a, b) => Math.round((Date.parse(b) - Date.parse(a)) / 86400000);

  // Um ponto por contrato vivo NAQUELA data, com a taxa daquele dia. Mesma
  // regra da curva dos títulos: a curva de um mês atrás é feita do que estava
  // vivo um mês atrás, não do que está vivo hoje.
  const pontosEm = (dataISO, filtro, prazo) => {
    if (!dataISO) return [];
    return contratos
      .filter(([, c]) => filtro(c) && c.vencimento > dataISO && c.serie?.[dataISO]?.[0] != null)
      .map(([ticker, c]) => ({
        slug: ticker,
        nome: ticker,
        vencimento: c.vencimento,
        anos: prazo(dataISO, c.vencimento),
        taxa: c.serie[dataISO][0],
        pu: c.serie[dataISO][1] ?? null,
        // CurvaChart separa por família e pede o campo; aqui não há cupom, e
        // um ponto sem a chave cairia num grupo só, calado.
        comCupom: false,
      }))
      .sort((a, b) => a.anos - b.anos);
  };

  const prazoUtil = (de, ate) => anosUteisEntre(de, ate);
  const prazoCorrido = (de, ate) => dias(de, ate) / 360;

  const ehDI = (c) => c.ativo === "DI1";
  const ehFRC = (c) => c.ativo === "FRC";
  const ehDAP = (c) => c.ativo === "DAP";

  // O vértice curto: o DDI mais curto vivo na data. Não é ponto de curva — a
  // taxa dele é cupom SUJO, contaminada pela variação cambial desde a PTAX do
  // dia anterior — mas sem ele a tela não tem como dizer por que a curva em
  // USD começa onde começa.
  const verticeEm = (dataISO) => {
    if (!dataISO) return null;
    const vivos = contratos
      .filter(([, c]) => c.ativo === "DDI" && c.vencimento > dataISO && c.serie?.[dataISO]?.[0] != null)
      .sort((a, b) => a[1].vencimento.localeCompare(b[1].vencimento));
    if (!vivos.length) return null;
    const [ticker, c] = vivos[0];
    return { slug: ticker, vencimento: c.vencimento, dias: dias(dataISO, c.vencimento), taxaSuja: c.serie[dataISO][0] };
  };

  // O PISO DA PONTA CURTA DA DAP, e por que ele existe.
  //
  // Medido em 30/10/2026: a DAP marca 8,26% em 10 dias úteis, MERGULHA até
  // 4,82% em abril de 2027 e volta a 7,79% em 2028. Não é ruído — é o IPCA já
  // conhecido dos próximos meses dominando um prazo curto, a mesma família de
  // problema que o DDI curto tem, por mecanismo diferente.
  //
  // O piso é o mesmo PRAZO_MINIMO_CURVA que as curvas do Tesouro usam, e a
  // escolha é conservadora de propósito: os vértices distorcidos observados
  // param em 0,53 a, o primeiro limpo está em 1,20 a, e NÃO HÁ VENCIMENTO
  // ENTRE OS DOIS para localizar a fronteira. Sem poder medir onde a
  // distorção acaba, perder um vértice bom é melhor que desenhar um ruim.
  //
  // Os excluídos não somem: viajam em `curtos` para a tela poder dizer o que
  // ficou de fora e por quê — mesmo tratamento do vértice sujo do DDI.
  const dentroDoPiso = (p) => p.anos >= PRAZO_MINIMO_CURVA;
  const curtosEm = (dataISO) => pontosEm(dataISO, ehDAP, prazoUtil).filter((p) => !dentroDoPiso(p));

  // `curto` é o rótulo do seletor da tela: três posições numa peça só não
  // comportam "Cupom de IPCA (juro real)" a 360px. Diz a moeda da curva e o
  // instrumento de onde ela sai; o nome completo segue no ⓘ e no gráfico.
  const curvas = [
    {
      id: "di-pre",
      nome: "DI × pré",
      curto: "Pré (DI)",
      sufixo: "% a.a.",
      convencao: "dias úteis/252, exponencial",
      agora: pontosEm(ultima, ehDI, prazoUtil),
      umMesAtras: pontosEm(umMes, ehDI, prazoUtil),
    },
    {
      id: "cupom-limpo",
      nome: "Cupom cambial limpo",
      curto: "Dólar (FRC)",
      sufixo: "% a.a. US$",
      convencao: "dias corridos/360, linear",
      agora: pontosEm(ultima, ehFRC, prazoCorrido),
      umMesAtras: pontosEm(umMes, ehFRC, prazoCorrido),
      vertice: verticeEm(ultima),
    },
    {
      id: "cupom-ipca",
      nome: "Cupom de IPCA (juro real)",
      curto: "IPCA (DAP)",
      // "+ IPCA" e não "real": é como o app rotula taxa real em todo lugar
      // (unidadeTaxa em format.js, o sufixo das curvas do Tesouro logo acima).
      // Quem compara esta curva com a de NTN-B tem de ver a mesma unidade nas
      // duas, senão a comparação exige uma tradução que a tela não deu.
      sufixo: "% a.a. + IPCA",
      convencao: "dias úteis/252, exponencial",
      agora: pontosEm(ultima, ehDAP, prazoUtil).filter(dentroDoPiso),
      umMesAtras: pontosEm(umMes, ehDAP, prazoUtil).filter(dentroDoPiso),
      curtos: curtosEm(ultima),
    },
  ];

  return {
    data: ultima,
    comparadoCom: umMes,
    diasColetados: ordenadas.length,
    // Antes da primeira coleta o arquivo é a semente, e a tela mostra
    // "aguardando coleta" em vez de um gráfico vazio com cara de defeito.
    pendente: !ultima,
    curvas,
    nota:
      "A curva em dólar sai do FRC, que é a taxa a termo a partir do primeiro vencimento de DDI em aberto — " +
      "o cupom limpo. Por isso ela começa nesse vértice, e não em D0: ancorar em hoje exigiria a taxa spot, " +
      "que não está em fonte pública gratuita. O vértice curto aparece à parte, com a taxa suja, que carrega " +
      "a variação do câmbio desde a PTAX do dia anterior. A curva de cupom de IPCA é a contraparte de " +
      "mercado da NTN-B — mesmo juro real, outro emissor — e sai da DAP, na mesma convenção do DI1.",
    historicoNota:
      ordenadas.length < 25
        ? // A data vai em dd/mm/aaaa: é texto para a tela, e o ISO cru
          // ("2026-10-22") era a única data fora do padrão do app.
          `O histórico começou em ${brDeISO(ordenadas[0]) || "—"} e cresce a cada coleta: a comparação com um mês atrás fica completa com o tempo.`
        : null,
    fonte: arquivo?.fonte || "B3",
    aviso: AVISO,
  };
}

export async function getFuturos() {
  return curvasDeFuturos(cache.futuros());
}

export async function getCurva() {
  const hoje = hojeISO();
  const todos = cache.titulos().filter((t) => t.taxa != null);

  const montarCurva = (tipos) => {
    const daFamilia = todos.filter((t) => tipos.includes(t.tipo));

    // Uma curva "na data X" é feita dos títulos que estavam VIVOS em X, não dos
    // que estão vivos hoje. Montar a curva de um ano atrás só com os vivos de
    // hoje apaga justamente os vencimentos que venceram nesse meio-tempo — a
    // ponta curta some, e a linha tracejada começava um ano mais à direita que
    // a de hoje (na real: 3,67a em vez de 2,67a). Quem lesse "o curto prazo
    // estava diferente" estaria lendo o recorte, não o mercado. O histórico
    // guarda os vencidos justamente para isto.
    const curvaEm = (dataISO) =>
      daFamilia
        .filter((t) => t.vencimento > dataISO)
        .map((t) => {
          const serie = cache.serieDe(t.slug).filter((x) => x.date <= dataISO);
          const ult = serie[serie.length - 1];
          if (ult?.taxa == null) return null;
          const doCatalogo = porSlug[t.slug] || null;
          // Duration calculada NA DATA DA CURVA, com a taxa daquele dia — não a
          // de hoje. A duration de um título encurta com o tempo e reage ao
          // nível da taxa; reaproveitar a de hoje na curva de um ano atrás
          // deslocaria a linha inteira no eixo, que é exatamente o que se quer
          // comparar. LFT nunca chega aqui (fica fora das duas famílias).
          const dur = calcularDuration({
            vencimentoISO: t.vencimento,
            comCupom: t.comCupom,
            cupomAnual: t.cupomAnual ?? undefined,
            taxaReal: ult.taxa / 100,
            hojeISO: dataISO,
          });
          return {
            slug: t.slug,
            tipo: t.tipo,
            nome: doCatalogo?.nome || rotuloGenerico(t.tipo, t.vencimento),
            vencimento: t.vencimento,
            anos: anosUteisEntre(dataISO, t.vencimento),
            duration: arred(dur.macaulay, 2),
            comCupom: t.comCupom === true,
            taxa: ult.taxa,
            data: ult.date,
            destaque: doCatalogo?.destaque === true,
          };
        })
        .filter(Boolean)
        .filter((p) => p.anos >= PRAZO_MINIMO_CURVA)
        .sort((a, b) => a.anos - b.anos);

    const diasAtras = (n) => new Date(Date.now() - n * 864e5).toISOString().slice(0, 10);
    return { agora: curvaEm(hoje), umMesAtras: curvaEm(diasAtras(30)), umAnoAtras: curvaEm(diasAtras(365)) };
  };

  const curvas = FAMILIAS_CURVA.map((f) => ({ id: f.id, nome: f.nome, sufixo: f.sufixo, ...montarCurva(f.tipos) }));
  // Curvas combinadas: NÃO vão para a tela, existem só para a implícita.
  const real = montarCurva(TIPOS_REAL);
  const prefixada = montarCurva(TIPOS_PREFIXADA);

  // O FOCUS AO LADO DA IMPLÍCITA: a inflação média que a pesquisa espera no
  // MESMO período de cada ponto (de hoje ao vencimento do prefixado). Só nos
  // pontos que a pesquisa alcança — ela vai uns quatro anos à frente, e além
  // disso o campo é null, não a última mediana repetida.
  const focusIpca = cache.focus().ipca;
  const implicitaAgora = inflacaoImplicita(real?.agora || [], prefixada?.agora || []).map((p) => {
    const esperado = focusNoPeriodo(focusIpca?.anos, hoje, p.vencimento);
    return { ...p, focus: esperado == null ? null : arred(esperado, 2) };
  });

  // CADA TÍTULO CONTRA O FUTURO NO MESMO PRAZO. Todos os vivos das quatro
  // curvas, o piso inclusive: aqui não é ponto de curva, é uma linha de
  // tabela — e quem não tem leitura (prazo fora da curva de futuros) vem com
  // os campos null, em vez de sumir.
  const contraFuturo = FAMILIAS_CURVA.flatMap((f) =>
    todos
      .filter((t) => f.tipos.includes(t.tipo) && t.vencimento > hoje)
      .sort((a, b) => (a.vencimento < b.vencimento ? -1 : 1))
      .map((t) => {
        const leitura = contraFuturoDe(t.slug);
        const doCatalogo = porSlug[t.slug] || null;
        return {
          slug: t.slug,
          curva: f.id,
          nome: doCatalogo?.nome || rotuloGenerico(t.tipo, t.vencimento),
          vencimento: t.vencimento,
          comCupom: t.comCupom === true,
          taxa: t.taxa,
          data: t.data,
          ...(leitura || { ativo: FUTURO_DA_FAMILIA[t.tipo], taxaFuturo: null, premioPP: null, media: null, parado: null }),
        };
      })
  );
  const comLeitura = contraFuturo.filter((l) => l.premioPP != null);

  return {
    fetchedAt: new Date().toISOString(),
    atualizadoEm: cache.historico().atualizadoEm,
    pendente: curvas.every((c) => c.agora.length === 0),
    curvas,
    // null enquanto não há futuro coletado na data do preço de título nenhum
    // (antes da primeira coleta da B3, ou num dia em que ela faltou).
    contraFuturo: comLeitura.length
      ? {
          linhas: contraFuturo,
          // As datas travam juntas por construção (ver contraFuturoDe); vão no
          // payload para a tela DIZER a data, que é o que a regra pede.
          data: comLeitura.reduce((m, l) => (l.data > m ? l.data : m), ""),
          pregoes: pregoesColetados().length,
          desde: pregoesColetados()[0] ?? null,
          fonte: cache.futuros().fonte || "B3",
        }
      : null,
    focus: focusIpca?.anos?.length ? { data: focusIpca.data, anos: focusIpca.anos, fonte: cache.focus().fonte } : null,
    implicita: {
      agora: implicitaAgora,
      umMesAtras: inflacaoImplicita(real?.umMesAtras || [], prefixada?.umMesAtras || []),
      umAnoAtras: inflacaoImplicita(real?.umAnoAtras || [], prefixada?.umAnoAtras || []),
    },
    // Vai no payload para o ⓘ da Curva citar o piso sem copiá-lo à mão: um
    // "1,5 ano" escrito no componente ficaria mentindo no dia em que o piso
    // mudasse aqui.
    prazoMinimo: PRAZO_MINIMO_CURVA,
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

// O panorama de mercado: as três decisões de política monetária (Copom ao vivo
// pelo BCB; Fed e BCE do arquivo versionado dados/global.json), e uma grade de
// indicadores com a MESMA escala de janelas — 1 dia, 1 semana, 1 mês, no ano e
// 12 meses — para câmbio, juros e bolsas.
//
// A escala única é o ponto da tela: só assim dá para pôr lado a lado "o IPCA+
// 2035 paga 7,6% real" e "o CDI rendeu 9,4% no ano, o Ibovespa 12%".

// Preço e taxa não medem a mesma coisa, e a grade diz qual é qual em `base`:
//
//   base: "preco"   — variação do próprio valor (câmbio e bolsas). Óbvio.
//   base: "retorno"  — quanto R$ 1 aplicado à taxa rendeu na janela (Selic e
//                      CDI), composto dia a dia. NÃO é a variação do nível da
//                      taxa: o CDI sair de 13,65% para 13,90% é +0,25 p.p., e
//                      isso não se compara com "Ibovespa +12%". O que se
//                      compara é o retorno, e é ele que está aqui.
//
// O nível anualizado continua na coluna "último" — é como a taxa se cota.
// As duas funções abaixo são PURAS e exportadas para o verificar.mjs
// exercitá-las com fixture — mesmo motivo dos parsers. Sem rede não há como
// conferir a grade inteira aqui dentro, e é justamente a aritmética de janelas
// que erra calada.

// A janela de 1 dia é o ÚLTIMO PONTO contra o anterior, e não "24 horas atrás":
// numa segunda-feira o dia anterior é sexta, e num feriado é o pregão de antes.
// Pedir 1 dia corrido devolveria null toda segunda.
function variacaoUmDia(pontos) {
  if (!Array.isArray(pontos) || pontos.length < 2) return null;
  const ult = pontos[pontos.length - 1];
  const ant = pontos[pontos.length - 2];
  if (ult?.close == null || ant?.close == null || !ant.close) return null;
  return {
    pct: ((ult.close - ant.close) / ant.close) * 100,
    de: ant.date,
    ate: ult.date,
    valorDe: ant.close,
    valorAte: ult.close,
  };
}

// No retorno, "1 dia" é a taxa do próprio dia — R$ 1 rendeu isso ontem para
// hoje. Não há divisão a fazer: o ponto já é a taxa diária.
function retornoUmDia(pontosDiarios) {
  const ult = pontosDiarios?.[pontosDiarios.length - 1];
  if (ult?.close == null) return null;
  return { pct: ult.close, de: ult.date, ate: ult.date };
}

// Quantos meses separam AAAA-MM de hoje.
function mesesDesde(mesISO) {
  const [ay, am] = String(mesISO).split("-").map(Number);
  const hoje = new Date();
  return (hoje.getUTCFullYear() - ay) * 12 + (hoje.getUTCMonth() + 1 - am);
}

export function janelasDePreco(pontos) {
  return {
    var1d: variacaoUmDia(pontos),
    var1sem: variacaoPeriodo(pontos, 7),
    var1mes: variacaoPeriodo(pontos, 30),
    varAno: variacaoNoAno(pontos),
    var12m: variacaoPeriodo(pontos, 365),
  };
}

export function janelasDeRetorno(pontosDiarios) {
  return {
    var1d: retornoUmDia(pontosDiarios),
    var1sem: retornoPeriodo(pontosDiarios, 7),
    var1mes: retornoPeriodo(pontosDiarios, 30),
    varAno: retornoNoAno(pontosDiarios),
    var12m: retornoPeriodo(pontosDiarios, 365),
  };
}

export const JANELAS = ["var1d", "var1sem", "var1mes", "varAno", "var12m"];

// Cada grupo declara as PRÓPRIAS colunas, porque nem todos medem a mesma coisa.
// Câmbio, juros e bolsas têm as cinco janelas diárias; inflação tem três
// mensais e ponto — mostrar "1 dia" para um índice que sai uma vez por mês
// seriam duas colunas vazias fingindo que o dado poderia existir.
const COLUNAS_DIARIAS = [
  { id: "var1d", rotulo: "1d" },
  { id: "var1sem", rotulo: "1 sem" },
  { id: "var1mes", rotulo: "1 mês" },
  { id: "varAno", rotulo: "No ano" },
  { id: "var12m", rotulo: "12 m" },
];
const COLUNAS_INFLACAO = [
  { id: "mes", rotulo: "No mês" },
  { id: "ano", rotulo: "No ano" },
  { id: "doze", rotulo: "12 meses" },
];

export async function getMercado() {
  // Tudo em paralelo e tudo tolerante: macro (BCB), as cinco bolsas (Yahoo) e
  // as duas séries diárias de juros. Nenhuma fonte pode derrubar as outras.
  //
  // As séries do SGS são lidas AQUI, inteiras, e não aproveitadas de `getMacro`:
  // aquele payload devolve `pontos: dado.pontos.slice(-120)`, e 120 pontos
  // diários são uns seis meses. Calcular as janelas em cima do array cortado
  // dava 1 semana e 1 mês certos e `null` calado em "no ano" e "12 meses" —
  // exatamente a armadilha que o CLAUDE.md descreve, e na qual esta tela caiu.
  // O bcb.serie tem cache em processo, então ler de novo não custa requisição.
  const SERIES_CAMBIO = ["usdbrl", "eurbrl"].map((id) => ({ id, serie: macroPorId[id].serie }));
  const [macro, indices, inflacoes, brutas] = await Promise.all([
    getMacro().catch(() => ({ indicadores: {} })),
    todosIndices().catch(() => []),
    todasInflacoes().catch(() => []),
    Promise.allSettled(
      [...SERIES_CAMBIO, ...JUROS_DIARIOS].map((x) => bcb.serie(x.serie, { dias: 800 }).then((pts) => [x.id, pts]))
    ),
  ]);
  const serieDe = {};
  for (const r of brutas) if (r.status === "fulfilled" && r.value) serieDe[r.value[0]] = r.value[1];
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

  // --- Câmbio: PTAX, preço puro.
  //
  // A linha sai SEMPRE, mesmo sem dado — mesma regra da Moldura do Painel: uma
  // linha que some reflui a grade e esconde que a fonte caiu. Sem dado ela
  // mostra "—" e o id entra em `indisponiveis`.
  const cambio = SERIES_CAMBIO.map(({ id }) => {
    const meta = macroPorId[id];
    const pts = serieDe[id] || [];
    const ult = pts[pts.length - 1];
    return {
      id,
      nome: meta.nome,
      sub: "PTAX venda",
      valor: ind[id]?.valor ?? ult?.close ?? null,
      casas: 4,
      unidade: "BRL",
      data: ind[id]?.data ?? ult?.date ?? null,
      base: "preco",
      ...janelasDePreco(pts),
      fonte: `BCB / SGS (série ${meta.serie})`,
    };
  });

  // EUR/USD sai do CRUZAMENTO das duas linhas acima, não de uma terceira série:
  // o SGS não publica o par, e o que ele publica são as duas pernas em real do
  // mesmo fixing. Dividir uma pela outra cancela o real — com a vantagem de a
  // grade fechar consigo mesma: 5,9126 ÷ 5,1575 é o 1,1464 da terceira linha,
  // conferível na própria tela.
  //
  // EUR/USD e não USD/EUR por dois motivos que apontam para o mesmo lado. É
  // como o mercado cota o par, e é também o que mantém a leitura das três
  // linhas idêntica: "XXX/YYY" é o preço de XXX em YYY, então 5,1575 reais por
  // dólar, 5,9126 reais por euro e 1,1464 dólares por euro.
  const serieEurUsd = cruzarSeries(serieDe.eurbrl, serieDe.usdbrl);
  const ultEurUsd = serieEurUsd[serieEurUsd.length - 1];
  cambio.push({
    id: "eurusd",
    nome: "EUR/USD",
    // A data é a do último dia em que as DUAS pernas existem. Num feriado só de
    // um lado a linha fica um dia atrás das vizinhas — e diz isso, em vez de
    // cruzar dias diferentes para parecer atual.
    sub: "PTAX cruzada",
    valor: ultEurUsd?.close ?? null,
    casas: 4,
    unidade: "USD",
    data: ultEurUsd?.date ?? null,
    base: "preco",
    ...janelasDePreco(serieEurUsd),
    fonte: `BCB / SGS (séries ${macroPorId.eurbrl.serie} ÷ ${macroPorId.usdbrl.serie})`,
  });

  // --- Juros: nível anualizado na coluna do valor, retorno composto nas
  // janelas. As duas metades vêm de séries diferentes do mesmo SGS.
  const juros = JUROS_DIARIOS.map((j) => {
    const nivel = ind[j.id];
    const pts = serieDe[j.id] || [];
    return {
      id: j.id,
      nome: j.nome,
      sub: nivel ? j.subNivel : "acumulado",
      valor: nivel?.valor ?? null,
      casas: 2,
      unidade: "%_ANO",
      data: nivel?.data ?? pts[pts.length - 1]?.date ?? null,
      base: "retorno",
      ...janelasDeRetorno(pts),
      fonte: `BCB / SGS (séries ${macroPorId[j.id]?.serie ?? "?"} e ${j.serie})`,
    };
  });

  // --- Bolsas: preço puro, cada praça com a sua data.
  const bolsas = INDICES.map((meta) => {
    const i = indices.find((x) => x?.id === meta.id && !x.erro);
    if (!i) {
      return {
        id: meta.id, nome: meta.nome, sub: meta.praca, valor: null, casas: meta.casas,
        unidade: "PONTOS", moeda: meta.moeda, data: null, base: "preco",
        var1d: null, var1sem: null, var1mes: null, varAno: null, var12m: null,
        fonte: `Yahoo Finance (${meta.simbolo})`,
      };
    }
    return ({
      id: i.id,
      nome: i.nome,
      sub: i.praca,
      valor: i.valor,
      casas: i.casas,
      unidade: "PONTOS",
      moeda: i.moeda,
      data: i.data,
      base: "preco",
      ...janelasDePreco(i.pontos),
      fonte: `Yahoo Finance (${i.simbolo})`,
    });
  });

  // --- Inflação: janelas MENSAIS, uma linha por região. Sai sempre, como as
  // outras; sem dado mostra "—" e o id entra em `indisponiveis`.
  const inflacao = INFLACAO.map((meta) => {
    const d = inflacoes.find((x) => x?.id === meta.id && !x.erro);
    return {
      id: meta.id,
      nome: meta.nome,
      sub: meta.regiao,
      mesReferencia: d?.mesReferencia ?? null,
      // Índice mensal atrasa uma ou duas publicações; mais que isso a tela tem
      // de DIZER, senão um número de meses atrás aparece com a mesma cara de um
      // de ontem. É a mesma regra dos preços dos títulos, que carregam
      // `desatualizado` em vez de sumirem ou fingirem frescor.
      desatualizado: d?.mesReferencia ? mesesDesde(d.mesReferencia) > 3 : false,
      mesesAtras: d?.mesReferencia ? mesesDesde(d.mesReferencia) : null,
      valor: null,
      unidade: "%_MES",
      base: "inflacao",
      mes: d?.mes ?? null,
      ano: d?.ano ?? null,
      doze: d?.doze ?? null,
      nota: meta.nota,
      fonte: meta.fonte,
    };
  });

  // Uma linha sem valor NENHUM é fonte fora do ar; a tela nomeia quais.
  const indisponiveis = [
    ...[...cambio, ...juros, ...bolsas].filter((l) => l.valor == null),
    ...inflacao.filter((l) => !l.mes && !l.ano && !l.doze),
  ].map((l) => l.id);

  return {
    fetchedAt: new Date().toISOString(),
    decisoes: { copom, fed: g.fed, bce: g.bce },
    // O que o DI futuro embute para as próximas reuniões do Copom. Sai do
    // arquivo versionado de futuros, então existe mesmo com o BCB fora do ar —
    // só o nível (meta implícita) depende da meta de hoje.
    selicImplicita: selicImplicitaDe(cache.futuros(), { cdiHoje: ind.cdi?.valor ?? null, metaHoje: ind.selic?.valor ?? null, focus: cache.focus().selic }),
    globaisAtualizadosEm: g.atualizadoEm,
    grupos: [
      // `mostrarBase`: a cotação que entrou na conta aparece embaixo do
      // percentual. Só no câmbio por ora — é onde o número comparado é uma
      // cotação que a pessoa reconhece de cabeça. O dado vai no payload de toda
      // linha de PREÇO, então estender às bolsas é virar esta chave.
      { id: "cambio", nome: "Câmbio", colunas: COLUNAS_DIARIAS, comValor: true, mostrarBase: true, linhas: cambio },
      { id: "juros", nome: "Juros", colunas: COLUNAS_DIARIAS, comValor: true, linhas: juros },
      { id: "bolsas", nome: "Bolsas", colunas: COLUNAS_DIARIAS, comValor: true, linhas: bolsas },
      // Sem coluna de valor: o NÍVEL de um índice de preços (CPI = 327,4) não
      // diz nada a ninguém. O que se lê de inflação é a variação.
      { id: "inflacao", nome: "Inflação", colunas: COLUNAS_INFLACAO, comValor: false, linhas: inflacao },
    ].filter((gr) => gr.linhas.length),
    indisponiveis,
    // Mantidos porque o formato antigo é lido em outros pontos da tela; a grade
    // acima é a fonte nova e mais completa.
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
