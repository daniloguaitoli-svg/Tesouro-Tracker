// server/providers/tesouro.js — a série oficial do Tesouro Direto.
//
// FONTE: Tesouro Transparente (CKAN) publica "Taxas dos Títulos Ofertados pelo
// Tesouro Direto" num único CSV com o histórico inteiro desde 2002 — preço (PU)
// e taxa de compra e de venda, por título e por dia. É a série oficial e
// gratuita, sem chave.
//
// POR QUE ISTO SÓ RODA NO COLETOR: o arquivo tem dezenas de MB e cresce todo
// dia. Baixar e varrer isso dentro de uma função serverless a cada request seria
// lento e caro. Então quem lê o CSV é o job agendado do GitHub Actions
// (.github/scripts/coletar-tesouro.mjs), que destila o resultado em
// dados/historico.json + dados/ntnb.json. Em produção o app lê SÓ esses
// arquivos versionados (server/cache.js).
//
// O parsing é DELIBERADAMENTE TOLERANTE, como o importador de CSV do
// ETF_Tracker: o separador é detectado, e as colunas são achadas por regex no
// cabeçalho em vez de por posição. Se o Tesouro reordenar ou renomear levemente
// uma coluna, continua funcionando; se sumir uma coluna essencial, falha alto
// com o cabeçalho que veio, em vez de ler número errado calado.
//
// SOBRE "COMPRA" vs "VENDA": os nomes seguem o rótulo do próprio arquivo e são
// do ponto de vista do TESOURO. "Venda" é o Tesouro vendendo para o investidor
// (a taxa e o PU de quem COMPRA o título); "compra" é a recompra antecipada (o
// que o investidor recebe ao vender de volta). Títulos que saíram de oferta
// costumam ficar sem os campos de venda e manter só os de compra — por isso a
// taxa de referência do app é a de compra, com a de venda ao lado. Os dois vêm
// preservados com o nome de origem, para quem consumir o JSON decidir.

import { parseNumBR, isoDeBR, classificarTitulo, normalizar, slugDe } from "../util.js";

export const URL_CSV =
  "https://www.tesourotransparente.gov.br/ckan/dataset/df56aa42-484a-4a59-8184-7676580c81e3/resource/796d2059-14e9-44e3-80c9-2d9e30b405c1/download/precotaxatesourodireto.csv";

const CABECALHOS = {
  tipo: /tipo.*titulo/,
  vencimento: /(data|dt).*vencimento/,
  data: /(data|dt).*base/,
  taxaCompra: /taxa.*compra/,
  taxaVenda: /taxa.*venda/,
  puCompra: /pu.*compra/,
  puVenda: /pu.*venda/,
  puBase: /pu.*base/,
};

// Colunas sem as quais não dá para montar um ponto da série.
const ESSENCIAIS = ["tipo", "vencimento", "data"];

function detectarSeparador(linha) {
  const cand = [";", "\t", ","];
  let melhor = ";";
  let max = -1;
  for (const c of cand) {
    const n = linha.split(c).length;
    if (n > max) {
      max = n;
      melhor = c;
    }
  }
  return melhor;
}

// Mapeia nome-de-coluna -> índice, por regex sobre o cabeçalho normalizado.
export function mapearColunas(linhaCabecalho, sep) {
  const cabecalhos = linhaCabecalho.split(sep).map((h) => normalizar(h.replace(/^"|"$/g, "")));
  const idx = {};
  for (const [campo, re] of Object.entries(CABECALHOS)) {
    const i = cabecalhos.findIndex((h) => re.test(h));
    if (i >= 0) idx[campo] = i;
  }
  const faltando = ESSENCIAIS.filter((c) => idx[c] == null);
  if (faltando.length) {
    throw new Error(
      `CSV do Tesouro com cabeçalho inesperado — não achei ${faltando.join(", ")}. Veio: ${cabecalhos.join(" | ")}`
    );
  }
  return idx;
}

// Converte uma linha já separada num ponto normalizado, ou null se não for
// IPCA+ / estiver fora da janela pedida.
export function linhaParaPonto(cels, idx, desdeISO) {
  const classe = classificarTitulo(cels[idx.tipo]);
  if (!classe) return null;

  const vencimento = isoDeBR(cels[idx.vencimento]);
  const data = isoDeBR(cels[idx.data]);
  if (!vencimento || !data) return null;
  if (desdeISO && data < desdeISO) return null;

  const n = (campo) => (idx[campo] == null ? null : parseNumBR(cels[idx[campo]]));
  // Um PU zerado (ou negativo) não é preço: é campo vazio do arquivo. Aparece
  // em títulos já vencidos e viraria "R$ 0,00" na tela se passasse adiante.
  const pu = (campo) => {
    const v = n(campo);
    return v != null && v > 0 ? v : null;
  };

  return {
    slug: slugDe(classe.tipo, vencimento),
    tipo: classe.tipo,
    comCupom: classe.comCupom,
    cupomAnual: classe.cupomAnual ?? null,
    vencimento,
    data,
    // Taxas em % ao ano (ex.: 7,05 -> 7.05). PU em reais.
    taxaCompra: n("taxaCompra"),
    taxaVenda: n("taxaVenda"),
    puCompra: pu("puCompra"),
    puVenda: pu("puVenda"),
    puBase: pu("puBase"),
  };
}

// Varre o CSV em streaming, chamando aoLer(ponto) para cada ponto IPCA+ dentro
// da janela. Nunca carrega o arquivo inteiro na memória.
export async function varrerSerie({ desdeISO = null, aoLer, sinal } = {}) {
  const r = await fetch(URL_CSV, {
    headers: { Accept: "text/csv,text/plain,*/*", "User-Agent": "tesouro-tracker (github actions)" },
    signal: sinal,
  });
  if (!r.ok) throw new Error(`Tesouro Transparente indisponível (HTTP ${r.status})`);
  if (!r.body) throw new Error("Tesouro Transparente devolveu resposta sem corpo");

  const leitor = r.body.getReader();
  const decodificador = new TextDecoder("utf-8");
  let resto = "";
  let sep = null;
  let idx = null;
  let bytes = 0;
  let linhas = 0;
  let pontos = 0;

  const processar = (linhaBruta) => {
    const linha = linhaBruta.replace(/^\uFEFF/, "");
    if (!linha.trim()) return;
    if (!idx) {
      sep = detectarSeparador(linha);
      idx = mapearColunas(linha, sep);
      return;
    }
    linhas++;
    // Atalho barato: descarta pela string crua o que o classificador vai
    // recusar de qualquer jeito (RendA+, Educa+, lixo de formatação), sem
    // fatiar a linha. Cobre todas as famílias rastreadas.
    if (!/ipca|prefixado|tesouro selic|ntn-?[bf]|\bltn\b|\blft\b/i.test(linha)) return;
    const ponto = linhaParaPonto(linha.split(sep), idx, desdeISO);
    if (!ponto) return;
    pontos++;
    aoLer(ponto);
  };

  for (;;) {
    const { done, value } = await leitor.read();
    if (done) break;
    bytes += value.byteLength;
    resto += decodificador.decode(value, { stream: true });
    const partes = resto.split(/\r?\n/);
    resto = partes.pop() ?? "";
    for (const p of partes) processar(p);
  }
  resto += decodificador.decode();
  for (const p of resto.split(/\r?\n/)) processar(p);

  return { bytes, linhas, pontos, colunas: idx, separador: sep };
}
