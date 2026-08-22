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
// A duration é a régua de sensibilidade a juros: quanto o preço se mexe quando
// a taxa real se mexe. Para um horizonte longo (e para comparar posições), ela
// diz mais do que a taxa sozinha.

// ---------- Constantes do título ----------

// Cupons dos títulos com juros semestrais. A parcela do semestre é a taxa
// equivalente composta — (1+c)^(1/2) − 1 —, não c/2:
//   NTN-B  paga 6% a.a.  -> 2,9563% por semestre
//   NTN-F  paga 10% a.a. -> 4,8809% por semestre
export const CUPOM_ANUAL_NTNB = 0.06;
export const CUPOM_SEMESTRAL_NTNB = Math.pow(1 + CUPOM_ANUAL_NTNB, 1 / 2) - 1;
export const CUPOM_ANUAL_NTNF = 0.10;
export const CUPOM_SEMESTRAL_NTNF = Math.pow(1 + CUPOM_ANUAL_NTNF, 1 / 2) - 1;

// Convenção de contagem de tempo. A ANBIMA precifica NTN-B em dias úteis/252;
// aqui usamos dias corridos/365 porque não temos calendário de feriados no
// repositório. A diferença é irrelevante para a duration (que é uma razão
// ponderada de prazos, onde a convenção quase toda se cancela) e está
// documentada no README como aproximação.
export const DIAS_ANO = 365;
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

export function anosEntre(isoInicio, isoFim) {
  const ms = dataDeISO(isoFim) - dataDeISO(isoInicio);
  return ms / (MS_DIA * DIAS_ANO);
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

  return {
    pct: ((ultimo.close - base.close) / base.close) * 100,
    de: base.date,
    ate: ultimo.date,
  };
}

// ---------- Identificação do título ----------

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
// Melhor ausentes do que mostrados com régua errada.
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
  const anosAteVencer = anosEntre(hoje, vencimentoISO);
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
      anos: anosEntre(hoje, iso),
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
  const vazio = { macaulay: null, modificada: null, convexidade: null, variacaoPor1pp: null, variacaoMenos1pp: null };
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
