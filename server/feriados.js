// server/feriados.js — o calendário de dias úteis do mercado brasileiro.
//
// POR QUE EXISTE: o Tesouro e a ANBIMA precificam em DIAS ÚTEIS/252, não em
// dias corridos/365. Até 10/2026 este repositório descontava fluxo em
// corridos/365 e documentava a diferença como desprezível. É desprezível para
// a duration (uma razão ponderada, onde a convenção quase toda se cancela) e
// NÃO é para o valor final da Calculadora: medido contra o PU oficial das LTN,
// corridos/365 erra de −0,09% no vencimento mais curto a −0,50% no de 2032, e
// o erro cresce com o prazo porque é a régua que está torta, não o
// arredondamento. Em R$ 10.000 levados ao IPCA+ 2050, −1,08% (R$ 513).
//
// POR QUE REGRA E NÃO LISTA: feriado nacional brasileiro é calculável. Oito
// datas fixas mais quatro móveis que derivam todas da Páscoa — carnaval
// (segunda e terça), sexta-feira santa e Corpus Christi. Uma lista teria de
// ser estendida à mão todo ano, e o vencimento mais longo em tela é 2060: ela
// venceria décadas antes dos títulos. O computus não vence nunca.
//
// O QUE A REGRA NÃO COBRE: feriado criado por lei nova (20/11, Consciência
// Negra, virou nacional só em 2024 pela Lei 14.759/2023) e feriado estadual ou
// municipal, que não entram no calendário da ANBIMA. Se vier um novo, é uma
// linha em FIXOS — e o teste do PU em scripts/verificar.mjs avisa: um feriado
// faltando desloca o preço reconstruído em ~0,05%, dez vezes a tolerância.

const MS_DIA = 86400000;

const dataUTC = (ano, mes, dia) => new Date(Date.UTC(ano, mes - 1, dia));
const iso = (d) => d.toISOString().slice(0, 10);

// Domingo de Páscoa pelo computus de Meeus/Jones/Butcher (calendário
// gregoriano). É aritmética fechada: não depende de tabela nem de fuso.
function domingoDePascoa(ano) {
  const a = ano % 19;
  const b = Math.floor(ano / 100);
  const c = ano % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const mes = Math.floor((h + l - 7 * m + 114) / 31);
  const dia = ((h + l - 7 * m + 114) % 31) + 1;
  return dataUTC(ano, mes, dia);
}

// Feriados nacionais de data fixa, como [mês, dia].
const FIXOS = [
  [1, 1],   // Confraternização Universal
  [4, 21],  // Tiradentes
  [5, 1],   // Dia do Trabalho
  [9, 7],   // Independência
  [10, 12], // Nossa Senhora Aparecida
  [11, 2],  // Finados
  [11, 15], // Proclamação da República
  [11, 20], // Consciência Negra (nacional desde 2024)
  [12, 25], // Natal
];

// Deslocamentos a partir do domingo de Páscoa, em dias.
const MOVEIS = [-48, -47, -2, 60]; // carnaval (seg, ter), sexta santa, Corpus Christi

// Um Set por ano, calculado uma vez. Um fluxo de NTN-B 2060 atravessa 35 anos
// e a duration é recalculada por título e por data de curva, então sem cache
// o mesmo ano seria reconstruído milhares de vezes.
const porAno = new Map();

export function feriadosDoAno(ano) {
  const guardado = porAno.get(ano);
  if (guardado) return guardado;

  const pascoa = domingoDePascoa(ano);
  const datas = new Set(FIXOS.map(([m, d]) => iso(dataUTC(ano, m, d))));
  for (const desloc of MOVEIS) datas.add(iso(new Date(pascoa.getTime() + desloc * MS_DIA)));

  porAno.set(ano, datas);
  return datas;
}

export function ehDiaUtil(data) {
  const diaDaSemana = data.getUTCDay();
  if (diaDaSemana === 0 || diaDaSemana === 6) return false;
  return !feriadosDoAno(data.getUTCFullYear()).has(iso(data));
}

// Dias úteis no intervalo (início, fim] — exclui o dia de partida e inclui o
// de chegada. É a contagem da precificação: um título que vence amanhã, com
// hoje e amanhã úteis, tem 1 dia útil pela frente, não 0 nem 2. Foi essa
// fronteira que fez o PU reconstruído bater com o oficial no centavo; contar
// de D+1 deixava um erro constante de +0,048%, que é exatamente (1+i)^(1/252).
export function diasUteis(inicioISO, fimISO) {
  const fim = new Date(Date.parse(`${String(fimISO).slice(0, 10)}T00:00:00Z`));
  let d = new Date(Date.parse(`${String(inicioISO).slice(0, 10)}T00:00:00Z`));
  if (!(d < fim)) return 0;

  let n = 0;
  while (d < fim) {
    d = new Date(d.getTime() + MS_DIA);
    if (ehDiaUtil(d)) n++;
  }
  return n;
}
