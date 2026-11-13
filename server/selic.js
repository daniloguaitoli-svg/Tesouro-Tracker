// server/selic.js — o que o mercado futuro embute para a Selic, reunião a reunião.
//
// A PERGUNTA: "o mercado espera que o Copom corte ou suba, e quanto?". O DI
// futuro responde, porque o preço de cada vencimento é o CDI acumulado até lá —
// e o CDI anda colado na Selic, que só muda em reunião do Copom. Então, se o
// DI que vence em janeiro embute mais (ou menos) juro do que o CDI de hoje
// daria até janeiro, a diferença é o que o mercado põe na reunião de dezembro.
//
// A CONTA (função pura, exercitada pelo verificar.mjs com um caminho
// conhecido): o CDI é tratado como uma escada — constante entre reuniões, com
// um degrau no dia útil seguinte a cada decisão. Para cada trecho entre dois
// vencimentos de DI que contém UMA reunião,
//
//   fator do trecho = (1+x)^(dias antes/252) · (1+x')^(dias depois/252)
//
// onde x é a taxa que vinha valendo e x' a que passa a valer. O fator do
// trecho sai dos dois preços de ajuste, os dias saem do calendário, x vem do
// trecho anterior: sobra x'. Mesma convenção do DI1 no resto do repositório,
// dias úteis/252 exponencial, conferida contra o preço de ajuste da B3.
//
// O QUE ISTO NÃO É, e a tela tem de dizer:
//   - Não é previsão. A taxa a termo carrega prêmio de risco: quem trava juro
//     por mais tempo cobra por isso, então a curva costuma embutir mais alta
//     (ou menos corte) do que o que de fato acontece.
//   - Supõe que o CDI só se move em reunião, e no tamanho exato da decisão.
//   - Quanto mais longe, mais frágil: os vencimentos ficam espaçados, e um
//     trecho com duas reuniões não deixa separar uma da outra — aí a conta
//     PARA, em vez de repartir o movimento no chute.

import { diasUteis, ehDiaUtil } from "./feriados.js";
import { dataDeISO } from "./util.js";

// O dia da DECISÃO de cada reunião ordinária (o segundo dos dois dias).
//
// DE FONTE, NÃO DE MEMÓRIA: calendários divulgados pelo Banco Central em
// 24/06/2025 (para 2026) e em 23/06/2026 (para 2027), conferidos em
// 11/11/2026 em mais de um veículo que os reproduz. O BC pode alterá-los e
// convocar reunião extraordinária — CALENDARIO_ATE diz até onde esta lista
// vai, e a tela mostra essa data. Ao virar o ano, acrescente o calendário
// seguinte (o BC o divulga em junho) em vez de deixar a lista acabar.
export const REUNIOES_COPOM = [
  "2026-01-28", "2026-03-18", "2026-04-29", "2026-06-17", "2026-08-05", "2026-09-16", "2026-11-04", "2026-12-09",
  "2027-01-27", "2027-03-17", "2027-04-28", "2027-06-16", "2027-08-04", "2027-09-22", "2027-10-27", "2027-12-08",
];
export const CALENDARIO_ATE = REUNIOES_COPOM[REUNIOES_COPOM.length - 1];
export const CALENDARIO_CONFERIDO_EM = "2026-11-11";

// O nome que a pesquisa Focus dá a uma reunião: "R8/2026" é a oitava reunião
// ordinária de 2026. Sai da POSIÇÃO da data dentro do ano no calendário acima
// — por isso só vale para datas que estão nele. null para as demais.
export function rotuloFocus(dataISO, reunioes = REUNIOES_COPOM) {
  const ano = String(dataISO).slice(0, 4);
  const doAno = reunioes.filter((m) => m.startsWith(ano));
  const i = doAno.indexOf(dataISO);
  return i < 0 ? null : `R${i + 1}/${ano}`;
}

// Um degrau com menos dias úteis que isto depois da reunião, dentro do
// trecho, é ruído: meio ponto-base no preço vira dezenas na taxa. Nesse caso
// o trecho é estendido até o vencimento seguinte.
const MIN_DIAS_DEPOIS = 5;

const MS_DIA = 86400000;
function proximoDiaUtil(iso) {
  let d = new Date(dataDeISO(iso).getTime() + MS_DIA);
  while (!ehDiaUtil(d)) d = new Date(d.getTime() + MS_DIA);
  return d.toISOString().slice(0, 10);
}

// `vertices`: [{ vencimento, taxa }] do DI1 na data `dataRef` (taxa em % a.a.).
// `cdiHoje`: o CDI anualizado publicado, em % — só é usado se a própria curva
// não o disser (ver abaixo).
//
// Devolve { dataRef, cdiDePartida, origemDaPartida, reunioes: [{ data,
// vigoraEm, cdiAntes, cdiDepois, variacaoPP, acumuladoPP, vertice }],
// parouEm, motivoDaParada }.
export function caminhoDaSelic({ dataRef, vertices, cdiHoje = null, reunioes = REUNIOES_COPOM }) {
  const vazio = { dataRef: dataRef ?? null, cdiDePartida: null, origemDaPartida: null, reunioes: [], parouEm: null, motivoDaParada: null };
  if (!dataRef || !Array.isArray(vertices)) return vazio;

  const pontos = vertices
    .filter((v) => v?.vencimento > dataRef && Number.isFinite(v.taxa))
    .map((v) => {
      const dias = diasUteis(dataRef, v.vencimento);
      return { vencimento: v.vencimento, dias, fator: Math.pow(1 + v.taxa / 100, dias / 252) };
    })
    .filter((p) => p.dias > 0)
    .sort((a, b) => a.dias - b.dias);
  if (!pontos.length) return vazio;

  // Cada reunião futura, com o dia em que a taxa nova começa a render.
  const futuras = reunioes.filter((m) => m >= dataRef).map((m) => ({ data: m, vigoraEm: proximoDiaUtil(m) }));

  // A PARTIDA. Se o primeiro vencimento chega ANTES de a próxima decisão
  // valer, o trecho de hoje até ele é CDI puro, e a taxa que ele embute é o
  // CDI de hoje segundo o próprio mercado — melhor que o número publicado,
  // que é de ontem e de outra fonte. Senão, usa o publicado.
  const primeira = futuras[0] || null;
  let x = null;
  let origem = null;
  let inicio = { vencimento: dataRef, dias: 0, fator: 1 };
  let i = 0;
  if (!primeira || pontos[0].vencimento <= primeira.vigoraEm) {
    x = Math.pow(pontos[0].fator, 252 / pontos[0].dias) - 1;
    origem = "curva";
    inicio = pontos[0];
    i = 1;
  } else if (cdiHoje != null && Number.isFinite(cdiHoje)) {
    x = cdiHoje / 100;
    origem = "publicado";
  } else {
    return { ...vazio, motivoDaParada: "sem CDI de partida: o primeiro vencimento já passa da próxima reunião e não há CDI publicado" };
  }

  const saida = { dataRef, cdiDePartida: x * 100, origemDaPartida: origem, reunioes: [], parouEm: null, motivoDaParada: null };
  let acumulado = 0;
  let r = 0; // próxima reunião ainda não resolvida

  while (i < pontos.length && r < futuras.length) {
    let fim = pontos[i];
    // Reuniões cuja taxa nova começa a valer dentro de (inicio, fim).
    const dentro = () => futuras.slice(r).filter((m) => m.vigoraEm < fim.vencimento);
    let ms = dentro();
    if (!ms.length) {
      // Trecho sem reunião: nada muda de degrau. Segue.
      inicio = fim;
      i++;
      continue;
    }
    // Poucos dias depois da reunião: estende até o vencimento seguinte, desde
    // que isso não traga outra reunião para dentro do trecho.
    while (ms.length === 1 && diasUteis(ms[0].vigoraEm, fim.vencimento) + 1 < MIN_DIAS_DEPOIS && i + 1 < pontos.length) {
      const seguinte = pontos[i + 1];
      if (futuras.slice(r).filter((m) => m.vigoraEm < seguinte.vencimento).length > 1) break;
      i++;
      fim = seguinte;
      ms = dentro();
    }
    if (ms.length > 1) {
      saida.parouEm = ms[0].data;
      saida.motivoDaParada = "duas reuniões entre dois vencimentos de DI: não dá para separar uma da outra";
      break;
    }

    const m = ms[0];
    // Pernoites que COMEÇAM antes de a taxa nova valer, e depois. diasUteis
    // conta (a, b], que é exatamente "pernoites que terminam em (a, b]".
    const antes = Math.max(0, diasUteis(inicio.vencimento, m.vigoraEm));
    const depois = fim.dias - inicio.dias - antes;
    if (depois <= 0) {
      inicio = fim;
      i++;
      continue;
    }
    const fatorDoTrecho = fim.fator / inicio.fator;
    const novo = Math.pow(fatorDoTrecho / Math.pow(1 + x, antes / 252), 252 / depois) - 1;
    const variacao = (novo - x) * 100;
    acumulado += variacao;
    saida.reunioes.push({
      data: m.data,
      vigoraEm: m.vigoraEm,
      cdiAntes: x * 100,
      cdiDepois: novo * 100,
      variacaoPP: variacao,
      acumuladoPP: acumulado,
      vertice: fim.vencimento,
      diasDepois: depois,
    });
    x = novo;
    inicio = fim;
    i++;
    r = futuras.indexOf(m) + 1;
  }

  if (!saida.parouEm && r < futuras.length && i >= pontos.length) {
    saida.parouEm = futuras[r].data;
    saida.motivoDaParada = "acabaram os vencimentos de DI";
  }
  return saida;
}
