// server/providers/bcb.js — séries oficiais do Banco Central (SGS), gratuitas e
// sem chave.
//
// Servem de moldura para ler a taxa real: a NTN-B paga IPCA + taxa real, então
// saber o IPCA acumulado e a Selic é o que dá sentido ao número. USD e EUR
// entram porque o PU em euro importa para quem pensa em mudança de país.
//
// Endpoint: api.bcb.gov.br/dados/serie/bcdata.sgs.{cod}/dados?formato=json
// Datas em dd/mm/aaaa; valores com ponto decimal.

import { isoDeBR } from "../util.js";

const TTL_MS = 30 * 60 * 1000;
const cache = new Map(); // cod -> { ts, pontos }

function ddmmyyyy(d) {
  const p = (n) => String(n).padStart(2, "0");
  return `${p(d.getUTCDate())}/${p(d.getUTCMonth() + 1)}/${d.getUTCFullYear()}`;
}

// O endpoint "ultimos/N" do BCB rejeita N grande (HTTP 400); intervalo de datas
// aceita vários anos tranquilamente.
// A URL de uma série, em UM lugar só.
//
// Existe separada porque a sonda precisa bater exatamente no mesmo endereço que
// o app usa. Ela batia em `/dados/ultimos/3`, que é outro endpoint do SGS — e
// que responde coisa diferente: numa execução de 15/09/2026 o `ultimos` deu
// 09/09 como último dia da série 4389 enquanto o intervalo de datas deu 11/09.
// Duas leituras discordando na mesma execução dão trabalho de investigar à toa,
// e, pior, a sonda estaria abonando um caminho que o app não percorre: se o
// intervalo quebrasse e o `ultimos` seguisse de pé, ela diria "ok" com a tela
// vazia.
export function urlSerie(cod, { dias = 2000 } = {}) {
  const ini = ddmmyyyy(new Date(Date.now() - dias * 864e5));
  const fim = ddmmyyyy(new Date());
  return `https://api.bcb.gov.br/dados/serie/bcdata.sgs.${cod}/dados?formato=json&dataInicial=${ini}&dataFinal=${fim}`;
}

export async function serie(cod, { dias = 2000 } = {}) {
  const hit = cache.get(cod);
  if (hit && Date.now() - hit.ts < TTL_MS) return hit.pontos;

  const url = urlSerie(cod, { dias });

  // O SGS ESTRANGULA requisições concorrentes, e o faz da pior maneira: devolve
  // HTTP 200 com um corpo que não é a lista de pontos. Sem tratamento a linha
  // simplesmente some da tela — foi o que aconteceu com o USD/BRL e o IPCA numa
  // sonda, com as séries respondendo 200 quando pedidas sozinhas.
  //
  // Então: tenta de novo, com espera crescente. Um 4xx não é retentado (se a
  // série mudou de número, insistir só adia o erro que precisa aparecer).
  let ultimoErro;
  let pontos = null;
  for (let tentativa = 0; tentativa < 3 && pontos === null; tentativa++) {
    if (tentativa) await new Promise((r) => setTimeout(r, 400 * 2 ** tentativa));
    const r = await fetch(url);
    if (r.status >= 400 && r.status < 500) throw new Error(`BCB série ${cod}: HTTP ${r.status}`);
    if (!r.ok) {
      ultimoErro = new Error(`BCB série ${cod}: indisponível (HTTP ${r.status})`);
      continue;
    }
    const lido = interpretarCorpoSgs(await r.text(), cod);
    if (lido.ok) pontos = lido.pontos;
    else ultimoErro = new Error(lido.motivo);
  }
  if (pontos === null) throw ultimoErro;

  // Lista vazia NÃO vai para o cache. Pode ser intervalo sem dado, mas quase
  // sempre é estrangulamento; guardá-la por 30 minutos transformaria um soluço
  // numa meia hora de tela vazia.
  if (!pontos.length) return pontos;
  cache.set(cod, { ts: Date.now(), pontos });
  return pontos;
}

// Interpreta o corpo de uma resposta do SGS. PURA e exportada para o
// verificar.mjs exercitá-la com fixture, pelo mesmo motivo dos outros parsers.
//
// O CASO QUE FALTAVA: `JSON.parse` aceita um OBJETO e devolve sem reclamar, e o
// `.map` estourava depois, FORA do laço de retentativa — sem retry, com a
// mensagem inútil "bruto.map is not a function", e engolido pelo allSettled de
// quem chamou. Foi assim que a série 4389 (CDI) sumiu numa sonda de 14/09/2026
// enquanto a tela seguia mostrando o CDI, que vinha de outra série. Corpo que
// não é lista agora conta como falha retentável, igual a corpo não-JSON.
export function interpretarCorpoSgs(texto, cod) {
  const amostra = String(texto ?? "").slice(0, 80).replace(/\s+/g, " ");
  let bruto;
  try {
    bruto = JSON.parse(texto);
  } catch {
    return { ok: false, motivo: `BCB série ${cod}: resposta não-JSON (${amostra})` };
  }
  if (!Array.isArray(bruto)) {
    return { ok: false, motivo: `BCB série ${cod}: JSON que não é lista de pontos (${amostra})` };
  }
  const pontos = bruto
    .map((p) => ({ date: isoDeBR(p?.data), close: Number(p?.valor) }))
    .filter((p) => p.date && Number.isFinite(p.close));
  return { ok: true, pontos };
}

// Último valor + variação em relação ao ponto anterior.
export async function ultimo(cod, opcoes) {
  const pontos = await serie(cod, opcoes);
  if (!pontos.length) return null;
  const ult = pontos[pontos.length - 1];
  const ant = pontos[pontos.length - 2] || ult;
  const change = ult.close - ant.close;
  return {
    valor: ult.close,
    data: ult.date,
    change,
    changePct: ant.close ? (change / ant.close) * 100 : 0,
    pontos,
  };
}

// IPCA acumulado nos últimos N meses, a partir da série de variações mensais
// (433). Composto, não somado — 0,5% ao mês doze vezes não dá 6%.
export function acumular(pontosMensais, meses = 12) {
  const ult = pontosMensais.slice(-meses);
  if (ult.length < meses) return null;
  const fator = ult.reduce((f, p) => f * (1 + p.close / 100), 1);
  return (fator - 1) * 100;
}

// Número puro do dólar, tolerante a falha (usado só para conversões auxiliares).
export async function usdbrl() {
  try {
    return (await ultimo(1, { dias: 30 }))?.valor ?? null;
  } catch {
    return null;
  }
}
