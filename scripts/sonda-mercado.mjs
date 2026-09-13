// scripts/sonda-mercado.mjs — sonda as fontes da aba Mercado num runner.
//
// POR QUE EXISTE: o Yahoo e o SGS do Banco Central não respondem do ambiente de
// desenvolvimento (a rede de saída recusa os dois hosts). Um símbolo errado não
// dá erro visível — o Yahoo devolve 404, o allSettled engole, e a linha some da
// tela sem explicação. Este script é o único lugar onde dá para provar que os
// cinco símbolos e as duas séries diárias respondem de verdade.
//
// Roda sob workflow_dispatch, não no schedule: é ferramenta de conferência, não
// parte da coleta. Não escreve nada.
import { INDICES, JUROS_DIARIOS, macroPorId } from "../server/catalogo.js";
import { getMercado } from "../server/datalayer.js";

const ok = (b) => (b ? "ok  " : "FALHA");
let falhas = 0;
const marcar = (bom) => { if (!bom) falhas += 1; return ok(bom); };

console.log("=== símbolos do Yahoo ===");
for (const i of INDICES) {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(i.simbolo)}?range=5d&interval=1d`;
  try {
    const r = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
    const j = r.ok ? await r.json() : null;
    const res = j?.chart?.result?.[0];
    const n = res?.timestamp?.length ?? 0;
    const ultimo = res?.indicators?.quote?.[0]?.close?.filter((x) => x != null).pop();
    console.log(`  ${marcar(r.ok && n > 0)} ${i.id.padEnd(9)} ${i.simbolo.padEnd(7)} HTTP ${r.status}  ${n} pontos  último ${ultimo ?? "—"}  moeda ${res?.meta?.currency ?? "?"}`);
  } catch (e) {
    console.log(`  ${marcar(false)} ${i.id.padEnd(9)} ${i.simbolo.padEnd(7)} ${e.message}`);
  }
  await new Promise((r) => setTimeout(r, 400));
}

console.log("\n=== séries do SGS (nível anualizado e taxa diária) ===");
for (const j of [...Object.values(macroPorId), ...JUROS_DIARIOS.map((x) => ({ ...x, serie: x.serie }))]) {
  const url = `https://api.bcb.gov.br/dados/serie/bcdata.sgs.${j.serie}/dados/ultimos/3?formato=json`;
  try {
    const r = await fetch(url);
    const dados = r.ok ? await r.json() : [];
    const ult = dados[dados.length - 1];
    console.log(`  ${marcar(r.ok && dados.length > 0)} série ${String(j.serie).padStart(5)}  ${(j.nome || j.id).padEnd(12)} HTTP ${r.status}  último ${ult?.data ?? "—"} = ${ult?.valor ?? "—"}`);
  } catch (e) {
    console.log(`  ${marcar(false)} série ${String(j.serie).padStart(5)}  ${e.message}`);
  }
  await new Promise((r) => setTimeout(r, 300));
}

console.log("\n=== as séries como o app as lê (pelo mesmo bcb.serie) ===");
{
  const bcb = await import("../server/providers/bcb.js");
  for (const m of [...Object.values(macroPorId), ...JUROS_DIARIOS]) {
    try {
      const pts = await bcb.serie(m.serie, { dias: m.id === "ipca" ? 2000 : 800 });
      const p0 = pts[0], pN = pts[pts.length - 1];
      const dias = p0 && pN ? Math.round((Date.parse(pN.date) - Date.parse(p0.date)) / 864e5) : 0;
      console.log(`  ${marcar(pts.length > 0)} ${String(m.serie).padStart(5)} ${(m.nome || m.id).padEnd(12)} ${String(pts.length).padStart(5)} pontos  ${p0?.date} -> ${pN?.date}  (${dias} dias de janela)`);
      if (dias < 370 && m.id !== "ipca") console.log(`      AVISO: menos de 370 dias — a janela de 12 meses vai sair null`);
    } catch (e) {
      console.log(`  ${marcar(false)} ${String(m.serie).padStart(5)} ${(m.nome || m.id).padEnd(12)} ${e.message}`);
    }
    await new Promise((r) => setTimeout(r, 500));
  }
}

console.log("\n=== a grade como a tela vai receber ===");
const m = await getMercado();
for (const g of m.grupos) {
  console.log(`\n  [${g.nome}]`);
  console.log(`  ${"indicador".padEnd(18)} ${"último".padStart(12)} ${"1d".padStart(8)} ${"1sem".padStart(8)} ${"1mês".padStart(8)} ${"ano".padStart(8)} ${"12m".padStart(8)}   base`);
  for (const l of g.linhas) {
    const c = (j) => (j && Number.isFinite(j.pct) ? j.pct.toFixed(2) + "%" : "—").padStart(8);
    console.log(`  ${l.nome.padEnd(18)} ${String(l.valor ?? "—").padStart(12)} ${c(l.var1d)} ${c(l.var1sem)} ${c(l.var1mes)} ${c(l.varAno)} ${c(l.var12m)}   ${l.base}  (${l.data})`);
    // Janela vazia CONTA como problema. A primeira versão desta sonda imprimia
    // o aviso e saía com "sonda limpa" — foi assim que quatro janelas nulas no
    // câmbio quase passaram por boas.
    for (const k of ["var1d", "var1sem", "var1mes", "varAno", "var12m"]) {
      if (!l[k]) { console.log(`      ${marcar(false)} ${l.id}.${k} veio null — série curta ou fonte incompleta`); }
    }
  }
}
if (m.indisponiveis.length) { console.log(`\n  indisponíveis: ${m.indisponiveis.join(", ")}`); falhas += m.indisponiveis.length; }

console.log(`\n${falhas === 0 ? "sonda limpa" : `${falhas} problema(s)`}`);
process.exit(falhas === 0 ? 0 : 1);
