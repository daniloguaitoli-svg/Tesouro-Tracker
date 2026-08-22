// server/providers/yahoo.js — o Ibovespa (^BVSP), pela API pública de gráficos
// do Yahoo Finance.
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
// Yahoo falhar, o cartão mostra "—" e o resto da moldura segue inteiro.

const UA = { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" };
const TTL_MS = 10 * 60 * 1000;
const cache = new Map(); // symbol -> { ts, pontos }

export const SIMBOLO_IBOVESPA = "^BVSP";

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

// Fechamento mais recente do Ibovespa + variação do dia, no mesmo formato que
// o provider do BCB devolve (valor/data/change/changePct/pontos), para a
// moldura tratar todos os indicadores igual.
export async function ibovespa() {
  // 2 anos, não 1: a variação de 12 meses precisa de um ponto ANTES de
  // 365 dias atrás. Com range=1y o ponto mais antigo cai quase em cima do
  // alvo e a comparação sairia null (ou colada na borda) justamente no
  // número que a tela mostra em destaque.
  const pontos = await baixar(SIMBOLO_IBOVESPA, { range: "2y", interval: "1d", casas: 0 });
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
