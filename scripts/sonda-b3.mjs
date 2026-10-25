// scripts/sonda-b3.mjs — reconhecimento das fontes da B3 (DI futuro e FRC).
//
// POR QUE EXISTE: os endereços da B3 recusam conexão do ambiente de
// desenvolvimento, medido em 25/10/2026 — www2.bmf.com.br, arquivos.b3.com.br
// e www.b3.com.br devolveram todos código 000 (sem resposta). É a mesma
// barreira do Yahoo, do SGS e do Tesouro, e a mesma solução: um runner do
// GitHub é o único lugar com rede aberta para esses endereços.
//
// ESTA SONDA É DIFERENTE DAS OUTRAS DUAS. As irmãs verificam fonte CONHECIDA:
// sabem o formato, e um desvio é defeito. Esta existe para DESCOBRIR o
// formato, porque não dá para escrever parser contra arquivo que nunca se viu
// (foi assim que o repositório errou com a ANBIMA). Daí ela imprimir amostra,
// que é o produto dela, e não reprovar em 404. Quando houver parser, ela
// herda a fronteira das irmãs.
//
// ---------------------------------------------------------------------------
// RODADA 1 — 25/10/2026. O PORTAL ANTIGO MORREU; NÃO INSISTA NELE.
//
//   TxRef1.asp (slcTaxa PRE, DOC, DOL) ... 404 nos três
//   lum-ajustes-do-pregao-ptBR.asp ....... 200, redireciona para a página nova
//                                          do Boletim Diário, SPA sem <table>
//   lum-ajustes ?dData1=DD/MM/AAAA ....... 200 com corpo VAZIO
//   SistemaPregao_excel1.asp DI1 ......... aceitou a conexão, não respondeu
//   SistemaPregao_excel1.asp FRC e DDI ... 200 → Erro.asp "Unspecified error"
//
// RODADA 2 — 25/10/2026. O UP2DATA RESPONDE, em dois passos.
//
//   requestname?fileName=X&date=AAAA-MM-DD  →  JSON com token
//   download/?token=…                       →  o arquivo
//
//   TradeInformationConsolidatedFile ..... 200 · ~5 MB · CSV ;
//   TradeInformationConsolidated ......... idem (os dois nomes servem)
//   InstrumentsConsolidatedFile .......... 200 · ~19 MB · CSV ;
//   SettlementPrices / PriceReport /
//   EconomicIndicatorPrice ............... 400, não existem
//
//   O CSV abre com uma linha solta "Status do Arquivo: Final" ANTES do
//   cabeçalho — quem der split e assumir a linha 0 como cabeçalho lê tudo
//   deslocado. Decimal é vírgula, separador é ponto e vírgula.
//
//   Colunas que interessam em TradeInformationConsolidated:
//     RptDt TckrSymb ISIN SgmtNm MinPric MaxPric TradAvrgPric LastPric
//     OscnPctg AdjstdQt AdjstdQtTax RefPric TradQty FinInstrmQty NtlFinVol
//   AdjstdQt é o PREÇO de ajuste e AdjstdQtTax é a TAXA de ajuste.
//
//   E em InstrumentsConsolidated: TckrSymb Asst XprtnDt SctyCtgyNm MktNm —
//   é o cadastro que traduz o código do contrato na data de vencimento.
// ---------------------------------------------------------------------------
//
// RODADA 3 — a pergunta que falta: DI1, FRC e DDI estão mesmo lá dentro, com
// taxa de ajuste preenchida? Saber que o arquivo tem as colunas certas não é
// o mesmo que saber que tem as linhas certas, e é a diferença entre "fonte
// encontrada" e "fonte confirmada".

import { ehDiaUtil } from "../server/feriados.js";

const MS_DIA = 86400000;
const BASE = "https://arquivos.b3.com.br/api/download";
const LIMITE_MS = 30000;

// Os três ativos que interessam agora. DI1 dá a curva em BRL; FRC e DDI dão o
// cupom cambial, que é a curva em USD. O prefixo basta: o código do contrato
// é ativo + letra do mês + ano (DI1F27 = janeiro de 2027).
const ALVOS = ["DI1", "FRC", "DDI"];

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
  if (ativo && porAlvo.has(ativo)) porAlvo.get(ativo).push(c);
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
    console.log(`\n  --- ${alvo}: ${achados.length} no cadastro ---`);
    for (const c of achados.slice(0, 8)) {
      console.log(`      ${c[jTicker]} | vence ${c[jVenc] || "—"} | ${c[jCateg] || "—"}`);
    }
  }
} catch (e) {
  console.log(`  falhou: ${e.message}`);
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
