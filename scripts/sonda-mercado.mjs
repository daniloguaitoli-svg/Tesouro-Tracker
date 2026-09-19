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
import { INDICES, JUROS_DIARIOS, INFLACAO, macroPorId } from "../server/catalogo.js";
import * as globais from "../server/providers/globais.js";
import { urlSerie, interpretarCorpoSgs } from "../server/providers/bcb.js";
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

// Leitura CRUA, pelo MESMO endereço que o app usa — urlSerie(), de bcb.js.
// Antes esta sonda batia em `/dados/ultimos/3`, que é outro endpoint do SGS e
// responde coisa diferente: em 15/09/2026 deu 09/09 como último dia da série
// 4389 enquanto o app, pelo intervalo de datas, lia até 11/09. Duas leituras
// discordando na mesma execução dão trabalho de investigar à toa — e a sonda
// estava abonando um caminho que o app não percorre.
//
// Guarda o último dia de cada série para comparar adiante com a leitura pelo
// bcb.serie. As duas têm de concordar.
const SERIES_SGS = [...Object.values(macroPorId), ...JUROS_DIARIOS];
const ultimoDiaCru = new Map();

console.log("\n=== séries do SGS, leitura crua (mesma URL do app) ===");
for (const j of SERIES_SGS) {
  const dias = j.id === "ipca" ? 2000 : 800;
  try {
    const r = await fetch(urlSerie(j.serie, { dias }));
    const texto = r.ok ? await r.text() : "";
    const lido = r.ok ? interpretarCorpoSgs(texto, j.serie) : { ok: false };
    const ult = lido.ok ? lido.pontos[lido.pontos.length - 1] : null;
    if (ult) ultimoDiaCru.set(j.serie, ult.date);
    console.log(
      `  ${marcar(r.ok && lido.ok && lido.pontos.length > 0)} série ${String(j.serie).padStart(5)}  ` +
        `${(j.nome || j.id).padEnd(12)} HTTP ${r.status}  ${String(lido.pontos?.length ?? 0).padStart(4)} pts  ` +
        `último ${ult ? `${ult.date} = ${ult.close}` : "—"}`
    );
  } catch (e) {
    console.log(`  ${marcar(false)} série ${String(j.serie).padStart(5)}  ${e.message}`);
  }
  await new Promise((r) => setTimeout(r, 300));
}

console.log("\n=== fontes de inflação (FRED e ECB Data Portal) ===");
// Identificador de série errado NÃO dá erro visível: o FRED devolve um CSV de
// uma linha e o BCE um 404, o allSettled engole, e a linha some da tela. Este é
// o único lugar com rede aberta para os dois hosts.
for (const m of INFLACAO.filter((x) => x.fred || x.ecb)) {
  const url = m.fred
    ? `https://fred.stlouisfed.org/graph/fredgraph.csv?id=${m.fred}&cosd=2023-01-01`
    : `https://data-api.ecb.europa.eu/service/data/ICP/${m.ecb}?format=csvdata&startPeriod=2023-01`;
  try {
    const r = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
    const txt = r.ok ? await r.text() : "";
    const linhas = txt.trim() ? txt.trim().split(/\r?\n/).length - 1 : 0;
    console.log(`  ${marcar(r.ok && linhas > 12)} ${m.id.padEnd(9)} ${(m.fred || m.ecb).padEnd(22)} HTTP ${r.status}  ${linhas} linhas`);
    if (!r.ok || linhas <= 12) console.log(`      amostra: ${txt.slice(0, 140).replace(/\s+/g, " ")}`);
  } catch (e) {
    console.log(`  ${marcar(false)} ${m.id.padEnd(9)} ${(m.fred || m.ecb).padEnd(22)} ${e.message}`);
  }
  await new Promise((r) => setTimeout(r, 400));
}

// Fica UMA verificação do que ficou decidido: as três linhas europeias vêm do
// espelho do Eurostat no FRED porque o ECB Data Portal e a API do próprio
// Eurostat param em 2025-12. Se o espelho parar também, isto avisa antes de a
// tela envelhecer calada. O histórico da investigação está no catálogo.
// A coleta de 14/09 logou "globais FALHA fed: HTTP 404 — mantido o valor
// anterior". O keep-previous segurou, entao nada quebrou — mas a taxa do Fed
// parou de atualizar calada. Como o CPI americano e o HICP vem do MESMO
// fredgraph.csv e respondem, o problema e do identificador, nao do endpoint.
// Sonda os dois atuais e candidatos de substituicao.
console.log("\n=== Fed no FRED: qual serie responde? ===");
for (const id of ["DFEDTARU", "DFEDTARL", "DFEDTAR", "FEDFUNDS", "EFFR", "DFF"]) {
  try {
    const r = await fetch(`https://fred.stlouisfed.org/graph/fredgraph.csv?id=${id}&cosd=2025-01-01`, {
      headers: { "User-Agent": "Mozilla/5.0" },
    });
    const txt = await r.text();
    const res = globais.parseCsvFred(txt);
    const ult = res.pontos[res.pontos.length - 1];
    console.log(
      `  ${marcar(r.ok && res.pontos.length > 0)} ${id.padEnd(9)} HTTP ${r.status}  ${String(res.pontos.length).padStart(4)} pts  ` +
        `ultimo ${ult ? `${ult.date} = ${ult.close}` : "—"}`
    );
    if (!r.ok || !res.pontos.length) console.log(`      amostra: ${txt.slice(0, 120).replace(/\s+/g, " ")}`);
  } catch (e) {
    console.log(`  ${marcar(false)} ${id.padEnd(9)} ${e.message}`);
  }
  await new Promise((r) => setTimeout(r, 400));
}

console.log("\n=== HICP europeu: o espelho do FRED continua à frente do BCE? ===");
{
  const ecb = await fetch(
    "https://data-api.ecb.europa.eu/service/data/ICP/M.U2.N.000000.4.INX?format=csvdata&lastNObservations=1",
    { headers: { "User-Agent": "Mozilla/5.0" } }
  ).then((r) => (r.ok ? r.text() : "")).catch(() => "");
  const ultimoEcb = (ecb.match(/\d{4}-\d{2}(-\d{2})?/g) || []).sort().pop() || "?";
  const fred = globais.parseCsvFred(
    await fetch("https://fred.stlouisfed.org/graph/fredgraph.csv?id=CP0000EZ19M086NEST&cosd=2025-01-01", {
      headers: { "User-Agent": "Mozilla/5.0" },
    }).then((r) => r.text()).catch(() => "")
  );
  const ultimoFred = fred.pontos[fred.pontos.length - 1]?.date.slice(0, 7) || "?";
  console.log(`  BCE  último ${ultimoEcb}`);
  console.log(`  FRED último ${ultimoFred}`);
  console.log(`  ${marcar(ultimoFred > ultimoEcb.slice(0, 7))} o espelho do FRED está à frente — é por isso que a fonte é ele`);
}

console.log("\n=== as séries como o app as lê (pelo mesmo bcb.serie) ===");
{
  const bcb = await import("../server/providers/bcb.js");
  for (const m of [...Object.values(macroPorId), ...JUROS_DIARIOS]) {
    try {
      const pts = await bcb.serie(m.serie, { dias: m.id === "ipca" ? 2000 : 800 });
      const p0 = pts[0], pN = pts[pts.length - 1];
      const dias = p0 && pN ? Math.round((Date.parse(pN.date) - Date.parse(p0.date)) / 864e5) : 0;
      // As duas leituras da MESMA série pela MESMA URL têm de terminar no
      // mesmo dia. Divergência aqui é cache servindo dado velho ou o parser
      // perdendo ponto — as duas coisas que sumiriam da tela sem erro.
      const cru = ultimoDiaCru.get(m.serie);
      const bate = !cru || cru === pN?.date;
      console.log(
        `  ${marcar(pts.length > 0 && bate)} ${String(m.serie).padStart(5)} ${(m.nome || m.id).padEnd(12)} ` +
          `${String(pts.length).padStart(5)} pontos  ${p0?.date} -> ${pN?.date}  (${dias} dias de janela)` +
          (bate ? "" : `  DIVERGE da leitura crua (${cru})`)
      );
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
  const cols = g.colunas.map((c) => c.id);
  console.log(`\n  [${g.nome}]`);
  console.log(
    `  ${"indicador".padEnd(18)}${g.comValor ? "último".padStart(13) : ""} ` +
      g.colunas.map((c) => c.rotulo.padStart(9)).join("") + "   base"
  );
  for (const l of g.linhas) {
    const c = (j) => (j && Number.isFinite(j.pct) ? j.pct.toFixed(2) + "%" : "—").padStart(9);
    const quando = l.mesReferencia ? `ref. ${l.mesReferencia}` : l.data;
    console.log(
      `  ${l.nome.padEnd(18)}${g.comValor ? String(l.valor ?? "—").padStart(13) : ""} ` +
        cols.map((k) => c(l[k])).join("") + `   ${l.base}  (${quando})`
    );
    // Janela vazia CONTA como problema. A primeira versão desta sonda imprimia
    // o aviso e saía com "sonda limpa" — foi assim que quatro janelas nulas no
    // câmbio quase passaram por boas.
    for (const k of cols) {
      if (!l[k]) { console.log(`      ${marcar(false)} ${l.id}.${k} veio null — série curta ou fonte incompleta`); }
    }
    // Mês de referência velho CONTA como problema. Na primeira sonda com
    // inflação, as três linhas de HICP vieram de dezembro — oito meses atrás —
    // e a sonda disse "limpa", porque só olhava janela nula. Um índice mensal
    // atrasa uma ou duas publicações; três meses já é outra coisa.
    if (l.mesReferencia) {
      const [ay, am] = l.mesReferencia.split("-").map(Number);
      const hoje = new Date();
      const meses = (hoje.getUTCFullYear() - ay) * 12 + (hoje.getUTCMonth() + 1 - am);
      // Reprova só se PIORAR além do atraso já medido e registrado no catálogo.
      // O HICP europeu está nove meses atrás por decisão de quem publica, não
      // por defeito daqui; deixar a sonda vermelha para sempre por isso mataria
      // o sinal dela. Se a publicação voltar, o número cai e nada precisa ser
      // mexido; se atrasar mais, aparece.
      const limite = INFLACAO.find((x) => x.id === l.id)?.atrasoConhecidoMeses ?? 3;
      if (meses > limite) {
        console.log(`      ${marcar(false)} ${l.id}: referência ${l.mesReferencia} está ${meses} meses atrás (limite ${limite})`);
      } else if (meses > 3) {
        console.log(`      aviso  ${l.id}: ${meses} meses atrás — atraso conhecido da fonte, dentro do registrado`);
      }
    }
  }
}
// A identidade que a grade promete ao leitor: dividir as duas primeiras linhas
// do câmbio dá a terceira. Com fixture isso já é conferido no verificar; aqui a
// pergunta é outra e só a rede responde — se as três linhas estão no MESMO dia.
// Um feriado de um lado só, ou uma perna atualizando antes da outra, não quebra
// nada visível: a conta continua fechando dentro da linha, mas com a data de
// ontem ao lado de duas de hoje.
{
  const porId = Object.fromEntries((m.grupos.find((g) => g.id === "cambio")?.linhas || []).map((l) => [l.id, l]));
  const { usdbrl, eurbrl, usdeur } = porId;
  if (usdbrl?.valor && eurbrl?.valor && usdeur?.valor) {
    const esperado = usdbrl.valor / eurbrl.valor;
    const erro = Math.abs(esperado - usdeur.valor);
    const mesmoDia = usdbrl.data === eurbrl.data && eurbrl.data === usdeur.data;
    console.log(
      `\n  ${marcar(erro < 5e-4)} USD/EUR fecha com as duas pernas: ${usdbrl.valor} / ${eurbrl.valor} = ` +
        `${esperado.toFixed(4)} contra ${usdeur.valor} na tela`
    );
    if (erro >= 5e-4) falhas++;
    console.log(
      `  ${mesmoDia ? "ok   " : "aviso"} datas das três linhas: ${usdbrl.data}, ${eurbrl.data}, ${usdeur.data}` +
        (mesmoDia ? "" : "  — a cruzada anda no último dia em que as duas pernas existem")
    );
  } else {
    console.log(`\n  ${marcar(false)} USD/EUR: alguma perna do cruzamento veio vazia`);
    falhas++;
  }
}

if (m.indisponiveis.length) { console.log(`\n  indisponíveis: ${m.indisponiveis.join(", ")}`); falhas += m.indisponiveis.length; }

console.log(`\n${falhas === 0 ? "sonda limpa" : `${falhas} problema(s)`}`);
process.exit(falhas === 0 ? 0 : 1);
