// ---------------------------------------------------------------------------
// O QUE JÁ FOI MEDIDO — 25/10/2026. NÃO PRECISA SER REFEITO.
//
// RODADA 1: o portal www2.bmf.com.br morreu. TxRef1.asp em 404, ajustes
// redirecionando ou vazio, SistemaPregao pendurando ou em Erro.asp.
//
// RODADA 2: o UP2DATA responde, em dois passos —
//   requestname?fileName=X&date=AAAA-MM-DD  →  JSON com token
//   download/?token=…                       →  o arquivo
// Servem TradeInformationConsolidatedFile (~5 MB) e InstrumentsConsolidatedFile
// (~19 MB), os dois CSV com ponto e vírgula e decimal por vírgula. O arquivo
// abre com uma linha solta "Status do Arquivo: Final" ANTES do cabeçalho —
// quem assumir a linha 0 como cabeçalho lê tudo deslocado.
//
// RODADA 3: DI1 (44), FRC (43) e DDI (44) estão lá, com AdjstdQtTax
// preenchida. O FRC não tem AdjstdQt porque não é posição: é a forma de
// negociar o DDI (compra o curto, vende o longo), e no fim do dia o que resta
// são as pernas de DDI. Convenções confirmadas no número:
//   DI1  PU = 100000/(1+i)^(du/252)   — DI1F27 bateu no centavo com 47 du
//   DDI  PU = 100000/(1+c·n/360)      — linear, ACT/360, dias corridos
// ---------------------------------------------------------------------------
//
// RODADA 4 — quatro perguntas que decidem o desenho da curva em USD:
//
//   1. O CASADO está no arquivo? A B3 o define como operação estruturada CSD2,
//      com perna à vista USDP0002. Como o FRC, não deixa posição em aberto —
//      mas pode aparecer como NEGÓCIO. Se aparecer, a curva em USD pode ser
//      ancorada em D0 sem fonte nova, porque spot = DOL − casado.
//
//   2. A TxRef mudou de endereço (sistemaswebb3-derivativos.b3.com.br). A
//      sonda busca a página e procura o endereço da API por trás dela, em vez
//      de adivinhar caminho.
//
//   3. O vértice curto do FRC é mesmo o próximo DDI em aberto? Testado pela
//      identidade do bootstrap, não por suposição.
//
//   4. O vencimento é sempre o primeiro dia útil do mês? O feriados.js sabe
//      calcular, então vira invariante de graça.

import { ehDiaUtil } from "../server/feriados.js";

const MS_DIA = 86400000;
const BASE = "https://arquivos.b3.com.br/api/download";
const LIMITE_MS = 30000;

// Os três ativos que interessam agora. DI1 dá a curva em BRL; FRC e DDI dão o
// cupom cambial, que é a curva em USD. O prefixo basta: o código do contrato
// é ativo + letra do mês + ano (DI1F27 = janeiro de 2027).
const ALVOS = ["DI1", "FRC", "DDI", "DOL"];
// Códigos do casado: CSD2 é a operação estruturada, USDP0002 a perna à
// vista. Procurados por prefixo solto porque não seguem o padrão
// ativo+mês+ano dos futuros.
const CASADO = ["CSD2", "USDP"];

function diasUteisAtras(n) {
  let d = new Date(Date.now() - MS_DIA);
  while (n > 0) {
    if (ehDiaUtil(d)) n--;
    if (n > 0) d = new Date(d.getTime() - MS_DIA);
  }
  while (!ehDiaUtil(d)) d = new Date(d.getTime() - MS_DIA);
  return d.toISOString().slice(0, 10);
}

const DATA = diasUteisAtras(1);

async function baixar(nomeArquivo) {
  const r1 = await fetch(`${BASE}/requestname?fileName=${encodeURIComponent(nomeArquivo)}&date=${DATA}&recaptchaToken=`, {
    headers: { Accept: "application/json", "User-Agent": "tesouro-tracker (sonda de reconhecimento)" },
    signal: AbortSignal.timeout(LIMITE_MS),
  });
  if (!r1.ok) throw new Error(`passo 1 devolveu HTTP ${r1.status}`);
  const { token } = await r1.json();
  if (!token) throw new Error("passo 1 não trouxe token");

  const r2 = await fetch(`${BASE}/?token=${encodeURIComponent(token)}`, {
    headers: { "User-Agent": "tesouro-tracker (sonda de reconhecimento)" },
    signal: AbortSignal.timeout(LIMITE_MS),
  });
  if (!r2.ok) throw new Error(`passo 2 devolveu HTTP ${r2.status}`);
  return new TextDecoder("utf-8", { fatal: false }).decode(new Uint8Array(await r2.arrayBuffer()));
}

// O cabeçalho NÃO é a primeira linha: o arquivo abre com "Status do Arquivo".
// Procura a linha que tem RptDt em vez de contar linhas — contar quebraria no
// dia em que a B3 acrescentar outra linha de aviso.
function abrirCsv(texto) {
  const linhas = texto.split(/\r?\n/);
  const iCab = linhas.findIndex((l) => /(^|;)RptDt(;|$)/.test(l));
  if (iCab < 0) throw new Error("não achei a linha de cabeçalho (RptDt)");
  const colunas = linhas[iCab].split(";");
  const idx = (nome) => colunas.indexOf(nome);
  return { colunas, idx, corpo: linhas.slice(iCab + 1) };
}

const ativoDe = (ticker) => (ticker.match(/^([A-Z0-9]{3})[FGHJKMNQUVXZ]\d{2}$/) || [])[1] || null;

console.log(`sonda B3 rodada 3 — DI1, FRC e DDI em ${DATA}\n`);

// ---------- negócios e ajustes ----------
console.log("=== TradeInformationConsolidated ===");
let negocios;
try {
  negocios = abrirCsv(await baixar("TradeInformationConsolidatedFile"));
  console.log(`  ${negocios.corpo.length} linhas, ${negocios.colunas.length} colunas`);
} catch (e) {
  console.log(`  falhou: ${e.message}`);
  process.exit(0);
}

const iTicker = negocios.idx("TckrSymb");
const iSegm = negocios.idx("SgmtNm");
const iAjuste = negocios.idx("AdjstdQt");
const iTaxa = negocios.idx("AdjstdQtTax");
const iQtd = negocios.idx("TradQty");

const porAlvo = new Map(ALVOS.map((a) => [a, []]));
const segmentos = new Map();
// ticker -> { taxa (do arquivo de negócios), venc (do cadastro) }. Os dois
// arquivos se encontram aqui: sem o cadastro não há prazo, sem os negócios
// não há taxa, e a curva precisa dos dois.
const vencimentos = new Map();

for (const linha of negocios.corpo) {
  if (!linha) continue;
  const c = linha.split(";");
  const ticker = c[iTicker];
  if (!ticker) continue;

  // Inventário dos segmentos: guardado de passagem, porque o download é a
  // parte cara e refazê-lo depois só para contar seria desperdício.
  const seg = c[iSegm] || "(sem segmento)";
  segmentos.set(seg, (segmentos.get(seg) || 0) + 1);

  const ativo = ativoDe(ticker);
  if (ativo && porAlvo.has(ativo)) {
    porAlvo.get(ativo).push(c);
    // Taxa de ajuste guardada por ticker: é o que a identidade do bootstrap
    // vai consumir, e varrer o arquivo de novo depois seria desperdício.
    const taxa = Number(String(c[iTaxa] || "").replace(",", "."));
    vencimentos.set(ticker, { taxa: Number.isFinite(taxa) ? taxa : null, venc: null });
  }
}

// O CASADO. Procurado por prefixo solto porque CSD2/USDP não seguem o padrão
// ativo+mês+ano. Se vier com preço, a curva em USD pode ser ancorada em D0.
console.log("\n  --- casado (CSD2) e perna à vista (USDP) ---");
{
  const iMin = negocios.idx("MinPric");
  const iUlt = negocios.idx("LastPric");
  const iMed = negocios.idx("TradAvrgPric");
  const achados = [];
  for (const linha of negocios.corpo) {
    if (!linha) continue;
    const c = linha.split(";");
    const t = c[iTicker] || "";
    if (CASADO.some((p) => t.startsWith(p))) achados.push(c);
  }
  if (!achados.length) {
    console.log("    nenhum CSD2 nem USDP no arquivo de negócios.");
    console.log("    → o casado não vem por aqui; a curva em USD começa no vértice curto do FRC.");
  } else {
    console.log(`    ${achados.length} linhas. ticker | segmento | mín | médio | último | ajuste | taxa | negócios`);
    for (const c of achados.slice(0, 12)) {
      console.log(
        `      ${c[iTicker]} | ${c[iSegm]} | ${c[iMin] || "—"} | ${c[iMed] || "—"} | ${c[iUlt] || "—"} | ${c[iAjuste] || "—"} | ${c[iTaxa] || "—"} | ${c[iQtd] || "0"}`
      );
    }
  }
}

for (const alvo of ALVOS) {
  const linhas = porAlvo.get(alvo);
  console.log(`\n  --- ${alvo}: ${linhas.length} contratos ---`);
  if (!linhas.length) {
    console.log("    nenhum. Ou o prefixo não é esse, ou o ativo não está neste arquivo.");
    continue;
  }
  const comTaxa = linhas.filter((c) => c[iTaxa]).length;
  const comAjuste = linhas.filter((c) => c[iAjuste]).length;
  console.log(`    com AdjstdQt (preço de ajuste): ${comAjuste} · com AdjstdQtTax (taxa): ${comTaxa}`);
  console.log(`    ticker | segmento | ajuste | taxa | negócios`);
  for (const c of linhas.slice(0, 8)) {
    console.log(`      ${c[iTicker]} | ${c[iSegm]} | ${c[iAjuste] || "—"} | ${c[iTaxa] || "—"} | ${c[iQtd] || "0"}`);
  }
}

// ---------- cadastro: o vencimento de cada contrato ----------
console.log("\n=== InstrumentsConsolidated (vencimentos) ===");
try {
  const cad = abrirCsv(await baixar("InstrumentsConsolidatedFile"));
  const jTicker = cad.idx("TckrSymb");
  const jVenc = cad.idx("XprtnDt");
  const jCateg = cad.idx("SctyCtgyNm");
  console.log(`  ${cad.corpo.length} linhas`);

  for (const alvo of ALVOS) {
    const achados = [];
    for (const linha of cad.corpo) {
      if (!linha) continue;
      const c = linha.split(";");
      if (ativoDe(c[jTicker]) === alvo) achados.push(c);
    }
    for (const c of achados) {
      const atual = vencimentos.get(c[jTicker]);
      if (atual) atual.venc = c[jVenc] || null;
      else vencimentos.set(c[jTicker], { taxa: null, venc: c[jVenc] || null });
    }
    console.log(`\n  --- ${alvo}: ${achados.length} no cadastro ---`);
    for (const c of achados.slice(0, 6)) {
      console.log(`      ${c[jTicker]} | vence ${c[jVenc] || "—"} | ${c[jCateg] || "—"}`);
    }
  }
} catch (e) {
  console.log(`  falhou: ${e.message}`);
}

// DDI do mais curto ao mais longo. O vértice curto é o PRIMEIRO VENCIMENTO EM
// ABERTO, que muda de mês em mês — por isso é derivado da ordenação por data,
// nunca escrito à mão.
const ddiOrdenado = [...vencimentos.entries()]
  .filter(([tk, v]) => tk.startsWith("DDI") && v.venc && v.taxa != null)
  .sort((a, b) => a[1].venc.localeCompare(b[1].venc))
  .map(([tk]) => tk);

// ---------- a identidade do bootstrap ----------
// Se o FRC é a taxa a termo entre o DDI curto e o vencimento, então
//   (1 + c_longo·n_longo/360) = (1 + c_curto·n_curto/360)·(1 + f·Δn/360)
// Fechar isso prova o vértice curto pelo DADO, não por suposição — e vira
// invariante permanente, como o PU da LTN já é.
console.log("\n=== identidade do bootstrap (DDI curto + FRC = DDI longo) ===");
{
  const dias = (a, b) => Math.round((Date.parse(b) - Date.parse(a)) / MS_DIA);
  const curto = vencimentos.get(ddiOrdenado[0]);
  if (!curto || ddiOrdenado.length < 3) {
    console.log("  faltou vencimento no cadastro para montar o teste");
  } else {
    const nCurto = dias(DATA, curto.venc);
    console.log(`  vértice curto: ${ddiOrdenado[0]} vence ${curto.venc} (${nCurto} dias), taxa ${curto.taxa}`);
    console.log("  longo | n | c_longo | f (FRC) | implícito | erro");
    for (const tk of ddiOrdenado.slice(1, 7)) {
      const lon = vencimentos.get(tk);
      const frc = vencimentos.get("FRC" + tk.slice(3));
      if (!lon || !frc?.taxa) continue;
      const nLongo = dias(DATA, lon.venc);
      const esperado = (1 + curto.taxa / 100 * nCurto / 360) * (1 + frc.taxa / 100 * (nLongo - nCurto) / 360);
      const observado = 1 + lon.taxa / 100 * nLongo / 360;
      console.log(
        `    ${tk} | ${nLongo} | ${lon.taxa} | ${frc.taxa} | ${esperado.toFixed(6)} | ${(((esperado / observado) - 1) * 100).toFixed(4)}%`
      );
    }
  }
}

// ---------- o vencimento é o primeiro dia útil do mês? ----------
console.log("\n=== vencimento = primeiro dia útil do mês? ===");
{
  let confere = 0;
  let falha = 0;
  for (const [tk, v] of vencimentos) {
    if (!v.venc || !/^(DI1|DDI)/.test(tk)) continue;
    const [a, m] = v.venc.split("-").map(Number);
    let d = new Date(Date.UTC(a, m - 1, 1));
    while (!ehDiaUtil(d)) d = new Date(d.getTime() + MS_DIA);
    if (d.toISOString().slice(0, 10) === v.venc) confere++;
    else {
      falha++;
      if (falha <= 5) console.log(`    ${tk}: vence ${v.venc}, mas o 1º dia útil é ${d.toISOString().slice(0, 10)}`);
    }
  }
  console.log(`  ${confere} conferem, ${falha} divergem`);
}

// ---------- a TxRef mudou de casa ----------
// Em vez de adivinhar o caminho da API, busca a página e procura nela o
// endereço que o JavaScript usa. Adivinhar caminho já custou a rodada 1.
console.log("\n=== Taxas de Referência (endereço novo) ===");
try {
  const r = await fetch("https://sistemaswebb3-derivativos.b3.com.br/referenceRatesPage/all?language=pt-br", {
    headers: { "User-Agent": "tesouro-tracker (sonda de reconhecimento)" },
    signal: AbortSignal.timeout(LIMITE_MS),
  });
  const html = await r.text();
  console.log(`  HTTP ${r.status} · ${html.length} bytes`);
  const pistas = new Set();
  for (const m of html.matchAll(/https?:\/\/[A-Za-z0-9.\-]*b3\.com\.br[^"'\s<>)]{0,120}/g)) pistas.add(m[0]);
  for (const m of html.matchAll(/["'](\/[A-Za-z0-9\-_/]*(?:[Pp]roxy|[Aa]pi|[Ss]ervice)[A-Za-z0-9\-_/]*)["']/g)) pistas.add(m[1]);
  for (const m of html.matchAll(/src=["']([^"']+\.js)["']/g)) pistas.add(`(js) ${m[1]}`);
  if (pistas.size) {
    console.log("  pistas de endereço na página:");
    for (const p of [...pistas].slice(0, 20)) console.log(`    ${p}`);
  } else {
    console.log("  nenhuma pista no HTML — a página monta tudo por JavaScript");
  }
} catch (e) {
  console.log(`  não respondeu: ${e?.cause?.code || e.message}`);
}

// ---------- inventário, para depois ----------
// O usuário pediu para olhar os outros ativos MAIS TARDE. Fica tabulado aqui
// porque os 5 MB já foram baixados: contar agora é de graça, baixar de novo
// não é.
console.log("\n=== inventário dos segmentos (guardado para depois) ===");
for (const [seg, n] of [...segmentos.entries()].sort((a, b) => b[1] - a[1]).slice(0, 15)) {
  console.log(`  ${String(n).padStart(7)}  ${seg}`);
}

process.exit(0);
