// .github/scripts/coletar-tesouro.mjs — o coletor. É ele que constrói a ponte.
//
// POR QUE ISTO EXISTE (três motivos que se somam):
//
// 1. O CSV oficial do Tesouro Direto tem dezenas de MB e o histórico inteiro
//    desde 2002. Isso não se varre dentro de uma função serverless a cada
//    request; se varre uma vez por dia, num runner do GitHub, e se destila.
//
// 2. O resultado destilado fica VERSIONADO no repositório. Como o /tmp da
//    Vercel morre a cada cold start, o arquivo commitado é o único histórico
//    que sobrevive — e o commit ainda dispara um deploy novo, que é como o dado
//    chega ao ar.
//
// 3. E, porque o repositório é público, dados/ntnb.json e dados/ntnb.md ficam
//    legíveis por raw.githubusercontent.com SEM TOKEN. Esse é o ponto todo: um
//    assistente que não alcança tesourotransparente.gov.br (arquivo grande
//    demais, ou bloqueio de rede) alcança um JSON pequeno no raw do GitHub.
//
// Saídas:
//   dados/historico.json  série diária por vencimento — o que o app lê
//   dados/ntnb.json       retrato do dia, com duration — a ponte (máquina)
//   dados/ntnb.md         o mesmo retrato em tabela — a ponte (leitura humana)
//
// Uso:
//   node .github/scripts/coletar-tesouro.mjs             # coleta e grava
//   node .github/scripts/coletar-tesouro.mjs --dry-run   # coleta e só relata
//   TESOURO_DESDE=2015-01-01 node ... --dry-run             # janela maior

import { writeFile, mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { varrerSerie, URL_CSV } from "../../server/providers/tesouro.js";
import { getSecundario } from "../../server/providers/anbima.js";
import { porSlug, DESTAQUES } from "../../server/catalogo.js";
import { hojeISO } from "../../server/util.js";
import { montarTitulos, montarPonte, montarHistorico, markdownDaPonte, arred } from "../../server/ponte.js";

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const DIR = join(RAIZ, "dados");

// Data inicial FIXA (não uma janela deslizante): assim o arquivo só cresce no
// fim e o diff diário é de umas poucas linhas, em vez de reescrever tudo.
const DESDE = process.env.TESOURO_DESDE || "2019-01-01";
const seco = process.argv.includes("--dry-run");

console.log(`Coletando do Tesouro Transparente desde ${DESDE}${seco ? " (dry-run: nada será gravado)" : ""}`);
console.log(URL_CSV);

// ---------- 1. Varredura do CSV ----------

const series = new Map(); // slug -> { tipo, vencimento, comCupom, serie, ultimo }

const resumo = await varrerSerie({
  desdeISO: DESDE,
  aoLer(p) {
    let alvo = series.get(p.slug);
    if (!alvo) {
      alvo = { tipo: p.tipo, vencimento: p.vencimento, comCupom: p.comCupom, serie: {}, ultimo: null };
      series.set(p.slug, alvo);
    }
    // Referência do app: a taxa/PU de COMPRA (recompra do Tesouro), que é a que
    // continua sendo publicada mesmo depois que o título sai de oferta. Cai
    // para a de venda quando a de compra falta.
    const taxa = p.taxaCompra ?? p.taxaVenda;
    const pu = p.puCompra ?? p.puVenda ?? p.puBase;
    if (taxa == null && pu == null) return;
    alvo.serie[p.data] = [arred(taxa, 4), arred(pu, 2)];
    if (!alvo.ultimo || p.data > alvo.ultimo.data) alvo.ultimo = p;
  },
});

console.log(
  `\nlidas ${resumo.linhas.toLocaleString("pt-BR")} linhas (${(resumo.bytes / 1048576).toFixed(1)} MB), ` +
    `${resumo.pontos.toLocaleString("pt-BR")} pontos IPCA+ desde ${DESDE}`
);
console.log(`separador ${JSON.stringify(resumo.separador)} · colunas ${JSON.stringify(resumo.colunas)}`);

if (series.size === 0) {
  console.error("\nNenhum vencimento IPCA+ encontrado — o formato do arquivo pode ter mudado.");
  process.exit(1);
}

// ---------- 2. ANBIMA (enriquecimento, nunca requisito) ----------

let secundario = { ok: false, titulos: [] };
try {
  secundario = await getSecundario();
} catch (e) {
  secundario = { ok: false, erros: [`${e.name}: ${e.message}`], titulos: [] };
}
if (secundario.ok) {
  console.log(`\nANBIMA: ${secundario.titulos.length} NTN-B lidas de ${secundario.url}`);
} else {
  console.log(
    `\nANBIMA sem dados (esperado: o arquivo diário migrou para o ANBIMA Data; ` +
      `defina ANBIMA_MS_URL quando souber o endereço novo). O app funciona sem.`
  );
  console.log(`  ${(secundario.erros || []).slice(0, 3).join("\n  ")}`);
  // A amostra é o que permite confirmar o formato do arquivo numa execução só.
  if (secundario.amostra) console.log(`amostra do arquivo:\n${secundario.amostra}`);
}
const secPorSlug = Object.fromEntries((secundario.titulos || []).map((t) => [t.slug, t]));

// ---------- 3. Retrato do dia, com duration ----------
//
// A montagem em si mora em server/ponte.js — funções puras, exercitadas por
// scripts/verificar.mjs. Aqui só se junta o que veio da rede.

const hoje = hojeISO();
const ordenados = [...series.entries()].sort(([, a], [, b]) => (a.vencimento < b.vencimento ? -1 : 1));
const titulos = montarTitulos({ ordenados, secPorSlug, hoje });

const foraDoCatalogo = titulos.filter((t) => !porSlug[t.slug]);
const semDados = DESTAQUES.filter((d) => !series.has(d.slug));

console.log(`\n${titulos.length} vencimentos IPCA+ no arquivo:`);
for (const t of titulos) {
  const marca = t.destaque ? "*" : " ";
  console.log(
    `  ${marca} ${t.slug.padEnd(24)} ${String(t.taxa ?? "—").padStart(8)}%  PU ${String(t.pu ?? "—").padStart(10)}  ` +
      `dur ${String(t.duration.macaulayAnos ?? "—").padStart(6)}a  ±1pp ${String(t.duration.variacaoPrecoMais1pp ?? "—").padStart(6)}%  (${t.data})`
  );
}
if (foraDoCatalogo.length) {
  console.log(`\nfora do catálogo (aparecem com rótulo genérico — vale adicionar em server/catalogo.js):`);
  for (const t of foraDoCatalogo) console.log(`  ${t.slug}`);
}
if (semDados.length) {
  console.log(`\nem destaque no catálogo mas AUSENTES do arquivo (aparecerão como "—"):`);
  for (const d of semDados) console.log(`  ${d.slug}`);
}

// ---------- 4. Gravação ----------

const agora = new Date().toISOString();
const historico = montarHistorico({ ordenados, agora, urlCsv: URL_CSV, desde: DESDE });
const ponte = montarPonte({ titulos, agora, urlCsv: URL_CSV, urlAnbima: secundario.ok ? secundario.url : null });
const md = markdownDaPonte({ titulos, agora, comAnbima: secundario.ok });

if (seco) {
  console.log(`\n--dry-run: nada gravado.`);
  console.log(`historico.json teria ${Object.keys(historico.titulos).length} vencimentos`);
  console.log(`ntnb.json teria ${titulos.length} vencimentos`);
  console.log(`\n----- prévia de dados/ntnb.md -----\n${md.split("\n").slice(0, 14).join("\n")}`);
} else {
  await mkdir(DIR, { recursive: true });
  await writeFile(join(DIR, "historico.json"), JSON.stringify(historico, null, 1) + "\n", "utf-8");
  await writeFile(join(DIR, "ntnb.json"), JSON.stringify(ponte, null, 1) + "\n", "utf-8");
  await writeFile(join(DIR, "ntnb.md"), md, "utf-8");
  console.log(`\ngravados dados/historico.json, dados/ntnb.json e dados/ntnb.md`);
}
