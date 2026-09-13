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
export async function serie(cod, { dias = 2000 } = {}) {
  const hit = cache.get(cod);
  if (hit && Date.now() - hit.ts < TTL_MS) return hit.pontos;

  const ini = ddmmyyyy(new Date(Date.now() - dias * 864e5));
  const fim = ddmmyyyy(new Date());
  const url = `https://api.bcb.gov.br/dados/serie/bcdata.sgs.${cod}/dados?formato=json&dataInicial=${ini}&dataFinal=${fim}`;

  // O SGS ESTRANGULA requisições concorrentes, e o faz da pior maneira: devolve
  // HTTP 200 com uma página de erro em XML no corpo. Sem tratamento o
  // `r.json()` estoura, o allSettled de quem chamou engole, e a linha
  // simplesmente some da tela — foi o que aconteceu com o USD/BRL e o IPCA na
  // primeira sonda, com a série respondendo 200 quando pedida sozinha.
  //
  // Então: tenta de novo, com espera crescente, e trata corpo-não-JSON como
  // falha do mesmo tipo. Um 4xx não é retentado (se a série mudou de número,
  // insistir só adia o erro que precisa aparecer).
  const bruto = await (async () => {
    let ultimoErro;
    for (let tentativa = 0; tentativa < 3; tentativa++) {
      if (tentativa) await new Promise((r) => setTimeout(r, 400 * 2 ** tentativa));
      const r = await fetch(url);
      if (r.status >= 400 && r.status < 500) throw new Error(`BCB série ${cod}: HTTP ${r.status}`);
      if (!r.ok) { ultimoErro = new Error(`BCB indisponível (HTTP ${r.status})`); continue; }
      const texto = await r.text();
      try {
        return JSON.parse(texto);
      } catch {
        // Guarda o começo do corpo no erro: é o que diz se foi estrangulamento
        // ou se o formato mudou de vez.
        ultimoErro = new Error(`BCB série ${cod}: resposta não-JSON (${texto.slice(0, 60).replace(/\s+/g, " ")})`);
      }
    }
    throw ultimoErro;
  })();
  const pontos = bruto
    .map((p) => ({ date: isoDeBR(p.data), close: Number(p.valor) }))
    .filter((p) => p.date && Number.isFinite(p.close));
  cache.set(cod, { ts: Date.now(), pontos });
  return pontos;
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
