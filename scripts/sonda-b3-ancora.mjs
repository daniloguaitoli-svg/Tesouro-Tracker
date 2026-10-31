// scripts/sonda-b3-ancora.mjs — por que o bootstrap do cupom cambial abre.
//
// POR QUE EXISTE: em 30/10/2026 o portão do coletor recusou a gravação porque
// a identidade do FRC abriu 0,72% (limite 0,01%), e o vértice curto marcava
// -73,164% de cupom sujo. Em 23/10 a mesma identidade fechava em 0,0001% e o
// vértice marcava +29,032%. Entre as duas datas não mudou código nenhum: o
// que mudou foi a PROXIMIDADE DO VENCIMENTO -- o DDIX26 vence em 03/11.
//
// A pergunta é qual âncora o FRC está usando nos últimos dias antes do roll.
// Se o mercado já rolou para o segundo vencimento e o nosso código continua
// no primeiro, a identidade abre todo mês, por alguns dias, para sempre --
// e foi exatamente o que aconteceu: o arquivo parou em 28/10.
//
// TRÊS HIPÓTESES, MEDIDAS LADO A LADO, porque com uma só "fechou" não
// significaria nada. Não conserta nada: só diz qual conserto é o certo.
import { lerCsvB3, numeroB3, partesDoTicker } from "../server/providers/b3.js";
import { ehDiaUtil } from "../server/feriados.js";

const MS_DIA = 86400000;
const BASE = "https://arquivos.b3.com.br/api/download";

function diasUteisAtras(n) {
  let d = new Date(Date.now() - MS_DIA);
  while (n > 0) { if (ehDiaUtil(d)) n--; if (n > 0) d = new Date(d.getTime() - MS_DIA); }
  while (!ehDiaUtil(d)) d = new Date(d.getTime() - MS_DIA);
  return d.toISOString().slice(0, 10);
}

async function baixar(nome, data) {
  const r1 = await fetch(`${BASE}/requestname?fileName=${encodeURIComponent(nome)}&date=${data}&recaptchaToken=`, {
    headers: { Accept: "application/json", "User-Agent": "tesouro-tracker (sonda)" },
    signal: AbortSignal.timeout(60000),
  });
  if (!r1.ok) throw new Error(`passo 1 HTTP ${r1.status}`);
  const { token } = await r1.json();
  const r2 = await fetch(`${BASE}/?token=${encodeURIComponent(token)}`, {
    headers: { "User-Agent": "tesouro-tracker (sonda)" },
    signal: AbortSignal.timeout(60000),
  });
  if (!r2.ok) throw new Error(`passo 2 HTTP ${r2.status}`);
  return new TextDecoder("utf-8", { fatal: false }).decode(new Uint8Array(await r2.arrayBuffer()));
}

const dias = (a, b) => Math.round((Date.parse(b) - Date.parse(a)) / MS_DIA);

// Duas datas de propósito: a de hoje, em que o portão fechou, e 23/10, em que
// ele passou. Uma data só não distingue "o código está errado" de "esta data
// é especial".
for (const DATA of [diasUteisAtras(1), "2026-10-23"]) {
  console.log(`\n================ ${DATA} ================`);
  let neg, cad;
  try {
    neg = lerCsvB3(await baixar("TradeInformationConsolidatedFile", DATA));
    cad = lerCsvB3(await baixar("InstrumentsConsolidatedFile", DATA));
  } catch (e) {
    console.log(`  não veio: ${e.message}`);
    continue;
  }
  const iT = neg.idx("TckrSymb"), iTx = neg.idx("AdjstdQtTax"), iQ = neg.idx("FinInstrmQty");
  const taxas = new Map(), negociados = new Map();
  for (const l of neg.corpo) {
    if (!l) continue;
    const c = l.split(";");
    const t = c[iT];
    if (!t || !partesDoTicker(t)) continue;
    const v = numeroB3(c[iTx]);
    if (v != null) taxas.set(t, v);
    negociados.set(t, numeroB3(c[iQ]) || 0);
  }
  const cT = cad.idx("TckrSymb"), cV = cad.idx("XprtnDt");
  const venc = new Map();
  for (const l of cad.corpo) {
    if (!l) continue;
    const c = l.split(";");
    if (taxas.has(c[cT])) venc.set(c[cT], (c[cV] || "").slice(0, 10));
  }

  const porAtivo = (pref) =>
    [...taxas.keys()]
      .filter((t) => t.startsWith(pref) && venc.get(t) > DATA)
      .map((t) => ({ ticker: t, venc: venc.get(t), taxa: taxas.get(t), qtd: negociados.get(t) || 0 }))
      .sort((a, b) => a.venc.localeCompare(b.venc));

  const ddi = porAtivo("DDI"), frc = porAtivo("FRC");
  console.log(`  DDI curtos: ${ddi.slice(0, 3).map((d) => `${d.ticker} ${d.venc} ${d.taxa}% (${dias(DATA, d.venc)}d, ${d.qtd} contratos)`).join(" | ")}`);

  // A identidade, com a âncora que cada hipótese escolhe.
  const testar = (ancora, rotulo) => {
    if (!ancora) return console.log(`  ${rotulo.padEnd(34)} sem âncora`);
    const nC = dias(DATA, ancora.venc);
    let pior = 0, n = 0;
    for (const f of frc) {
      const d = ddi.find((x) => x.venc === f.venc);
      if (!d || f.venc <= ancora.venc) continue;
      const nL = dias(DATA, d.venc);
      const esq = 1 + (d.taxa / 100) * (nL / 360);
      const dir = (1 + (ancora.taxa / 100) * (nC / 360)) * (1 + (f.taxa / 100) * (dias(ancora.venc, f.venc) / 360));
      const e = Math.abs(dir / esq - 1);
      if (e > pior) pior = e;
      n++;
    }
    console.log(`  ${rotulo.padEnd(34)} pior erro ${(pior * 100).toFixed(4).padStart(9)}% em ${n} vencimentos` + (pior <= 1e-4 ? "   <-- FECHA" : ""));
  };

  testar(ddi[0], "H1: âncora = 1º DDI (código atual)");
  testar(ddi[1], "H2: âncora = 2º DDI (mercado rolou?)");
  const liquido = ddi.find((d) => d.qtd > 0) || null;
  testar(liquido, `H3: âncora = 1º DDI NEGOCIADO (${liquido?.ticker || "nenhum"})`);
}
