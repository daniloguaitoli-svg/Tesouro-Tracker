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
import { montarTitulos, montarPonte, montarHistorico, markdownDaPonte, filtrarFamilias, arred } from "../../server/ponte.js";
import { lerGlobais } from "../../server/providers/globais.js";
import { REGIOES, manchetes } from "../../server/providers/noticias.js";
import { ibovespa } from "../../server/providers/yahoo.js";
import { variacaoPeriodo } from "../../server/util.js";

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
      alvo = { tipo: p.tipo, vencimento: p.vencimento, comCupom: p.comCupom, cupomAnual: p.cupomAnual, serie: {}, ultimo: null };
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
    `${resumo.pontos.toLocaleString("pt-BR")} pontos (todas as famílias) desde ${DESDE}`
);
console.log(`separador ${JSON.stringify(resumo.separador)} · colunas ${JSON.stringify(resumo.colunas)}`);

if (series.size === 0) {
  console.error("\nNenhum título reconhecido — o formato do arquivo pode ter mudado.");
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

console.log(`\n${titulos.length} vencimentos vivos no arquivo (todas as famílias):`);
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

// ---------- 3b. Fed e BCE (dados/global.json) ----------
//
// Política monetária muda ~8 vezes por ano; duas leituras diárias sobram. O
// resultado fica versionado, e cada fonte que falhar mantém o valor anterior
// do arquivo — o mesmo contrato do cache do CEPEA no Cana-Tracker.

const ARQ_GLOBAL = join(DIR, "global.json");
let globalAnterior = { atualizadoEm: null, fed: null, bce: null };
try {
  globalAnterior = JSON.parse(await readFile(ARQ_GLOBAL, "utf-8"));
} catch {
  /* primeira execução */
}
const lidos = await lerGlobais();
const globalNovo = {
  atualizadoEm: new Date().toISOString(),
  fontes: {
    fed: "FRED / St. Louis Fed (fredgraph.csv, DFEDTARU + DFEDTARL)",
    bce: "ECB Data Portal (FM.B.U2.EUR.4F.KR.DFR/MRR_FR.LEV)",
  },
  nota: "vigenteDesde é a data em que a taxa nova passou a valer (derivada da série), não a data da reunião.",
  fed: lidos.fed ?? globalAnterior.fed ?? null,
  bce: lidos.bce ?? globalAnterior.bce ?? null,
};
if (lidos.fed) console.log(`\nFed: ${lidos.fed.limiteInferior}–${lidos.fed.limiteSuperior}% (vigente desde ${lidos.fed.vigenteDesde}, ${lidos.fed.variacaoPP > 0 ? "+" : ""}${lidos.fed.variacaoPP} p.p.)`);
if (lidos.bce) console.log(`BCE: depósito ${lidos.bce.deposito}% · refi ${lidos.bce.refi}% (vigente desde ${lidos.bce.vigenteDesde})`);
for (const e of lidos.erros) console.log(`globais FALHA ${e} — mantido o valor anterior`);

// ---------- 3b2. Sonda do Ibovespa (só log) ----------
//
// O Ibovespa é lido na hora do request (moldura do Painel), não aqui. Mas o
// runner é o único lugar com rede aberta onde dá para conferir que o endpoint
// de gráficos do Yahoo ainda responde no formato esperado — então a coleta
// sonda e loga. Falhar aqui não falha o job: a bolsa é contexto.
try {
  const ib = await ibovespa();
  console.log(`\nIbovespa: ${ib.valor.toLocaleString("pt-BR")} pts em ${ib.data} (${ib.changePct >= 0 ? "+" : ""}${ib.changePct.toFixed(2)}%)`);
} catch (e) {
  console.log(`\nIbovespa: FALHA ${e.message} — o cartão da moldura mostrará "—"`);
}

// ---------- 3c. Sonda das notícias (só log) ----------
//
// As manchetes são lidas na hora do request, não aqui — envelhecem rápido
// demais para versionar. Mas o runner é o único lugar com rede aberta onde dá
// para conferir que o parser de RSS ainda casa com o feed real, então a coleta
// SONDA e loga. Falha aqui não falha o job: manchete é contexto, não dado.

console.log("");
for (const regiao of REGIOES) {
  try {
    const itens = await manchetes(regiao);
    console.log(`notícias ${regiao.id}: ${itens.length} manchetes (ex.: "${itens[0].titulo.slice(0, 70)}")`);
  } catch (e) {
    console.log(`notícias ${regiao.id}: FALHA ${e.message} — a tela mostrará a região vazia`);
  }
}

// ---------- 4. Gravação ----------

const agora = new Date().toISOString();
const historico = montarHistorico({ ordenados, agora, urlCsv: URL_CSV, desde: DESDE });

// Um arquivo-ponte POR FAMÍLIA, e o formato do ntnb.json intocado: quem já
// consome a URL antiga não pode quebrar por causa de uma ampliação.
const soIpca = filtrarFamilias(titulos, ["ipca", "ipca-juros"]);
const soPrefixado = filtrarFamilias(titulos, ["prefixado", "prefixado-juros"]);
const soSelic = filtrarFamilias(titulos, ["selic"]);
const ponte = montarPonte({ titulos: soIpca, agora, urlCsv: URL_CSV, urlAnbima: secundario.ok ? secundario.url : null });
const pontePrefixado = montarPonte({
  titulos: soPrefixado,
  agora,
  urlCsv: URL_CSV,
  nota: "Taxas NOMINAIS (a.a., sem correção pela inflação) — não compare diretamente com as taxas reais do ntnb.json.",
});
const ponteSelic = montarPonte({
  titulos: soSelic,
  agora,
  urlCsv: URL_CSV,
  nota: "LFT é pós-fixada: `taxa` aqui é o ágio/deságio sobre a Selic (pode ser negativo), não uma taxa cheia; `duration` é null por construção.",
});
const md = markdownDaPonte({ titulos: soIpca, agora, comAnbima: secundario.ok });

if (seco) {
  console.log(`\n--dry-run: nada gravado.`);
  console.log(`historico.json teria ${Object.keys(historico.titulos).length} vencimentos`);
  console.log(`ntnb.json teria ${soIpca.length} · prefixado.json ${soPrefixado.length} · selic.json ${soSelic.length}`);
  console.log(`\n----- prévia de dados/ntnb.md -----\n${md.split("\n").slice(0, 14).join("\n")}`);
} else {
  await mkdir(DIR, { recursive: true });
  await writeFile(join(DIR, "historico.json"), JSON.stringify(historico, null, 1) + "\n", "utf-8");
  await writeFile(join(DIR, "ntnb.json"), JSON.stringify(ponte, null, 1) + "\n", "utf-8");
  await writeFile(join(DIR, "prefixado.json"), JSON.stringify(pontePrefixado, null, 1) + "\n", "utf-8");
  await writeFile(join(DIR, "selic.json"), JSON.stringify(ponteSelic, null, 1) + "\n", "utf-8");
  await writeFile(ARQ_GLOBAL, JSON.stringify(globalNovo, null, 1) + "\n", "utf-8");
  await writeFile(join(DIR, "ntnb.md"), md, "utf-8");
  console.log(`\ngravados dados/: historico, ntnb(.json/.md), prefixado, selic e global`);
}
