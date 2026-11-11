// server/util.js — utilidades compartilhadas: parsing pt-BR, datas e a
// matemática de títulos (fluxo de caixa, duration e convexidade).
//
// A NTN-B é um título indexado ao IPCA: o principal é corrigido pelo índice
// (o VNA) e, sobre esse valor corrigido, o título paga uma TAXA REAL. É essa
// taxa real que negocia no mercado e é ela que este app acompanha.
//
// Duas famílias, que se comportam de formas bem diferentes:
//   - Tesouro IPCA+ ("NTN-B Principal"): zero-cupom, um único pagamento no
//     vencimento. A duration é simplesmente o prazo.
//   - Tesouro IPCA+ com Juros Semestrais ("NTN-B"): paga cupom de 6% a.a. em
//     duas parcelas por ano. Como parte do dinheiro volta antes, a duration é
//     bem menor que o prazo — e é por isso que ela precisa ser calculada, não
//     lida do prazo.
//
// A duration é a escala de sensibilidade a juros: quanto o preço se mexe quando
// a taxa real se mexe. Para um horizonte longo (e para comparar posições), ela
// diz mais do que a taxa sozinha.

import { diasUteis, ehDiaUtil } from "./feriados.js";

// ---------- Constantes do título ----------

// Cupons dos títulos com juros semestrais. A parcela do semestre é a taxa
// equivalente composta — (1+c)^(1/2) − 1 —, não c/2:
//   NTN-B  paga 6% a.a.  -> 2,9563% por semestre
//   NTN-F  paga 10% a.a. -> 4,8809% por semestre
export const CUPOM_ANUAL_NTNB = 0.06;
export const CUPOM_SEMESTRAL_NTNB = Math.pow(1 + CUPOM_ANUAL_NTNB, 1 / 2) - 1;
export const CUPOM_ANUAL_NTNF = 0.10;
export const CUPOM_SEMESTRAL_NTNF = Math.pow(1 + CUPOM_ANUAL_NTNF, 1 / 2) - 1;

// Convenção de contagem de tempo: DIAS ÚTEIS/252, que é como o Tesouro e a
// ANBIMA precificam as três famílias — LTN/NTN-F, NTN-B e LFT. O repositório
// usou dias corridos/365 até 10/2026, por não ter calendário de feriados, e
// documentava a diferença como desprezível. Ela é desprezível para a duration
// (razão ponderada, onde a convenção quase toda se cancela) e não é para o
// preço: o PU reconstruído das LTN errava de −0,09% a −0,50%, crescendo com o
// prazo, e o valor final da Calculadora no IPCA+ 2050 saía 1,08% alto.
// scripts/verificar.mjs agora confere isso contra o PU oficial.
export const DIAS_UTEIS_ANO = 252;
const MS_DIA = 86400000;

// Faixas de tolerância para considerar um preço "desatualizado", em dias úteis.
// O arquivo do Tesouro é diário, mas só sai em dia de pregão — e o coletor roda
// depois do fechamento, então 3 dias úteis cobre feriado prolongado sem alarme
// falso.
export const LIMITE_DIAS_UTEIS = { diaria: 3, mensal: 45 };
export const ROTULO_PERIODICIDADE = { diaria: "diário", mensal: "mensal" };

// ---------- Texto e números em pt-BR ----------

// Remove acentos para comparações tolerantes. Os arquivos públicos brasileiros
// oscilam entre UTF-8 e ISO-8859-1; comparar sem acento faz o casamento de
// rótulos funcionar nos dois casos.
export function semAcento(txt) {
  return String(txt ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export function normalizar(txt) {
  return semAcento(txt).toLowerCase().replace(/\s+/g, " ").trim();
}

// "1.712,39", "7,05", "-1,46", "", "-" -> Number ou null.
// Ponto = milhar, vírgula = decimal (formato brasileiro).
export function parseNumBR(txt) {
  if (txt == null) return null;
  const s = String(txt).trim();
  if (!s || /^\*+$|^-+$|^n\/?d$|s\/\s*cota|indispon/i.test(s)) return null;
  const limpo = s.replace(/[^\d.,+-]/g, "");
  if (!limpo || /^[+-]?$/.test(limpo)) return null;
  const num = Number(limpo.replace(/\./g, "").replace(",", "."));
  return Number.isFinite(num) ? num : null;
}

// ---------- Datas ----------

// "15/05/2035" -> "2035-05-15". Aceita também "15/05/35".
export function isoDeBR(dataBR) {
  if (!dataBR) return null;
  const m = String(dataBR).trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
  if (!m) return null;
  const [, d, mes, a] = m;
  const ano = a.length === 2 ? String(2000 + Number(a)) : a;
  return `${ano}-${mes.padStart(2, "0")}-${d.padStart(2, "0")}`;
}

export function brDeISO(iso) {
  if (!iso) return null;
  const [a, m, d] = String(iso).slice(0, 10).split("-");
  return a && m && d ? `${d}/${m}/${a}` : null;
}

export function hojeISO() {
  return new Date().toISOString().slice(0, 10);
}

// Data ISO -> Date em UTC (evita o deslocamento de fuso que faria "2035-05-15"
// virar 14/05 em máquinas a oeste de Greenwich).
export function dataDeISO(iso) {
  const [a, m, d] = String(iso).slice(0, 10).split("-").map(Number);
  return new Date(Date.UTC(a, m - 1, d));
}

// Prazo em anos na convenção do mercado. O nome diz "úteis" de propósito: a
// convenção foi invisível uma vez e custou meses de preço torto, então quem
// ler uma chamada destas vê em que base ela conta sem abrir este arquivo.
//
// Vale para TUDO — desconto de fluxo, duration, eixo da curva e o prazo
// exibido. Uma convenção só: o Detalhe compara "duration de 7,2 a contra um prazo
// de 8,5 a", e contar os dois de jeitos diferentes tornaria a frase falsa em
// 0,8% justamente onde ela existe para comparar.
export function anosUteisEntre(isoInicio, isoFim) {
  return diasUteis(isoInicio, isoFim) / DIAS_UTEIS_ANO;
}

// Dias úteis entre duas datas (seg–sex, sem calendário de feriados). Serve só
// para decidir se um preço está velho — não para precificar.
export function diasUteisEntre(isoInicio, isoFim) {
  let d = dataDeISO(isoInicio);
  const fim = dataDeISO(isoFim);
  let n = 0;
  while (d < fim) {
    d = new Date(d.getTime() + MS_DIA);
    const dow = d.getUTCDay();
    if (dow !== 0 && dow !== 6) n++;
  }
  return n;
}

// ---------- Variação de uma série no tempo ----------

// Variação percentual entre o último ponto da série e o último ponto em ou
// ANTES de (data do último − dias).
//
// "Em ou antes" e não "exatamente na data": bolsa e câmbio não têm ponto em
// fim de semana nem feriado, então "uma semana atrás" quase nunca existe na
// série. Pegar o último disponível antes do alvo é o que qualquer terminal
// faz — e é honesto, porque a data usada sai junto no resultado.
//
// Devolve null quando a série não alcança o período pedido, em vez de
// comparar com o ponto mais antigo que existir e chamar isso de "12 meses".
// Um número errado com cara de certo é pior que um traço.
//
// Pressupõe `pontos` em ordem cronológica crescente — é como os dois
// providers (BCB e Yahoo) constroem as séries.
export function variacaoPeriodo(pontos, dias) {
  if (!Array.isArray(pontos) || pontos.length < 2) return null;
  const ultimo = pontos[pontos.length - 1];
  if (ultimo?.close == null || !ultimo.date) return null;

  const alvo = new Date(dataDeISO(ultimo.date).getTime() - dias * 86400000).toISOString().slice(0, 10);
  let base = null;
  for (const p of pontos) {
    if (p.date > alvo) break;
    if (p.close != null) base = p;
  }
  if (!base || !base.close) return null;

  // `valorDe`/`valorAte` acompanham as datas de propósito: a tela mostra a
  // cotação que entrou na conta embaixo do percentual, porque "-6,27% no ano"
  // sozinho não deixa ninguém conferir nem entender a ordem de grandeza. É a
  // diferença entre um número que se lê e um número em que se acredita.
  return {
    pct: ((ultimo.close - base.close) / base.close) * 100,
    de: base.date,
    ate: ultimo.date,
    valorDe: base.close,
    valorAte: ultimo.close,
  };
}

// Variação no ano (YTD). A base é o ÚLTIMO fechamento do ano ANTERIOR, e não o
// primeiro do ano corrente: 1º de janeiro não tem pregão em praça nenhuma, e
// ancorar no primeiro dia negociado do ano jogaria fora o salto da virada —
// que numa janela de ano é a informação, não ruído.
//
// O ano sai da data do último ponto, não do relógio, pelo mesmo motivo que
// variacaoPeriodo ancora no último ponto: uma série parada há três dias tem de
// medir o ano DELA, não um ano que ela não viu.
export function variacaoNoAno(pontos) {
  if (!Array.isArray(pontos) || pontos.length < 2) return null;
  const ultimo = pontos[pontos.length - 1];
  if (ultimo?.close == null || !ultimo.date) return null;

  const corte = `${ultimo.date.slice(0, 4)}-01-01`;
  let base = null;
  for (const p of pontos) {
    if (p.date >= corte) break;
    if (p.close != null) base = p;
  }
  if (!base || !base.close) return null;

  return {
    pct: ((ultimo.close - base.close) / base.close) * 100,
    de: base.date,
    ate: ultimo.date,
    valorDe: base.close,
    valorAte: ultimo.close,
  };
}

// ---------- Retorno acumulado de uma série de taxas diárias ----------
//
// Uma taxa não é um preço: perguntar "quanto o CDI variou em 12 meses" em % do
// próprio nível (13,65 -> 13,90 = +1,8%) não diz nada útil. O que se compara
// com o Ibovespa é o RETORNO: quanto R$ 1 aplicado àquela taxa virou na janela.
//
// É PRODUTO, nunca soma. Somar 252 taxas diárias de ~0,05% dá 12,6%; compondo
// dá 13,4%. Quase um ponto de diferença — e é o número que decide se o IPCA+ a
// 7,6% real está ou não ganhando do CDI.
//
// `apos` é EXCLUSIVO: conta-se do primeiro dia depois dele até o último ponto.
export function retornoAcumulado(pontosDiarios, apos) {
  if (!Array.isArray(pontosDiarios) || !pontosDiarios.length) return null;
  const dentro = pontosDiarios.filter((p) => p.date > apos && p.close != null && Number.isFinite(p.close));
  if (!dentro.length) return null;

  const fator = dentro.reduce((f, p) => f * (1 + p.close / 100), 1);
  return { pct: (fator - 1) * 100, de: dentro[0].date, ate: dentro[dentro.length - 1].date };
}

export function retornoPeriodo(pontosDiarios, dias) {
  const ultimo = pontosDiarios?.[pontosDiarios.length - 1];
  if (!ultimo?.date) return null;
  const apos = new Date(dataDeISO(ultimo.date).getTime() - dias * 86400000).toISOString().slice(0, 10);
  return retornoAcumulado(pontosDiarios, apos);
}

// No ano: tudo a partir de 1º de janeiro, ou seja, depois de 31/12 do ano
// anterior — o mesmo corte que variacaoNoAno usa do outro lado.
export function retornoNoAno(pontosDiarios) {
  const ultimo = pontosDiarios?.[pontosDiarios.length - 1];
  if (!ultimo?.date) return null;
  return retornoAcumulado(pontosDiarios, `${Number(ultimo.date.slice(0, 4)) - 1}-12-31`);
}

// ---------- Cruzamento de duas séries de preço ----------
//
// O dólar em euros não tem série no SGS: sai da divisão das duas pernas em real
// da PTAX. (R$ por US$) ÷ (R$ por €) = € por US$ — o real cancela.
//
// Cruzar as duas pernas do MESMO fixing, em vez de buscar um EUR/USD de
// mercado, é o que mantém a linha coerente com as duas de cima: dividir os dois
// números que estão na tela dá exatamente o terceiro. Um par vindo de outra
// fonte, cotado em outro instante do dia, não fecharia com eles — e três
// números que não fecham numa grade de câmbio são um defeito, não uma nuance.
//
// Casa por DATA, nunca por posição. As duas séries quase sempre têm os mesmos
// dias, e "quase sempre" alinhado por índice é exatamente o tipo de erro que
// sai calado: bastaria um feriado de um lado só para dividir a cotação de
// ontem pela de hoje e publicar o resultado com cara de certeza.
export function cruzarSeries(numerador, denominador, casas = 6) {
  if (!Array.isArray(numerador) || !Array.isArray(denominador)) return [];
  const den = new Map(denominador.map((p) => [p.date, p.close]));
  const saida = [];
  for (const p of numerador) {
    const d = den.get(p.date);
    if (!Number.isFinite(p?.close) || !Number.isFinite(d) || !d) continue;
    saida.push({ date: p.date, close: Number((p.close / d).toFixed(casas)) });
  }
  return saida;
}

// ---------- Janelas de inflação (séries MENSAIS) ----------
//
// Inflação não se mede com janela de dias. "12 meses" é o mesmo mês do ano
// passado, não 365 dias atrás; "no ano" é contra DEZEMBRO do ano anterior, que
// é como IBGE, BLS e Eurostat publicam. Por isso estas funções trabalham com a
// chave AAAA-MM e ignoram o dia — as fontes usam dia 1º por convenção, mas
// depender disso seria frágil.
//
// Duas formas de série, porque as fontes não concordam: o SGS publica a
// VARIAÇÃO de cada mês em %, enquanto FRED e BCE publicam o NÍVEL do índice.
// Cada uma tem a sua função, e as duas devolvem o mesmo formato.
const mesDe = (p) => String(p.date).slice(0, 7);

function janelaVazia() {
  return { mes: null, ano: null, doze: null };
}

// Série de ÍNDICE (FRED CPI, BCE HICP): razão entre dois níveis.
export function janelasDeIndiceMensal(pontos) {
  if (!Array.isArray(pontos) || pontos.length < 2) return janelaVazia();
  const ordenados = [...pontos].filter((p) => p?.close != null && p.date).sort((a, b) => (a.date < b.date ? -1 : 1));
  const ult = ordenados[ordenados.length - 1];
  if (!ult) return janelaVazia();
  const porMes = new Map(ordenados.map((p) => [mesDe(p), p.close]));
  const [ano, mes] = mesDe(ult).split("-").map(Number);

  const varContra = (chave) => {
    const base = porMes.get(chave);
    if (base == null || !base) return null;
    return { pct: (ult.close / base - 1) * 100, de: chave, ate: mesDe(ult) };
  };
  const mesAnterior = mes === 1 ? `${ano - 1}-12` : `${ano}-${String(mes - 1).padStart(2, "0")}`;
  return {
    mes: varContra(mesAnterior),
    ano: varContra(`${ano - 1}-12`),
    doze: varContra(`${ano - 1}-${String(mes).padStart(2, "0")}`),
  };
}

// Série de VARIAÇÃO mensal em % (SGS 433 IPCA, 189 IGP-M): compõe os meses.
// Composto, nunca somado — doze meses de 0,5% dão 6,17%, não 6,00%.
export function janelasDeVariacaoMensal(pontos) {
  if (!Array.isArray(pontos) || !pontos.length) return janelaVazia();
  const ordenados = [...pontos].filter((p) => p?.close != null && p.date).sort((a, b) => (a.date < b.date ? -1 : 1));
  if (!ordenados.length) return janelaVazia();
  const ult = ordenados[ordenados.length - 1];
  const mesUlt = mesDe(ult);
  const anoUlt = mesUlt.slice(0, 4);

  const compor = (lista) =>
    lista.length ? (lista.reduce((f, p) => f * (1 + p.close / 100), 1) - 1) * 100 : null;
  const janela = (lista) =>
    lista.length ? { pct: compor(lista), de: mesDe(lista[0]), ate: mesUlt } : null;

  const doAno = ordenados.filter((p) => mesDe(p).startsWith(anoUlt));
  const doze = ordenados.slice(-12);
  return {
    mes: { pct: ult.close, de: mesUlt, ate: mesUlt },
    ano: janela(doAno),
    // 12 meses só quando há 12 meses: com menos, o número seria de outra janela
    // e ninguém saberia disso olhando a tela.
    doze: doze.length === 12 ? janela(doze) : null,
  };
}

// ---------- Identificação do título ----------
// Arredonda para N casas preservando o null. Vive aqui, e nao em ponte.js, por
// ser usado dos dois lados — o coletor ao montar os arquivos-ponte e o
// datalayer ao montar payloads. Uma definicao so, para as duas nao divergirem.
export const arred = (v, casas) =>
  v == null || !Number.isFinite(v) ? null : Number(v.toFixed(casas));


// O arquivo do Tesouro nomeia os títulos por extenso ("Tesouro IPCA+ com Juros
// Semestrais"); os arquivos da ANBIMA usam a sigla (NTN-B, LTN, NTN-F, LFT).
// Esta função aceita as duas grafias e devolve tipo, cupom e indexador.
//
// Famílias reconhecidas:
//   ipca / ipca-juros            NTN-B Principal / NTN-B      (real, sobre IPCA)
//   prefixado / prefixado-juros  LTN / NTN-F                  (nominal)
//   selic                        LFT                          (pós-fixado; a "taxa"
//                                é ágio/deságio sobre a Selic, NÃO uma taxa cheia)
//
// Tesouro RendA+ e Educa+ ficam DE FORA de propósito: são séries com
// amortização mensal, cuja matemática (e leitura) não é a destes títulos.
// Melhor ausentes do que mostrados na escala errada.
export function classificarTitulo(nome) {
  const n = normalizar(nome);
  if (/renda\+|educa\+/.test(n)) return null;
  if (/ipca|ntn-?b/.test(n)) {
    const comCupom = /juros semestrais/.test(n) || (/ntn-?b/.test(n) && !/principal/.test(n));
    return { tipo: comCupom ? "ipca-juros" : "ipca", comCupom, cupomAnual: comCupom ? CUPOM_ANUAL_NTNB : null };
  }
  if (/prefixado|ntn-?f|\bltn\b/.test(n)) {
    const comCupom = /juros semestrais/.test(n) || /ntn-?f/.test(n);
    return { tipo: comCupom ? "prefixado-juros" : "prefixado", comCupom, cupomAnual: comCupom ? CUPOM_ANUAL_NTNF : null };
  }
  if (/tesouro selic|\blft\b/.test(n)) {
    return { tipo: "selic", comCupom: false, cupomAnual: null };
  }
  return null;
}

// A LFT não entra na matemática de duration: é pós-fixada (acompanha a Selic
// diária), então o preço quase não reage a juros de mercado — a "taxa" dela é
// um pequeno ágio/deságio. Duration null é a resposta honesta, não zero "de
// mentirinha" calculado sobre o spread.
export function temDuration(tipo) {
  return tipo !== "selic";
}

// Slug estável usado nas rotas /api, no cache e no histórico.
// NUNCA renomeie sem migrar o histórico — o slug é a chave da série acumulada.
export function slugDe(tipo, vencimentoISO) {
  return `${tipo}-${vencimentoISO}`;
}

// ---------- Matemática do título ----------

// Fluxo de caixa futuro por 100 de valor nominal (VNA). Como a duration é uma
// razão ponderada, o VNA se cancela e trabalhar com base 100 basta.
//
// Os cupons caem de 6 em 6 meses contados de trás para frente, a partir do
// vencimento — que é o que produz as datas reais da NTN-B (15/02 e 15/08 para
// vencimentos de agosto; 15/05 e 15/11 para os de maio).
export function fluxosNTNB({ vencimentoISO, comCupom, cupomAnual = CUPOM_ANUAL_NTNB, hojeISO: hoje = hojeISO() }) {
  const anosAteVencer = anosUteisEntre(hoje, vencimentoISO);
  if (!(anosAteVencer > 0)) return [];

  if (!comCupom) {
    return [{ dataISO: vencimentoISO, anos: anosAteVencer, valor: 100 }];
  }

  // Semestral composto do cupom anual do título (6% NTN-B, 10% NTN-F).
  const cupom = 100 * (Math.pow(1 + cupomAnual, 1 / 2) - 1);
  const fluxos = [];
  let d = dataDeISO(vencimentoISO);
  const limite = dataDeISO(hoje);
  // Do vencimento para trás, de seis em seis meses, até passar de hoje.
  while (d > limite) {
    const iso = d.toISOString().slice(0, 10);
    const ehVencimento = iso === String(vencimentoISO).slice(0, 10);
    fluxos.push({
      dataISO: iso,
      anos: anosUteisEntre(hoje, iso),
      valor: ehVencimento ? 100 + cupom : cupom,
    });
    d = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() - 6, d.getUTCDate()));
  }
  return fluxos.reverse();
}

// Duration de Macaulay, duration modificada e convexidade, a partir da taxa
// real anual (ex.: 0,0705 para 7,05% a.a.).
//
//   Macaulay   = Σ tᵢ·VPᵢ / Σ VPᵢ          -> prazo médio ponderado, em anos
//   Modificada = Macaulay / (1 + y)         -> sensibilidade: −ΔP/P por Δy
//   Convexidade= Σ tᵢ(tᵢ+1)·VPᵢ / ((1+y)²·ΣVPᵢ)
//
// `variacaoPor1pp` traduz isso para a pergunta prática: quanto o preço cai (ou
// sobe) hoje se a taxa real subir (ou cair) 1 ponto percentual — já com o termo
// de convexidade, que é o que torna a subida e a descida assimétricas.
export function calcularDuration({ vencimentoISO, comCupom, cupomAnual = CUPOM_ANUAL_NTNB, taxaReal, hojeISO: hoje = hojeISO() }) {
  const vazio = {
    macaulay: null, modificada: null, convexidade: null,
    variacaoPor1pp: null, variacaoMenos1pp: null,
    variacaoPor2pp: null, variacaoMenos2pp: null,
  };
  if (taxaReal == null || !Number.isFinite(taxaReal) || taxaReal <= -1) return vazio;

  const fluxos = fluxosNTNB({ vencimentoISO, comCupom, cupomAnual, hojeISO: hoje });
  if (!fluxos.length) return vazio;

  const y = taxaReal;
  let vpTotal = 0;
  let somaTempoVP = 0;
  let somaConvexidade = 0;
  for (const f of fluxos) {
    const vp = f.valor / Math.pow(1 + y, f.anos);
    vpTotal += vp;
    somaTempoVP += f.anos * vp;
    somaConvexidade += f.anos * (f.anos + 1) * vp;
  }
  if (!(vpTotal > 0)) return vazio;

  const macaulay = somaTempoVP / vpTotal;
  const modificada = macaulay / (1 + y);
  const convexidade = somaConvexidade / (Math.pow(1 + y, 2) * vpTotal);

  // ΔP/P ≈ −D_mod·Δy + ½·C·Δy², em %.
  const variacao = (dy) => (-modificada * dy + 0.5 * convexidade * dy * dy) * 100;

  return {
    macaulay,
    modificada,
    convexidade,
    variacaoPor1pp: variacao(0.01),
    variacaoMenos1pp: variacao(-0.01),
    // ±2 p.p. sai da MESMA expansão, não de dobrar o ±1: a convexidade entra
    // ao quadrado, então o choque de 2 p.p. não é duas vezes o de 1 p.p. — a
    // alta machuca menos e a baixa ganha mais do que a conta linear diria.
    // Dobrar à mão na tela exageraria a perda e encolheria o ganho.
    variacaoPor2pp: variacao(0.02),
    variacaoMenos2pp: variacao(-0.02),
    fluxos,
  };
}

// Preço teórico por 100 de VNA, dada a taxa real. Usado para conferir a ordem
// de grandeza do PU do arquivo e para a calculadora "e se a taxa fosse X?".
export function precoPor100({ vencimentoISO, comCupom, cupomAnual = CUPOM_ANUAL_NTNB, taxaReal, hojeISO: hoje = hojeISO() }) {
  if (taxaReal == null || !Number.isFinite(taxaReal)) return null;
  const fluxos = fluxosNTNB({ vencimentoISO, comCupom, cupomAnual, hojeISO: hoje });
  if (!fluxos.length) return null;
  return fluxos.reduce((s, f) => s + f.valor / Math.pow(1 + taxaReal, f.anos), 0);
}

// ---------- Variação de um título por janela, e o cupom que cai no meio ----------

// As janelas do cartão do Painel. `dias: null` é o dia: último ponto contra o
// anterior, e não "24 horas atrás" — na segunda-feira o ponto anterior é o de
// sexta, e pedir um dia corrido devolveria null toda segunda.
export const JANELAS_DO_TITULO = [
  { id: "1D", dias: null },
  { id: "1S", dias: 7 },
  { id: "1M", dias: 30 },
];

// Quanto a base pode ficar ANTES da data pedida. "Em ou antes" resolve fim de
// semana e feriado, mas sem teto resolveria também um título que ficou meses
// fora de oferta: a base seria o último preço antes do buraco, e a tela
// chamaria de "1 semana" uma variação de três meses. Dez dias cobrem a pior
// sequência real sem preço (Natal + Ano Novo, Carnaval) com folga.
const TOLERANCIA_DA_BASE_DIAS = 10;

const isoMenosDias = (iso, dias) => new Date(dataDeISO(iso).getTime() - dias * MS_DIA).toISOString().slice(0, 10);

// Dia em que o Tesouro publica preço: dia útil, menos 24/12 e 31/12. As duas
// datas são úteis no calendário de feriados, mas em todo o histórico (2019 em
// diante) não há um único preço nelas — e a de 31/12 importa aqui, porque o
// cupom da NTN-F cai em 01/01.
function ehDiaDePreco(data) {
  if (!ehDiaUtil(data)) return false;
  return !(data.getUTCMonth() === 11 && (data.getUTCDate() === 24 || data.getUTCDate() === 31));
}

// A data em que o PU publicado JÁ NÃO TRAZ o cupom: o último dia de preço
// antes da data do cupom, e não a data do cupom.
//
// Medido no histórico, em cinco pagamentos de três títulos: o PU cai o valor
// do cupom no pregão ANTERIOR à data — 14/08 para o cupom de 15/08 (sábado),
// 14/05 para o de 15/05 (sexta), 30/06 para o de 01/07, 30/12 para o de 01/01.
// É a liquidação em D+1: quem compra na véspera já não recebe aquele cupom,
// então o preço da véspera já vem sem ele. scripts/verificar.mjs confere esta
// regra contra TODOS os pagamentos que o histórico alcança.
export function dataExCupom(cupomISO) {
  let d = new Date(dataDeISO(cupomISO).getTime() - MS_DIA);
  while (!ehDiaDePreco(d)) d = new Date(d.getTime() - MS_DIA);
  return d.toISOString().slice(0, 10);
}

// O cupom (data ISO) que saiu do preço dentro da janela (de, até], ou null.
// As datas saem como em fluxosNTNB: do vencimento para trás, de 6 em 6 meses.
export function cupomNaJanela({ vencimentoISO, deISO, ateISO }) {
  if (!vencimentoISO || !deISO || !ateISO) return null;
  let d = dataDeISO(vencimentoISO);
  for (;;) {
    const cupom = d.toISOString().slice(0, 10);
    const ex = dataExCupom(cupom);
    // Daqui para trás todas as datas-ex são ainda mais antigas.
    if (ex <= deISO) return null;
    if (ex <= ateISO) return cupom;
    d = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() - 6, d.getUTCDate()));
  }
}

// Variação da TAXA (em p.p.) e do PREÇO (em %) de um título em cada janela.
// `serie` é [{ date, taxa, pu }] em ordem crescente.
//
// A TAXA ATRAVESSA UM CUPOM SEM PROBLEMA; O PREÇO, NÃO. No dia em que o cupom
// sai, o PU cai o valor dele — 3% numa NTN-B, 5% numa NTN-F — sem que o
// investidor tenha perdido nada: o dinheiro foi para a conta. Mostrar isso
// como "preço −5,23%" em vermelho é a tela inventando uma perda. Somar o
// cupom de volta exigiria o VNA do dia, que o arquivo do Tesouro não traz;
// então, numa janela com cupom, o preço sai null (a tela mostra "—") e a
// data do cupom vai junto, para a tela dizer por quê.
//
// Cada janela devolve null quando a série não alcança a data pedida — nunca
// a variação contra o ponto mais antigo que houver.
export function variacoesDoTitulo(serie, { comCupom = false, vencimentoISO = null } = {}) {
  const saida = {};
  const n = Array.isArray(serie) ? serie.length : 0;
  const ult = n ? serie[n - 1] : null;

  for (const { id, dias } of JANELAS_DO_TITULO) {
    let base = null;
    if (ult && dias == null) {
      base = n >= 2 ? serie[n - 2] : null;
    } else if (ult) {
      const alvo = isoMenosDias(ult.date, dias);
      for (let i = n - 2; i >= 0; i--) {
        if (serie[i].date <= alvo) {
          base = serie[i];
          break;
        }
      }
      if (base && base.date < isoMenosDias(alvo, TOLERANCIA_DA_BASE_DIAS)) base = null;
    }
    if (!base) {
      saida[id] = null;
      continue;
    }

    const cupom = comCupom ? cupomNaJanela({ vencimentoISO, deISO: base.date, ateISO: ult.date }) : null;
    saida[id] = {
      de: base.date,
      ate: ult.date,
      taxaPP: ult.taxa != null && base.taxa != null ? ult.taxa - base.taxa : null,
      puPct: !cupom && ult.pu != null && base.pu != null && base.pu !== 0 ? ((ult.pu - base.pu) / base.pu) * 100 : null,
      cupom,
    };
  }
  return saida;
}

// ---------- Onde a taxa de hoje está no próprio histórico ----------

// Com menos pontos que isto, "acima de 80% dos dias" seria uma frase sobre
// quatro pregões. Quinze é o que deixa a janela de 1 mês (uns 20 pregões,
// menos os dias de defasagem da coleta) ainda ter a sua comparação.
export const MIN_PONTOS_PERCENTIL = 15;

// Em quantos % dos OUTROS dias da janela a taxa esteve ABAIXO da de hoje.
// 100 = hoje é a maior do período; 0 = é a menor. Empate não conta como
// abaixo: a frase na tela é "acima de X% dos dias", e um dia igual a hoje não
// está abaixo de hoje. O dia de hoje sai do denominador — comparar hoje com
// hoje não informa nada, e sem isso o máximo do período daria 99%, não 100.
export function percentilDoUltimo(valores, minimo = MIN_PONTOS_PERCENTIL) {
  const v = (valores || []).filter((x) => x != null && Number.isFinite(x));
  if (v.length < minimo) return null;
  const atual = v[v.length - 1];
  let abaixo = 0;
  for (let i = 0; i < v.length - 1; i++) if (v[i] < atual) abaixo++;
  return (abaixo / (v.length - 1)) * 100;
}

// ---------- O valor de face, e o que um título ainda vai pagar ----------

// LTN e NTN-F valem exatamente R$ 1.000 no vencimento — é a definição do
// título, a mesma que deixa o verificar.mjs reconstruir o PU oficial da LTN.
export const FACE_PREFIXADO = 1000;

// O valor de face de UM título na data do preço.
//
//   prefixado: R$ 1.000, em reais do vencimento (nominal). Exato.
//   IPCA+:     o VNA — os R$ 1.000 de julho/2000 corrigidos pelo IPCA até a
//              data do preço. Em reais DE HOJE; no vencimento ele valerá isso
//              mais a inflação que houver até lá.
//   Selic:     null. O VNA da LFT rende a Selic até o vencimento, e quanto
//              isso dará ninguém sabe hoje.
//
// O VNA NÃO VEM NO ARQUIVO DO TESOURO, mas sai dos dois números que vêm: o PU
// é o VNA vezes o preço por 100 que a taxa do dia implica, então
// VNA = PU ÷ precoPor100 × 100. Medido em 06/11/2026: os 15 IPCA+ em oferta,
// com e sem cupom, de 2029 a 2060, dão o mesmo VNA com 0,03% de dispersão
// (4.774,39 a 4.775,83); a mesma conta nos prefixados devolve 1.000 com 0,01%.
// O verificar.mjs repete as duas medidas a cada rodada.
export function valorDeFace({ tipo, vencimentoISO, comCupom, cupomAnual, taxa, pu, dataISO }) {
  if (!temDuration(tipo)) return null;
  if (String(tipo).startsWith("prefixado")) return { valor: FACE_PREFIXADO, unidade: "nominal" };
  if (taxa == null || !pu || !dataISO) return null;
  const por100 = precoPor100({ vencimentoISO, comCupom, cupomAnual: cupomAnual ?? undefined, taxaReal: taxa / 100, hojeISO: dataISO });
  return por100 ? { valor: (pu / por100) * 100, unidade: "hoje" } : null;
}

// O que UM título ainda paga, de hoje ao vencimento, na unidade da face:
// o principal e, nos títulos com juros, um cupom por semestre.
//
// A soma NÃO é um valor presente: são os pagamentos como eles vão cair, sem
// trazer nada a hoje. É a resposta a "quanto eu recebo se não vender" — a
// pergunta que o preço de mercado, que desconta tudo, não responde.
export function recebimentosFuturos({ face, vencimentoISO, comCupom, cupomAnual, hojeISO: hoje = hojeISO() }) {
  if (!face) return null;
  const fluxos = fluxosNTNB({ vencimentoISO, comCupom, cupomAnual: cupomAnual ?? undefined, hojeISO: hoje });
  if (!fluxos.length) return null;
  const cupom = comCupom ? face.valor * (Math.pow(1 + (cupomAnual ?? CUPOM_ANUAL_NTNB), 1 / 2) - 1) : 0;
  const pagamentos = comCupom ? fluxos.length : 0;
  return {
    principal: face.valor,
    cupom,
    pagamentos,
    total: face.valor + cupom * pagamentos,
    unidade: face.unidade,
  };
}

// Os cupons que um título JÁ pagou, por unidade, dentro do que a série alcança.
// `serie` é [{ date, taxa, pu }] crescente. Cada item: { data, ex, valor }.
//
// `ex` é a data que decide quem recebeu: comprou ANTES dela, recebeu aquele
// cupom (ver dataExCupom). O valor é exato nos prefixados (R$ 1.000 × a
// parcela do semestre) e, nos IPCA+, sai do VNA implícito no último preço
// ainda com o cupom — a véspera da data-ex. Sem preço perto dessa véspera o
// valor é null: um cupom que se sabe que existiu, de tamanho desconhecido,
// não pode entrar numa soma como zero.
export function cuponsPagos({ tipo, vencimentoISO, cupomAnual, serie, hojeISO: hoje = hojeISO() }) {
  if (!Array.isArray(serie) || !serie.length) return [];
  const parcela = Math.pow(1 + (cupomAnual ?? CUPOM_ANUAL_NTNB), 1 / 2) - 1;
  const prefixado = String(tipo).startsWith("prefixado");
  const inicio = serie[0].date;
  const pagos = [];
  let d = dataDeISO(vencimentoISO);
  for (;;) {
    const data = d.toISOString().slice(0, 10);
    d = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() - 6, d.getUTCDate()));
    const ex = dataExCupom(data);
    if (ex <= inicio) break;
    // O do vencimento vem junto com o principal: não é um cupom "já pago".
    if (data > hoje || data >= vencimentoISO) continue;

    let valor = prefixado ? FACE_PREFIXADO * parcela : null;
    if (!prefixado) {
      let vespera = null;
      for (let i = serie.length - 1; i >= 0; i--) {
        if (serie[i].date < ex) {
          vespera = serie[i];
          break;
        }
      }
      if (vespera && vespera.date >= isoMenosDias(ex, TOLERANCIA_DA_BASE_DIAS)) {
        const face = valorDeFace({ tipo, vencimentoISO, comCupom: true, cupomAnual, taxa: vespera.taxa, pu: vespera.pu, dataISO: vespera.date });
        valor = face ? face.valor * parcela : null;
      }
    }
    pagos.push({ data, ex, valor });
  }
  return pagos.reverse();
}
