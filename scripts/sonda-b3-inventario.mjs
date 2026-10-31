// scripts/sonda-b3-inventario.mjs — o que mais existe no arquivo da B3.
//
// POR QUE EXISTE: as rodadas 1 a 4 da sonda irmã foram atrás de DI1, FRC e
// DDI, que já estão no ar. Elas contaram os outros ativos só por SEGMENTO
// ("EQUITY CALL: 34.904"), o que diz o tamanho e não diz o que são. Esta
// rodada responde a pergunta que ficou: quais contratos existem, o que a B3
// diz que cada um é, quais trazem taxa, quais trazem preço de ajuste, e
// quais têm vencimento — que é o que decide se dá para montar curva.
//
// A DESCRIÇÃO VEM DO CADASTRO, NÃO DA MINHA MEMÓRIA. O arquivo de cadastro
// traz um campo de descrição por ativo, e é ele que nomeia cada sigla aqui.
// Deduzir "DAP = cupom de IPCA" de cabeça é exatamente o tipo de chute que
// este repositório não aceita em dado de mercado: a sigla certa com o
// significado errado produz número plausível e falso.
//
// RODA NO RUNNER: medido em 25/10 e de novo em 31/10/2026, arquivos.b3.com.br
// recusa conexão do ambiente de desenvolvimento (CONNECT 403 no proxy). Este
// é o único lugar com rede aberta para a B3.
//
// NÃO GRAVA NADA e não faz commit. É reconhecimento.
import { ehDiaUtil } from "../server/feriados.js";

const MS_DIA = 86400000;
const BASE = "https://arquivos.b3.com.br/api/download";
const LIMITE_MS = 60000;

// Siglas que valeria a pena existir PARA ESTE APP, conferidas uma a uma no
// fim. A lista é de PERGUNTAS, não de respostas: cada uma é reportada como
// presente ou ausente com o número ao lado, e o que a B3 chama de cada uma
// sai do cadastro. Nenhuma entra no app a partir daqui.
// Liquidez: onde a rodada 5 parou. Contrato com ajuste e sem negócio tem
// preço ARBITRADO pela bolsa, não preço de mercado -- e uma curva montada
// com esses vértices herda a arbitragem calada, parecendo dado. Estes são os
// focos cuja liquidez decide se vale seguir para a convenção.
const FOCOS = ["DAP", "DI1", "FRC", "DDI", "OC1"];

const PERGUNTAS = [
  ["DAP", "cupom de IPCA — seria a curva de juro REAL, a comparável com a NTN-B"],
  ["DI1", "já no ar: curva pré em BRL"],
  ["DDI", "já no ar: cupom cambial sujo"],
  ["FRC", "já no ar: cupom cambial limpo"],
  ["DOL", "dólar futuro cheio"],
  ["WDO", "dólar futuro mini"],
  ["IND", "Ibovespa futuro cheio"],
  ["WIN", "Ibovespa futuro mini"],
  ["OC1", "DI de um dia / overnight"],
  ["SCS", "swap cambial"],
  ["T10", "treasury / juro longo"],
  ["BGI", "boi gordo"],
  ["ICF", "café arábica"],
  ["CCM", "milho"],
  ["SJC", "soja"],
];

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
// Raiz do contrato: DI1F27 -> DI1. Um ticker que não siga ativo+mês+ano não é
// futuro (é ação, opção, fundo), e cai no balde "não é contrato futuro".
const raizDe = (t) => (t.match(/^([A-Z0-9]{3})[FGHJKMNQUVXZ]\d{2}$/) || [])[1] || null;

console.log(`sonda B3 rodada 5 — inventário dos ativos em ${DATA}\n`);

// ---------- negócios e ajustes ----------
let negocios;
try {
  negocios = abrirCsv(await baixar("TradeInformationConsolidatedFile"));
} catch (e) {
  // Fonte que não responde é tempo, não defeito: sai verde e alto, como as
  // outras sondas deste repositório.
  console.log(`TradeInformationConsolidated não veio: ${e.message}`);
  console.log("inconclusivo — nada a concluir sobre o inventário");
  process.exit(0);
}
console.log(`TradeInformationConsolidated: ${negocios.corpo.length} linhas, ${negocios.colunas.length} colunas`);

const iTicker = negocios.idx("TckrSymb");
const iSegm = negocios.idx("SgmtNm");
const iAjuste = negocios.idx("AdjstdQt");
const iTaxa = negocios.idx("AdjstdQtTax");
const iQtd = negocios.idx("TradQty");
const iNeg = negocios.idx("NtlFinVol");

const porRaiz = new Map();
const segmentos = new Map();
let naoFuturos = 0;

for (const linha of negocios.corpo) {
  if (!linha) continue;
  const c = linha.split(";");
  const ticker = c[iTicker];
  if (!ticker) continue;

  const seg = c[iSegm] || "(sem segmento)";
  segmentos.set(seg, (segmentos.get(seg) || 0) + 1);

  const raiz = raizDe(ticker);
  if (!raiz) {
    naoFuturos++;
    continue;
  }
  let r = porRaiz.get(raiz);
  if (!r) {
    r = { raiz, n: 0, comAjuste: 0, comTaxa: 0, volume: 0, segmento: seg, exemplo: ticker, tickers: [] };
    porRaiz.set(raiz, r);
  }
  r.n++;
  if (num(c[iAjuste]) != null) r.comAjuste++;
  if (num(c[iTaxa]) != null) r.comTaxa++;
  r.volume += num(iNeg >= 0 ? c[iNeg] : c[iQtd]) || 0;
  if (r.tickers.length < 3) r.tickers.push(ticker);
  if (FOCOS.includes(raiz)) (r.linhas ||= []).push(c);
}

// ---------- cadastro: o nome que a B3 dá a cada ativo ----------
// Sem isto o inventário é uma lista de siglas. O cadastro também é o que diz
// se há vencimento — e sem vencimento não há eixo x, logo não há curva.
let cadastro = null;
try {
  cadastro = abrirCsv(await baixar("InstrumentsConsolidatedFile"));
  console.log(`InstrumentsConsolidated:    ${cadastro.corpo.length} linhas, ${cadastro.colunas.length} colunas`);
} catch (e) {
  console.log(`InstrumentsConsolidated não veio: ${e.message} — segue só com os negócios`);
}

if (cadastro) {
  // Os nomes das colunas de descrição não estão confirmados, ao contrário de
  // TckrSymb e XprtnDt. Procura por vários e DIZ qual achou, em vez de fixar
  // um palpite e devolver vazio calado.
  const candidatos = ["AsstDesc", "SctyDesc", "CrpnNm", "SpcfctnCd", "AsstNm", "Asst", "SctyCtgyNm", "MktNm"];
  const achadas = candidatos.filter((n) => cadastro.idx(n) >= 0);
  console.log(`  colunas de descrição encontradas: ${achadas.join(", ") || "nenhuma"}`);
  console.log(`  cabeçalho completo: ${cadastro.colunas.join(" ")}\n`);

  const iT = cadastro.idx("TckrSymb");
  const iV = cadastro.idx("XprtnDt");
  // Posição em aberto. O cabeçalho do cadastro traz OpngFutrPosDay, que é a
  // posição em aberto na abertura do dia -- o número que diz se o contrato
  // tem gente dentro, e não só uma cotação publicada.
  const iAberto = cadastro.idx("OpngFutrPosDay");
  console.log(`  posição em aberto: ${iAberto >= 0 ? "OpngFutrPosDay" : "NÃO ENCONTRADA no cadastro"}`);
  globalThis.__aberto = new Map();
  const iDesc = achadas.map((n) => cadastro.idx(n));

  for (const linha of cadastro.corpo) {
    if (!linha) continue;
    const c = linha.split(";");
    const raiz = raizDe(c[iT] || "");
    const r = raiz && porRaiz.get(raiz);
    if (!r) continue;
    if (!r.descricao) {
      const partes = iDesc.map((i) => (c[i] || "").trim()).filter((x) => x && x !== c[iT]);
      if (partes.length) r.descricao = [...new Set(partes)].join(" · ");
    }
    if (iAberto >= 0) {
      const a = num(c[iAberto]);
      if (a != null) globalThis.__aberto.set(c[iT], a);
    }
    const venc = (c[iV] || "").slice(0, 10);
    if (/^\d{4}-\d{2}-\d{2}$/.test(venc)) {
      r.comVenc = (r.comVenc || 0) + 1;
      if (!r.vencMin || venc < r.vencMin) r.vencMin = venc;
      if (!r.vencMax || venc > r.vencMax) r.vencMax = venc;
    }
  }
}

// ---------- o inventário ----------
const linhas = [...porRaiz.values()].sort((a, b) => b.n - a.n);
console.log(`=== ${linhas.length} raízes de contrato futuro (${naoFuturos} linhas não são futuro: ação, opção, fundo) ===\n`);
console.log("  raiz  contratos  c/ajuste  c/taxa  c/venc  vencimentos           descrição");
for (const r of linhas.slice(0, 40)) {
  const faixa = r.vencMin ? `${r.vencMin} a ${r.vencMax}` : "—";
  console.log(
    `  ${r.raiz.padEnd(5)} ${String(r.n).padStart(8)} ${String(r.comAjuste).padStart(9)} ${String(r.comTaxa).padStart(7)} ` +
      `${String(r.comVenc || 0).padStart(7)}  ${faixa.padEnd(23)} ${(r.descricao || "(sem descrição no cadastro)").slice(0, 60)}`
  );
}
if (linhas.length > 40) console.log(`  ... e mais ${linhas.length - 40} raízes com menos contratos`);

// ---------- as perguntas ----------
// Presente ou ausente, com o número ao lado. Uma ausência é informação tão
// boa quanto uma presença: fecha a pergunta em vez de deixá-la em aberto.
console.log("\n=== as siglas que interessariam a este app ===");
for (const [raiz, porque] of PERGUNTAS) {
  const r = porRaiz.get(raiz);
  if (!r) {
    console.log(`  ${raiz}  AUSENTE neste arquivo — ${porque}`);
    continue;
  }
  const curva = r.comTaxa > 0 && (r.comVenc || 0) > 0 ? "DÁ CURVA (taxa + vencimento)" : r.comTaxa > 0 ? "tem taxa, sem vencimento" : "só preço, sem taxa";
  console.log(
    `  ${raiz}  ${String(r.n).padStart(4)} contratos · ${curva} · ${r.vencMin ? `${r.vencMin} a ${r.vencMax}` : "sem vencimento"}`
  );
  console.log(`        ${r.descricao || "(sem descrição)"} — ${porque}`);
  console.log(`        exemplos: ${r.tickers.join(", ")}`);
}

// ---------- liquidez, vértice a vértice ----------
// A pergunta que decide se a DAP vira curva neste app. Comparada contra o
// DI1 de propósito: "20 contratos negociados" não quer dizer nada sozinho,
// quer dizer tudo ao lado do que o contrato líquido do mesmo arquivo fez no
// mesmo dia.
console.log("\n=== liquidez: negociado no dia e posição em aberto ===");
console.log(`  colunas do arquivo de negócios: ${negocios.colunas.join(" ")}\n`);
const aberto = globalThis.__aberto || new Map();
for (const raiz of FOCOS) {
  const r = porRaiz.get(raiz);
  if (!r?.linhas) {
    console.log(`  ${raiz}: ausente`);
    continue;
  }
  const porTicker = r.linhas
    .map((c) => ({
      ticker: c[iTicker],
      qtd: num(iQtd >= 0 ? c[iQtd] : null) || 0,
      fin: num(iNeg >= 0 ? c[iNeg] : null) || 0,
      taxa: num(c[iTaxa]),
      emAberto: aberto.get(c[iTicker]) ?? null,
    }))
    .sort((a, b) => b.qtd - a.qtd);
  const negociaram = porTicker.filter((x) => x.qtd > 0).length;
  const comAberto = porTicker.filter((x) => (x.emAberto || 0) > 0).length;
  const totalQtd = porTicker.reduce((s, x) => s + x.qtd, 0);
  const totalAberto = porTicker.reduce((s, x) => s + (x.emAberto || 0), 0);
  console.log(
    `  ${raiz}: ${negociaram}/${porTicker.length} vértices negociaram · ${totalQtd.toLocaleString("pt-BR")} contratos no dia · ` +
      `${comAberto}/${porTicker.length} com posição em aberto · ${totalAberto.toLocaleString("pt-BR")} em aberto`
  );
  console.log("        ticker        negociado       em aberto      taxa");
  for (const x of porTicker.slice(0, 8)) {
    console.log(
      `        ${x.ticker.padEnd(10)} ${String(x.qtd).padStart(12)} ${String(x.emAberto ?? "—").padStart(15)} ${String(x.taxa ?? "—").padStart(9)}`
    );
  }
  const zerados = porTicker.filter((x) => x.qtd === 0).map((x) => x.ticker);
  if (zerados.length) console.log(`        sem negócio no dia (${zerados.length}): ${zerados.slice(0, 12).join(" ")}${zerados.length > 12 ? " ..." : ""}`);
}

console.log("\n=== segmentos (o arquivo inteiro, futuros e não-futuros) ===");
for (const [seg, n] of [...segmentos.entries()].sort((a, b) => b[1] - a[1])) {
  console.log(`  ${String(n).padStart(7)}  ${seg}`);
}

process.exit(0);
