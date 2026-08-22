// server/providers/globais.js — taxas de política monetária do Fed e do BCE,
// pelas vias públicas e sem chave.
//
// FONTES (ambas oficiais, gratuitas e sem cadastro):
//   Fed — o CSV público do FRED (St. Louis Fed), endpoint fredgraph.csv:
//     DFEDTARU / DFEDTARL = teto e piso da meta dos Fed Funds, série diária.
//     (A API "de verdade" do FRED exige chave; o fredgraph.csv não.)
//   BCE — o Data Portal do BCE (data-api.ecb.europa.eu), formato csvdata:
//     FM.B.U2.EUR.4F.KR.DFR.LEV    = taxa de depósito (a operacional hoje)
//     FM.B.U2.EUR.4F.KR.MRR_FR.LEV = taxa de refinanciamento (refi/MRO)
//
// QUEM CHAMA ISTO É O COLETOR, não a função serverless: decisão de política
// monetária muda ~8 vezes por ano, então duas leituras por dia sobram — e o
// resultado fica versionado em dados/global.json, à prova de bloqueio de rede
// em produção (o mesmo padrão do cache do CEPEA no Cana-Tracker).
//
// A "última decisão" é DERIVADA DA SÉRIE: o dia em que o valor mudou. Isso é a
// data de VIGÊNCIA da taxa nova, não a data da reunião (que costuma ser 1-2
// dias antes). A UI diz "vigente desde", que é o que o dado realmente sabe.
//
// PARSING DEFENSIVO, como todo parser desta base: colunas achadas por nome no
// cabeçalho, nunca por posição; formato irreconhecível devolve erro com
// amostra em vez de número inventado. Os parsers são puros e exportados para o
// verificar.mjs exercitá-los com fixtures.

const UA = { "User-Agent": "tesouro-tracker (github actions)", Accept: "text/csv,*/*" };

export const URL_FED_TETO = "https://fred.stlouisfed.org/graph/fredgraph.csv?id=DFEDTARU&cosd=2019-01-01";
export const URL_FED_PISO = "https://fred.stlouisfed.org/graph/fredgraph.csv?id=DFEDTARL&cosd=2019-01-01";
export const URL_BCE_DEPOSITO =
  "https://data-api.ecb.europa.eu/service/data/FM/B.U2.EUR.4F.KR.DFR.LEV?format=csvdata&startPeriod=2019-01-01";
export const URL_BCE_REFI =
  "https://data-api.ecb.europa.eu/service/data/FM/B.U2.EUR.4F.KR.MRR_FR.LEV?format=csvdata&startPeriod=2019-01-01";

// CSV do FRED: cabeçalho com a coluna de data ("DATE" ou "observation_date")
// e uma coluna com o id da série. Valor ausente vem como ".".
export function parseCsvFred(texto) {
  const linhas = String(texto ?? "").trim().split(/\r?\n/);
  if (linhas.length < 2) return { ok: false, motivo: "arquivo vazio", amostra: String(texto ?? "").slice(0, 200), pontos: [] };
  const cab = linhas[0].split(",").map((h) => h.trim().toLowerCase());
  const iData = cab.findIndex((h) => /date/.test(h));
  const iValor = cab.findIndex((h, i) => i !== iData && h);
  if (iData < 0 || iValor < 0) {
    return { ok: false, motivo: "cabeçalho FRED irreconhecível", amostra: linhas[0].slice(0, 200), pontos: [] };
  }
  const pontos = [];
  for (const l of linhas.slice(1)) {
    const c = l.split(",");
    const date = (c[iData] || "").trim();
    const v = Number((c[iValor] || "").trim());
    if (/^\d{4}-\d{2}-\d{2}$/.test(date) && Number.isFinite(v)) pontos.push({ date, close: v });
  }
  return { ok: pontos.length > 0, motivo: pontos.length ? null : "nenhum ponto numérico", pontos };
}

// csvdata do BCE: muitas colunas; interessam TIME_PERIOD e OBS_VALUE.
export function parseCsvBce(texto) {
  const linhas = String(texto ?? "").trim().split(/\r?\n/);
  if (linhas.length < 2) return { ok: false, motivo: "arquivo vazio", amostra: String(texto ?? "").slice(0, 200), pontos: [] };
  const cab = linhas[0].split(",").map((h) => h.trim().toUpperCase());
  const iData = cab.indexOf("TIME_PERIOD");
  const iValor = cab.indexOf("OBS_VALUE");
  if (iData < 0 || iValor < 0) {
    return { ok: false, motivo: "cabeçalho BCE sem TIME_PERIOD/OBS_VALUE", amostra: linhas[0].slice(0, 200), pontos: [] };
  }
  const pontos = [];
  for (const l of linhas.slice(1)) {
    const c = l.split(",");
    const date = (c[iData] || "").trim();
    const v = Number((c[iValor] || "").trim());
    if (/^\d{4}-\d{2}-\d{2}$/.test(date) && Number.isFinite(v)) pontos.push({ date, close: v });
  }
  pontos.sort((a, b) => (a.date < b.date ? -1 : 1));
  return { ok: pontos.length > 0, motivo: pontos.length ? null : "nenhum ponto numérico", pontos };
}

// A última decisão embutida numa série de taxa: o ponto em que o valor mudou
// pela última vez. Devolve a taxa atual, desde quando vigora e o tamanho do
// último movimento.
export function ultimaDecisao(pontos) {
  if (!pontos || pontos.length === 0) return null;
  const atual = pontos[pontos.length - 1];
  let i = pontos.length - 1;
  while (i > 0 && pontos[i - 1].close === atual.close) i--;
  const anterior = i > 0 ? pontos[i - 1] : null;
  return {
    taxa: atual.close,
    data: atual.date,
    vigenteDesde: pontos[i].date,
    variacaoPP: anterior ? Number((atual.close - anterior.close).toFixed(4)) : null,
    taxaAnterior: anterior ? anterior.close : null,
  };
}

async function baixar(url, parser) {
  const r = await fetch(url, { headers: UA });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  const resultado = parser(await r.text());
  if (!resultado.ok) throw new Error(`${resultado.motivo}${resultado.amostra ? ` — amostra: ${resultado.amostra}` : ""}`);
  return resultado.pontos;
}

// Lê tudo e monta o objeto que o coletor versiona. Nunca lança: cada fonte que
// falhar vira null + o erro anotado, e o coletor mantém o valor anterior.
export async function lerGlobais() {
  const saida = { fed: null, bce: null, erros: [] };

  try {
    const [teto, piso] = await Promise.all([baixar(URL_FED_TETO, parseCsvFred), baixar(URL_FED_PISO, parseCsvFred)]);
    const d = ultimaDecisao(teto);
    const pisoAtual = piso[piso.length - 1]?.close ?? null;
    saida.fed = {
      nome: "Federal Reserve (EUA)",
      indicador: "Meta dos Fed Funds",
      limiteSuperior: d.taxa,
      limiteInferior: pisoAtual,
      vigenteDesde: d.vigenteDesde,
      variacaoPP: d.variacaoPP,
      data: d.data,
      fonte: "FRED / St. Louis Fed (DFEDTARU, DFEDTARL)",
    };
  } catch (e) {
    saida.erros.push(`fed: ${e.message}`);
  }

  try {
    const [deposito, refi] = await Promise.all([baixar(URL_BCE_DEPOSITO, parseCsvBce), baixar(URL_BCE_REFI, parseCsvBce)]);
    const d = ultimaDecisao(deposito);
    const refiAtual = refi[refi.length - 1]?.close ?? null;
    saida.bce = {
      nome: "Banco Central Europeu",
      indicador: "Taxa de depósito (e refi)",
      deposito: d.taxa,
      refi: refiAtual,
      vigenteDesde: d.vigenteDesde,
      variacaoPP: d.variacaoPP,
      data: d.data,
      fonte: "ECB Data Portal (DFR, MRR)",
    };
  } catch (e) {
    saida.erros.push(`bce: ${e.message}`);
  }

  return saida;
}
