// src/impostos.js — o imposto de renda sobre um título levado até o vencimento.
//
// POR QUE EXISTE: a Calculadora mostrava o valor no vencimento BRUTO, com uma
// frase avisando. Só que o imposto leva de 15% a 22,5% do ganho, e num IPCA+
// ele incide também sobre a correção pela inflação — então o bruto e o que
// chega na conta podem estar bem longe um do outro, e a frase não dizia quanto.
//
// AS REGRAS SÃO DE FONTE, NÃO DE MEMÓRIA (conferidas em 10/11/2026):
//   - Tabela regressiva: Lei 11.033/2004, art. 1º, repetida pela Receita
//     Federal na página "Tributação de 2026" (atualizada em 27/04/2026), na
//     linha "aplicações de renda fixa em geral".
//   - A MP 1.303/2025, que trocaria a tabela por uma alíquota única, perdeu a
//     validade em 08/10/2025 sem virar lei (Ato Declaratório do Congresso
//     Nacional 67/2025). A tabela abaixo é a que vale.
//   - O imposto incide sobre o RENDIMENTO, é retido no resgate ou no
//     vencimento e, nos títulos com juros semestrais, também a cada cupom.
//   - Taxa de custódia: 0,20% ao ano sobre o valor dos títulos, cobrada pela
//     B3 a cada semestre (página "Tarifas de Tesouro Direto" da B3).
// Regra tributária muda por lei. Ao mexer aqui, confira a fonte de novo e
// atualize CONFERIDO_EM — é a data que a tela mostra.
//
// O QUE ESTE ARQUIVO NÃO CALCULA, de propósito:
//   - Títulos com cupom. Cada cupom é tributado quando é pago, pela alíquota
//     do prazo desde a compra, e num IPCA+ o valor de cada cupom depende da
//     inflação até lá. Dá para aproximar; não dá para aproximar e chamar de
//     líquido.
//   - A taxa de custódia. Ela é cobrada sobre o valor do título ao longo do
//     caminho, e esse caminho depende das taxas de mercado até o vencimento.
//   - Venda antes do vencimento: outra data, outro preço, talvez outra faixa.
//
// Arquivo puro, sem importar nada — o verificar.mjs exercita as contas em node.

export const CONFERIDO_EM = "2026-11-10";

// Prazo em DIAS CORRIDOS entre a compra e o resgate. A última faixa não tem
// teto.
export const FAIXAS_IR = [
  { ateDias: 180, aliquota: 0.225 },
  { ateDias: 360, aliquota: 0.2 },
  { ateDias: 720, aliquota: 0.175 },
  { ateDias: Infinity, aliquota: 0.15 },
];

// Resgate em menos de 30 dias paga também IOF, numa tabela própria que este
// app não carrega. Abaixo disso a conta não sai, em vez de sair sem o IOF.
export const PRAZO_IOF_DIAS = 30;

export const CUSTODIA_B3_AA = 0.002;

const MS_DIA = 86400000;

export function diasCorridosEntre(deISO, ateISO) {
  const dia = (iso) => {
    const [a, m, d] = String(iso || "").slice(0, 10).split("-").map(Number);
    return a && m && d ? Date.UTC(a, m - 1, d) : NaN;
  };
  const n = (dia(ateISO) - dia(deISO)) / MS_DIA;
  return Number.isFinite(n) ? Math.round(n) : null;
}

export function aliquotaIR(diasCorridos) {
  if (diasCorridos == null || !Number.isFinite(diasCorridos) || diasCorridos < 0) return null;
  return FAIXAS_IR.find((f) => diasCorridos <= f.ateDias).aliquota;
}

// O que sobra, depois do imposto de renda, de um título SEM CUPOM comprado
// hoje e levado até o vencimento.
//
//   investido     reais aplicados hoje
//   taxaAA        a taxa do título, em decimal (0,0787 para 7,87% a.a.)
//   anosUteis     prazo em dias úteis/252 — a base em que a taxa é cotada
//   diasCorridos  prazo em dias corridos — a base da tabela do imposto
//   inflacaoAA    null num prefixado. Num IPCA+, a inflação SUPOSTA, em
//                 decimal ao ano.
//
// A INFLAÇÃO ENTRA PORQUE O IMPOSTO É SOBRE O GANHO NOMINAL. Um IPCA+ paga a
// taxa real mais a correção pelo IPCA, e a correção também é tributada. Então
// o líquido em poder de compra de hoje depende de quanta inflação houver: com
// mais inflação, o mesmo ganho real paga mais imposto. Não existe resposta
// sem supor um número — e por isso ele é um campo na tela, não uma constante
// escondida aqui.
//
// `bruto`, `imposto` e `liquido` saem NA MESMA UNIDADE do cartão de cima da
// Calculadora: reais nominais para o prefixado, reais de hoje para o IPCA+.
export function liquidoNoVencimento({ investido, taxaAA, anosUteis, diasCorridos, inflacaoAA = null }) {
  const numeros = [investido, taxaAA, anosUteis, diasCorridos];
  if (numeros.some((x) => x == null || !Number.isFinite(x))) return null;
  if (!(investido > 0) || !(anosUteis > 0) || taxaAA <= -1) return null;
  if (diasCorridos < PRAZO_IOF_DIAS) return null;
  if (inflacaoAA != null && (!Number.isFinite(inflacaoAA) || inflacaoAA <= -1)) return null;

  const bruto = investido * Math.pow(1 + taxaAA, anosUteis);
  // A correção pelo IPCA acompanha o calendário, não os dias úteis.
  const fatorInflacao = inflacaoAA == null ? 1 : Math.pow(1 + inflacaoAA, diasCorridos / 365);
  const brutoNominal = bruto * fatorInflacao;

  const aliquota = aliquotaIR(diasCorridos);
  // Sem ganho não há imposto: uma taxa negativa não gera crédito.
  const impostoNominal = aliquota * Math.max(0, brutoNominal - investido);
  const liquido = (brutoNominal - impostoNominal) / fatorInflacao;

  return {
    aliquota,
    bruto,
    imposto: bruto - liquido,
    liquido,
    // A taxa que, composta pelo mesmo prazo, leva do investido ao líquido: é
    // o que se compara com a taxa do título para ver o tamanho da mordida.
    taxaLiquidaAA: Math.pow(liquido / investido, 1 / anosUteis) - 1,
  };
}
