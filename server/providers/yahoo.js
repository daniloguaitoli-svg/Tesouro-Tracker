// server/providers/yahoo.js — as bolsas (Ibovespa, S&P 500, Nasdaq, Dow Jones
// e AEX), pela API pública de gráficos do Yahoo Finance.
//
// POR QUE NÃO O BCB, como todo o resto da moldura macro: o SGS do Banco Central
// não publica o Ibovespa entre as séries que este app usa, e chutar um número
// de série seria rotular como "IBOVESPA" alguma outra série econômica — o tipo
// de erro que este repositório evita por princípio. O endpoint de gráficos do
// Yahoo é gratuito, sem chave, e é o mesmo caminho que o Cana-Tracker já usa
// para os contratos de Nova York; a implementação aqui é irmã daquela.
//
// Roda no SERVIDOR porque o Yahoo não manda cabeçalho de CORS — do navegador a
// chamada seria bloqueada.
//
// A bolsa é CONTEXTO nesta tela, não insumo de decisão de renda fixa: se o
// Yahoo falhar, o cartão mostra "—" e o resto da moldura segue inteiro. Com
// cinco índices isso vira regra dura: cada um é pedido separado e uma praça
// fora do ar não pode apagar as outras quatro.

import { INDICES, indicePorId } from "../catalogo.js";

const UA = { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" };
const TTL_MS = 10 * 60 * 1000;
const cache = new Map(); // symbol -> { ts, pontos }

export const SIMBOLO_IBOVESPA = indicePorId.ibovespa.simbolo;

// Extrai a série do payload do Yahoo. Pura e exportada para o verificar.mjs
// exercitar com fixture — o formato aninhado (chart.result[0].indicators…) é
// fácil de quebrar numa refatoração e não dá erro, só devolve vazio.
export function extrairSerie(json, { casas = 0 } = {}) {
  const result = json?.chart?.result?.[0];
  const stamps = result?.timestamp;
  const closes = result?.indicators?.quote?.[0]?.close;
  if (!Array.isArray(stamps) || !Array.isArray(closes)) return [];
  const pontos = [];
  for (let i = 0; i < stamps.length; i++) {
    if (closes[i] == null || !Number.isFinite(closes[i])) continue;
    pontos.push({
      date: new Date(stamps[i] * 1000).toISOString().slice(0, 10),
      close: Number(closes[i].toFixed(casas)),
    });
  }
  return pontos;
}

async function baixar(symbol, { range = "1y", interval = "1d", casas = 0 } = {}) {
  const hit = cache.get(symbol);
  if (hit && Date.now() - hit.ts < TTL_MS) return hit.pontos;

  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(
    symbol
  )}?range=${range}&interval=${interval}`;
  const r = await fetch(url, { headers: UA });
  if (!r.ok) throw new Error(`Yahoo indisponível (HTTP ${r.status})`);
  const pontos = extrairSerie(await r.json(), { casas });
  if (!pontos.length) throw new Error(`Série vazia do Yahoo para ${symbol}`);
  cache.set(symbol, { ts: Date.now(), pontos });
  return pontos;
}

// Último valor de um índice + variação em relação ao ponto anterior, no mesmo
// formato que o provider do BCB devolve (valor/data/change/changePct/pontos),
// para a tela tratar todos os indicadores igual.
export async function indice(id) {
  const meta = indicePorId[id];
  if (!meta) throw new Error(`Índice desconhecido: ${id}`);

  // 2 anos, não 1: a variação de 12 meses precisa de um ponto ANTES de
  // 365 dias atrás. Com range=1y o ponto mais antigo cai quase em cima do
  // alvo e a comparação sairia null (ou colada na borda) justamente no
  // número que a tela mostra em destaque. Dois anos também garantem base
  // para o acumulado no ano em qualquer dia — inclusive 2 de janeiro, quando
  // a janela do ano tem um pregão e a base está no ano anterior.
  const pontos = await baixar(meta.simbolo, { range: "2y", interval: "1d", casas: meta.casas });
  const ult = pontos[pontos.length - 1];
  const ant = pontos[pontos.length - 2] || ult;
  const change = ult.close - ant.close;
  return {
    id: meta.id,
    nome: meta.nome,
    simbolo: meta.simbolo,
    praca: meta.praca,
    moeda: meta.moeda,
    casas: meta.casas,
    valor: ult.close,
    data: ult.date,
    change,
    changePct: ant.close ? (change / ant.close) * 100 : 0,
    pontos,
  };
}

// Todos os índices, cada um por sua conta: allSettled, não all. Uma praça fora
// do ar devolve null naquela posição e as outras seguem.
export async function todosIndices() {
  const r = await Promise.allSettled(INDICES.map((i) => indice(i.id)));
  return r.map((x, i) => (x.status === "fulfilled" ? x.value : { id: INDICES[i].id, erro: String(x.reason?.message || x.reason) }));
}

// O Painel e o getMacro pedem só o Ibovespa; casca fina sobre indice().
export async function ibovespa() {
  return indice("ibovespa");
}
