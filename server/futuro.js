// server/futuro.js — o título do Tesouro lido contra a curva de juros futuros.
//
// DUAS LEITURAS, as duas a partir do que o coletor já guarda em
// dados/futuros.json (DI1 para o Prefixado, DAP para o IPCA+):
//
//   1. O PRÊMIO: quanto o título paga a mais (ou a menos) que o futuro no
//      mesmo prazo e NA MESMA DATA.
//   2. PARADO, EM 12 MESES: quanto o título rende em um ano se a curva de
//      futuros ficar exatamente onde está — o carrego (a taxa correndo) mais a
//      rolagem (o título encurta um ano e passa a valer a taxa de um ponto
//      mais curto da curva).
//
// Tudo função pura: recebe o arquivo, devolve número. O verificar.mjs confere
// por identidades — numa curva plana o prêmio de um título à mesma taxa é
// zero e a rolagem é zero, com ou sem cupom.
//
// COMO SE COMPARA UM TÍTULO COM CUPOM A UMA CURVA DE TAXAS À VISTA. Não se
// compara a taxa do título com a do futuro no vencimento dele: um título com
// cupom devolve dinheiro ao longo do caminho, e cada pagamento "mora" num
// ponto diferente da curva. A conta aqui desconta CADA fluxo pela taxa do
// futuro no prazo daquele fluxo, soma, e pergunta que taxa única daria o
// mesmo preço. Para um título sem cupom isso é, exatamente, a taxa do futuro
// no vencimento — uma função só para as duas formas.
//
// A INTERPOLAÇÃO é a do mercado de DI: fator de desconto composto em dias
// úteis, taxa a termo constante entre dois vencimentos (flat-forward). A
// mesma convenção vale para a DAP, medida em 30/10/2026 (ver providers/b3.js).
//
// O QUE NÃO SE SABE, e a tela diz:
//   - O prêmio não é só "caro ou barato". DI é taxa interbancária, o título é
//     dívida do Tesouro; o preço do Tesouro Direto é o de RECOMPRA, com o
//     spread dele; e as duas fontes não fecham no mesmo instante do dia. Medido
//     nos primeiros 12 pregões: o desvio de um dia para o outro (0,03 a 0,15
//     p.p.) é do tamanho do próprio prêmio. Por isso vai junto a média.
//   - "A curva fica onde está" é uma hipótese, não uma previsão. Ela quase
//     nunca fica.

import { diasUteis } from "./feriados.js";
import { fluxosNTNB, precoPor100, anosUteisEntre, DIAS_UTEIS_ANO } from "./util.js";

// De que futuro sai a curva de cada família. A LFT não tem: o "preço" dela é
// um ágio sobre a Selic, não um ponto de curva.
export const FUTURO_DA_FAMILIA = {
  ipca: "DAP",
  "ipca-juros": "DAP",
  prefixado: "DI1",
  "prefixado-juros": "DI1",
};

// A curva de um futuro numa data: [{ du, taxa, fator }], em ordem de prazo.
// `duMinimo` corta a ponta curta (a da DAP é distorcida pelo IPCA já
// conhecido — ver PRAZO_MINIMO_CURVA no datalayer).
export function curvaDoFuturo(arquivo, ativo, dataISO, { duMinimo = 0 } = {}) {
  const pontos = [];
  for (const c of Object.values(arquivo?.contratos || {})) {
    if (c.ativo !== ativo || !(c.vencimento > dataISO)) continue;
    const taxa = c.serie?.[dataISO]?.[0];
    if (taxa == null || !Number.isFinite(taxa)) continue;
    const du = diasUteis(dataISO, c.vencimento);
    if (du <= 0 || du < duMinimo) continue;
    pontos.push({ du, taxa, fator: Math.pow(1 + taxa / 100, du / DIAS_UTEIS_ANO) });
  }
  return pontos.sort((a, b) => a.du - b.du);
}

// O fator de capitalização da curva até `du` dias úteis.
//   - além do último vencimento: null. Extrapolar a ponta longa é inventar.
//   - aquém do primeiro: a taxa do primeiro, plana. Só serve para descontar
//     os cupons próximos de um título longo, que pesam pouco no preço; quem
//     chama decide se o VENCIMENTO pode cair aí (não pode — ver abaixo).
export function fatorNoPrazo(curva, du) {
  if (!curva?.length || !(du > 0)) return null;
  const primeiro = curva[0];
  const ultimo = curva[curva.length - 1];
  if (du > ultimo.du) return null;
  if (du <= primeiro.du) return Math.pow(1 + primeiro.taxa / 100, du / DIAS_UTEIS_ANO);
  for (let i = 1; i < curva.length; i++) {
    if (curva[i].du >= du) {
      const a = curva[i - 1];
      const b = curva[i];
      const peso = (du - a.du) / (b.du - a.du);
      return a.fator * Math.pow(b.fator / a.fator, peso);
    }
  }
  return null;
}

// A taxa única (% a.a.) que dá a um conjunto de fluxos o mesmo preço que a
// curva dá, fluxo a fluxo. `fluxos` é o de fluxosNTNB: [{ anos, valor }].
// null quando o vencimento cai fora da curva — antes do primeiro vértice ou
// depois do último.
export function taxaPelaCurva(fluxos, curva) {
  if (!fluxos?.length || !curva?.length) return null;
  const duDe = (f) => Math.round(f.anos * DIAS_UTEIS_ANO);
  const duFinal = duDe(fluxos[fluxos.length - 1]);
  if (duFinal < curva[0].du || duFinal > curva[curva.length - 1].du) return null;

  let preco = 0;
  for (const f of fluxos) {
    const fator = fatorNoPrazo(curva, duDe(f));
    if (fator == null) return null;
    preco += f.valor / fator;
  }
  const precoA = (y) => fluxos.reduce((s, f) => s + f.valor / Math.pow(1 + y, f.anos), 0);
  // Bisseção: o preço cai quando a taxa sobe, sempre. 60 passos entre −50% e
  // +200% a.a. deixam o erro abaixo de 1e-15 — sobra, e não há derivada para
  // errar o sinal.
  let lo = -0.5;
  let hi = 2;
  if (precoA(lo) < preco || precoA(hi) > preco) return null;
  for (let i = 0; i < 60; i++) {
    const meio = (lo + hi) / 2;
    if (precoA(meio) > preco) lo = meio;
    else hi = meio;
  }
  return ((lo + hi) / 2) * 100;
}

// A taxa que a curva de futuros daria a ESTE título, numa data.
export function taxaDoFuturo({ vencimentoISO, comCupom, cupomAnual, dataISO, curva }) {
  const fluxos = fluxosNTNB({ vencimentoISO, comCupom, cupomAnual: cupomAnual ?? undefined, hojeISO: dataISO });
  return taxaPelaCurva(fluxos, curva);
}

// A mesma data, um ano depois (29/02 vira 01/03).
export function umAnoDepois(iso) {
  const [a, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(a + 1, m - 1, d)).toISOString().slice(0, 10);
}

// O que o título rende em 12 meses SE A CURVA FICAR ONDE ESTÁ.
//
// "Ficar onde está" quer dizer: daqui a um ano, a curva de futuros é a mesma
// função do prazo que é hoje, e o título mantém sobre ela o prêmio que tem
// hoje. Ele terá um ano a menos, então sua taxa passa a ser a do ponto um ano
// mais curto — numa curva inclinada para cima, uma taxa menor, e portanto um
// preço maior. Esse ganho é a rolagem; o resto é o carrego.
//
// Devolve { ate, taxaHoje, taxaRolada, carregoPct, rolagemPct, totalPct } —
// num IPCA+ tudo em termos REAIS, a inflação vem por cima; bruto de imposto,
// com os cupons do período reaplicados à taxa do título — ou null quando
// não dá para dizer: título que vence dentro do horizonte, ou curva que não
// alcança o prazo de hoje ou o de daqui a um ano.
export function paradoEm12Meses({ vencimentoISO, comCupom, cupomAnual, taxa, dataISO, curva }) {
  if (taxa == null || !Number.isFinite(taxa) || !dataISO) return null;
  const ate = umAnoDepois(dataISO);
  if (!(vencimentoISO > ate)) return null;

  const base = { vencimentoISO, comCupom, cupomAnual: cupomAnual ?? undefined };
  const futuroHoje = taxaDoFuturo({ ...base, dataISO, curva });
  // Os fluxos que sobram daqui a um ano, contados a partir de lá, na MESMA
  // curva: é isso que "a curva não se mexeu" quer dizer.
  const futuroDepois = taxaDoFuturo({ ...base, dataISO: ate, curva });
  if (futuroHoje == null || futuroDepois == null) return null;

  const taxaRolada = taxa + (futuroDepois - futuroHoje);
  const precoHoje = precoPor100({ ...base, taxaReal: taxa / 100, hojeISO: dataISO });
  const precoRolado = precoPor100({ ...base, taxaReal: taxaRolada / 100, hojeISO: ate });
  const precoSemRolar = precoPor100({ ...base, taxaReal: taxa / 100, hojeISO: ate });
  if (!(precoHoje > 0) || precoRolado == null || precoSemRolar == null) return null;

  // OS CUPONS PAGOS DENTRO DO ANO SÃO REAPLICADOS À TAXA DO PRÓPRIO TÍTULO,
  // do pagamento até o fim do horizonte. É a convenção em que "a taxa do
  // título" quer dizer o que parece: com ela, o carrego de qualquer título é
  // exatamente a taxa dele, tenha cupom ou não.
  //
  // A primeira versão somava os cupons sem reaplicar, com um comentário
  // dizendo que a diferença era de centésimos. Não é: num Prefixado com juros
  // a 14,6%, o carrego saía 13,6% — um ponto inteiro a menos, que fazia todo
  // título com cupom parecer pior que o sem cupom do mesmo vencimento só por
  // causa da conta. Foi a tabela lado a lado que mostrou.
  const cupons = fluxosNTNB({ ...base, hojeISO: dataISO })
    .filter((f) => f.dataISO <= ate)
    .reduce((s, f) => s + f.valor * Math.pow(1 + taxa / 100, anosUteisEntre(f.dataISO, ate)), 0);

  const totalPct = ((precoRolado + cupons) / precoHoje - 1) * 100;
  const carregoPct = ((precoSemRolar + cupons) / precoHoje - 1) * 100;
  return { ate, taxaHoje: taxa, taxaRolada, carregoPct, rolagemPct: totalPct - carregoPct, totalPct };
}
