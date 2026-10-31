// scripts/sonda-b3-dap.mjs — a convenção da DAP (cupom de IPCA).
//
// POR QUE EXISTE: a rodada 5 achou a DAP e a 5c mediu que ela é líquida
// (166.136 contratos e R$ 23,4 bi em 30/10/2026 — mais financeiro que o FRC,
// que já está em produção). Falta o último portão antes de virar curva: em
// que convenção a taxa publicada vira o preço de ajuste publicado.
//
// NÃO DÁ PARA PRESUMIR. Com o FRC a presunção teria errado feio: o DI1 é
// dias úteis/252 EXPONENCIAL e o FRC é dias corridos/360 LINEAR, no mesmo
// arquivo, na mesma coluna. Trocar as duas produz número plausível e falso.
//
// O VALOR DE FACE TAMBÉM NÃO É CHUTADO, e é isto que faz o teste fechar
// sozinho. Em vez de supor 100.000 e ver se o preço bate, inverte-se a
// conta: para cada convenção candidata, calcula-se a FACE IMPLÍCITA de cada
// vencimento,
//
//     face = ajuste × (fator de desconto daquela convenção)
//
// e olha-se a DISPERSÃO entre os vencimentos. Na convenção certa a face é a
// mesma para todos — é uma constante do contrato — e nas erradas ela abre.
// Assim a mesma medição descobre a convenção E a face, e a prova é a
// constância em 15 vencimentos, não a coincidência em um.
//
// COM CONTROLE: o mesmo teste roda no DI1, cuja resposta já é conhecida
// (exponencial du/252, face 100.000, conferido ao centavo em 23/10/2026). Se
// o controle não reproduzir isso, o defeito está no aparelho e não no dado —
// e qualquer conclusão sobre a DAP estaria contaminada.
//
// RODA NO RUNNER: a B3 recusa conexão do ambiente de desenvolvimento.
// Não grava nada e não faz commit.
import { diasUteis } from "../server/feriados.js";

const MS_DIA = 86400000;
const BASE = "https://arquivos.b3.com.br/api/download";
const LIMITE_MS = 60000;

import { ehDiaUtil } from "../server/feriados.js";

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

function abrirCsv(texto) {
  const linhas = texto.split(/\r?\n/);
  const iCab = linhas.findIndex((l) => /(^|;)RptDt(;|$)/.test(l));
  if (iCab < 0) throw new Error("não achei a linha de cabeçalho (RptDt)");
  const colunas = linhas[iCab].split(";");
  return { colunas, idx: (nome) => colunas.indexOf(nome), corpo: linhas.slice(iCab + 1) };
}

const num = (s) => {
  const v = Number(String(s || "").replace(",", "."));
  return Number.isFinite(v) ? v : null;
};
const raizDe = (t) => (t.match(/^([A-Z0-9]{3})[FGHJKMNQUVXZ]\d{2}$/) || [])[1] || null;
const diasCorridos = (a, b) => Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / MS_DIA);

// As quatro convenções plausíveis. As duas primeiras são as que este
// repositório já usa de verdade; as outras duas entram para que "fechou na
// primeira" signifique alguma coisa — uma candidata sozinha sempre vence.
const CONVENCOES = [
  { id: "exp du/252", face: (pu, i, du) => pu * Math.pow(1 + i, du / 252) },
  { id: "lin corr/360", face: (pu, i, du, n) => pu * (1 + (i * n) / 360) },
  { id: "exp corr/365", face: (pu, i, du, n) => pu * Math.pow(1 + i, n / 365) },
  { id: "lin du/252", face: (pu, i, du) => pu * (1 + (i * du) / 252) },
];

console.log(`sonda B3 rodada 6 — a convenção da DAP, em ${DATA}\n`);

let negocios, cadastro;
try {
  negocios = abrirCsv(await baixar("TradeInformationConsolidatedFile"));
  cadastro = abrirCsv(await baixar("InstrumentsConsolidatedFile"));
} catch (e) {
  // Fonte que não responde é tempo, não defeito.
  console.log(`arquivos não vieram: ${e.message}`);
  console.log("inconclusivo");
  process.exit(0);
}

const iTicker = negocios.idx("TckrSymb");
const iAjuste = negocios.idx("AdjstdQt");
const iTaxa = negocios.idx("AdjstdQtTax");
const iQtd = negocios.idx("FinInstrmQty");

const contratos = new Map();
for (const linha of negocios.corpo) {
  if (!linha) continue;
  const c = linha.split(";");
  const raiz = raizDe(c[iTicker] || "");
  if (raiz !== "DAP" && raiz !== "DI1") continue;
  const pu = num(c[iAjuste]);
  const taxa = num(c[iTaxa]);
  if (pu == null || taxa == null) continue;
  contratos.set(c[iTicker], { ticker: c[iTicker], raiz, pu, taxa, qtd: num(c[iQtd]) || 0 });
}

// O cadastro traz o vencimento e os campos de tamanho do contrato. Os de
// tamanho entram no log para CONFERIR a face implícita contra o que a B3
// declara — duas rotas independentes para o mesmo número.
const iT = cadastro.idx("TckrSymb");
const iV = cadastro.idx("XprtnDt");
const iMult = cadastro.idx("CtrctMltplr");
const iCota = cadastro.idx("AsstQtnQty");
const iVal = cadastro.idx("ValTpNm");
for (const linha of cadastro.corpo) {
  if (!linha) continue;
  const c = linha.split(";");
  const r = contratos.get(c[iT]);
  if (!r) continue;
  r.venc = (c[iV] || "").slice(0, 10);
  r.multiplicador = iMult >= 0 ? c[iMult] : null;
  r.cotacao = iCota >= 0 ? c[iCota] : null;
  r.tipoValor = iVal >= 0 ? c[iVal] : null;
}

function testar(raiz, rotulo) {
  const lista = [...contratos.values()]
    .filter((x) => x.raiz === raiz && /^\d{4}-\d{2}-\d{2}$/.test(x.venc || "") && x.venc > DATA)
    .sort((a, b) => a.venc.localeCompare(b.venc));

  console.log(`\n=== ${rotulo} — ${lista.length} vencimentos com ajuste, taxa e data ===`);
  if (!lista.length) return;
  const am = lista[0];
  console.log(`  cadastro diz: CtrctMltplr=${am.multiplicador ?? "—"} · AsstQtnQty=${am.cotacao ?? "—"} · ValTpNm=${am.tipoValor ?? "—"}`);

  const resultados = [];
  for (const conv of CONVENCOES) {
    const faces = lista.map((x) => {
      const du = diasUteis(DATA, x.venc);
      const n = diasCorridos(DATA, x.venc);
      return conv.face(x.pu, x.taxa / 100, du, n);
    });
    const min = Math.min(...faces);
    const max = Math.max(...faces);
    // Dispersão relativa: na convenção certa a face é constante, logo isto
    // vai a zero. É o critério, e é independente de qual seja a face.
    const dispersao = max / min - 1;
    resultados.push({ conv: conv.id, min, max, dispersao, faces });
  }
  resultados.sort((a, b) => a.dispersao - b.dispersao);

  console.log("  convenção        face implícita (mín … máx)            dispersão");
  for (const r of resultados) {
    console.log(
      `  ${r.conv.padEnd(16)} ${r.min.toFixed(2).padStart(14)} … ${r.max.toFixed(2).padStart(14)}   ${(r.dispersao * 100).toFixed(4).padStart(10)}%`
    );
  }

  const vencedora = resultados[0];
  const arredondada = Math.round(vencedora.min / 1000) * 1000;
  const fechou = vencedora.dispersao < 1e-4;
  console.log(
    `\n  -> ${fechou ? "FECHA" : "NÃO FECHA"} em "${vencedora.conv}" com face ≈ ${arredondada.toLocaleString("pt-BR")}` +
      ` (dispersão ${(vencedora.dispersao * 100).toFixed(4)}%, limite 0,0100%)`
  );
  if (!fechou) console.log("     nenhuma candidata reproduz o ajuste — a convenção é outra, ou falta um fator");

  // Vértice a vértice na vencedora: a tabela que permite ver ONDE abre, se
  // abrir. Uma dispersão média esconde um vencimento fora da curva.
  console.log("\n  ticker      venc          du    corr        taxa          ajuste      face implícita");
  for (let k = 0; k < lista.length; k++) {
    const x = lista[k];
    console.log(
      `  ${x.ticker.padEnd(10)} ${x.venc}  ${String(diasUteis(DATA, x.venc)).padStart(5)} ${String(diasCorridos(DATA, x.venc)).padStart(6)} ` +
        `${String(x.taxa).padStart(10)} ${x.pu.toFixed(2).padStart(15)} ${vencedora.faces[k].toFixed(2).padStart(17)}`
    );
  }
}

testar("DI1", "CONTROLE: DI1, resposta conhecida (exp du/252, face 100.000)");
testar("DAP", "DAP — cupom de IPCA");

process.exit(0);
