// scripts/sonda-b3.mjs — reconhecimento das fontes da B3 (DI futuro e FRC).
//
// POR QUE EXISTE: os quatro hosts da B3 recusam conexão do ambiente de
// desenvolvimento, medido em 25/10/2026 — www2.bmf.com.br, arquivos.b3.com.br
// e www.b3.com.br devolveram todos código 000 (sem resposta). É a mesma
// barreira do Yahoo, do SGS e do Tesouro, e a mesma solução: um runner do
// GitHub é o único lugar com rede aberta para esses endereços.
//
// ESTA SONDA É DIFERENTE DAS OUTRAS DUAS, e vale dizer por quê. A
// sonda-tesouro e a sonda-mercado verificam fonte CONHECIDA: sabem o formato,
// e um desvio é defeito. Esta aqui ainda não sabe o formato — ela existe para
// DESCOBRIR qual endereço responde e com que corpo, porque não dá para
// escrever um parser contra um arquivo que nunca se viu. Daí duas escolhas que
// contrariam as irmãs:
//
//   - ela IMPRIME AMOSTRA do corpo, que é o produto dela;
//   - ela NÃO REPROVA em 404. Nas outras, 4xx é o servidor dizendo que algo
//     mudou de lugar, e isso é defeito. Aqui as URLs são palpite: um 404 é
//     resposta útil ("não é por aqui"), não falha.
//
// Quando o formato estiver conhecido e houver parser, ela vira sonda de
// regressão como as outras e ganha a fronteira de sempre.
//
// O QUE SE PROCURA, e por que dois caminhos:
//
//   TAXAS REFERENCIAIS (TxRef) — a B3 publica a estrutura a termo já pronta e
//   interpolada, por dias corridos. É a curva que o mercado cita.
//
//   AJUSTES DO PREGÃO — preço de ajuste contrato a contrato. Dá os vértices
//   REALMENTE negociados, sem interpolação, que é como este app já desenha a
//   curva dos títulos.
//
// O plano aprovado usa os dois: a linha das Taxas Referenciais com os
// vencimentos negociados marcados em cima, para a tela distinguir onde há
// liquidez de onde há interpolação.

import { ehDiaUtil } from "../server/feriados.js";

const MS_DIA = 86400000;

// Último dia útil ANTERIOR a hoje. O ajuste do pregão só sai depois do
// fechamento, então pedir o dia corrente devolve página vazia na maior parte
// do horário — e página vazia é o tipo de resposta que faz uma sonda de
// reconhecimento concluir a coisa errada.
function ultimoDiaUtil() {
  let d = new Date(Date.now() - MS_DIA);
  while (!ehDiaUtil(d)) d = new Date(d.getTime() - MS_DIA);
  return d;
}

const ref = ultimoDiaUtil();
const [aaaa, mm, dd] = ref.toISOString().slice(0, 10).split("-");
const dataBR = `${dd}/${mm}/${aaaa}`;
const dataCompacta = `${aaaa}${mm}${dd}`;

console.log(`sonda B3 — data de referência ${dataBR} (último dia útil)\n`);

// As Taxas Referenciais são selecionadas por um código de curva. PRE é a
// DI x pré; os outros dois são os candidatos para o cupom cambial, e faz parte
// do reconhecimento descobrir qual responde com o quê.
const CANDIDATOS = [
  ["TxRef PRE (DI x pré)", `https://www2.bmf.com.br/pages/portal/bmfbovespa/boletim1/TxRef1.asp?Data=${dataBR}&Data1=${dataCompacta}&slcTaxa=PRE`],
  ["TxRef DOC (cupom limpo?)", `https://www2.bmf.com.br/pages/portal/bmfbovespa/boletim1/TxRef1.asp?Data=${dataBR}&Data1=${dataCompacta}&slcTaxa=DOC`],
  ["TxRef DOL (DI x dólar?)", `https://www2.bmf.com.br/pages/portal/bmfbovespa/boletim1/TxRef1.asp?Data=${dataBR}&Data1=${dataCompacta}&slcTaxa=DOL`],
  ["Ajustes do pregão (hoje)", "https://www2.bmf.com.br/pages/portal/bmfbovespa/lumis/lum-ajustes-do-pregao-ptBR.asp"],
  ["Ajustes do pregão (data)", `https://www2.bmf.com.br/pages/portal/bmfbovespa/lumis/lum-ajustes-do-pregao-ptBR.asp?dData1=${dataBR}`],
  ["Pregão por mercadoria DI1", `https://www2.bmf.com.br/pages/portal/bmfbovespa/boletim1/SistemaPregao_excel1.asp?Data=${dataBR}&Mercadoria=DI1`],
  ["Pregão por mercadoria FRC", `https://www2.bmf.com.br/pages/portal/bmfbovespa/boletim1/SistemaPregao_excel1.asp?Data=${dataBR}&Mercadoria=FRC`],
  ["Pregão por mercadoria DDI", `https://www2.bmf.com.br/pages/portal/bmfbovespa/boletim1/SistemaPregao_excel1.asp?Data=${dataBR}&Mercadoria=DDI`],
  ["Raiz arquivos.b3.com.br", "https://arquivos.b3.com.br/"],
];

// As páginas da B3 são ISO-8859-1. Decodificar como UTF-8 produz amostra
// ilegível e levaria o leitor a achar que o corpo veio corrompido, quando o
// corrompido é a leitura. Decodifica nas duas e mostra qual tem menos
// caractere de substituição.
function decodificar(bytes) {
  const latin = new TextDecoder("iso-8859-1").decode(bytes);
  const utf = new TextDecoder("utf-8", { fatal: false }).decode(bytes);
  const sujo = (t) => (t.match(/�/g) || []).length;
  return sujo(utf) > sujo(latin) ? { texto: latin, codificacao: "iso-8859-1" } : { texto: utf, codificacao: "utf-8" };
}

// Só o miolo interessa: a amostra serve para reconhecer tabela e nomes de
// coluna, e 400 caracteres de <head> não mostram nada disso.
function amostrar(texto) {
  const corpo = texto.replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ");
  const tabela = corpo.search(/<table/i);
  const inicio = tabela >= 0 ? tabela : 0;
  return corpo
    .slice(inicio, inicio + 700)
    .replace(/\s+/g, " ")
    .trim();
}

const ehRede = (e) => {
  const txt = String(e?.cause?.code || e?.cause?.message || e?.message || e);
  return /fetch failed|ENOTFOUND|ECONNRESET|ECONNREFUSED|EAI_AGAIN|UND_ERR|timeout|abort|socket hang up/i.test(txt);
};

// O fetch do Node NÃO tem timeout padrão, e isso não é teoria: a primeira
// execução desta sonda ficou presa no mesmo passo por mais de quatro minutos,
// porque um dos candidatos aceita a conexão e nunca responde. Sem o sinal
// abaixo o runner ficaria pendurado até o limite de seis horas do GitHub,
// gastando minuto de graça — e uma sonda de reconhecimento que não termina não
// reconhece nada.
//
// 20s por candidato: a B3 é lenta em hora de pico, então um limite curto
// demais transformaria lentidão em "não respondeu", que é justamente a
// conclusão errada. Nove candidatos dão 3 minutos no pior caso.
const LIMITE_MS = 20000;

let responderam = 0;
const comTabela = [];

for (const [rotulo, url] of CANDIDATOS) {
  console.log(`=== ${rotulo} ===`);
  console.log(`  ${url}`);
  try {
    const r = await fetch(url, {
      headers: {
        Accept: "text/html,application/xhtml+xml,*/*",
        "Accept-Language": "pt-BR,pt;q=0.9",
        "User-Agent": "tesouro-tracker (sonda de reconhecimento)",
      },
      redirect: "follow",
      signal: AbortSignal.timeout(LIMITE_MS),
    });
    const bytes = new Uint8Array(await r.arrayBuffer());
    const { texto, codificacao } = decodificar(bytes);
    const temTabela = /<table/i.test(texto);

    console.log(`  HTTP ${r.status} · ${r.headers.get("content-type") || "sem content-type"} · ${bytes.length} bytes · ${codificacao}`);
    if (r.url !== url) console.log(`  redirecionou para: ${r.url}`);

    if (r.ok) {
      responderam++;
      console.log(`  <table> no corpo: ${temTabela ? "SIM" : "não"}`);
      if (temTabela) comTabela.push(rotulo);
      console.log(`  amostra: ${amostrar(texto)}`);
    } else {
      // 404 aqui é resposta, não defeito: a URL era palpite.
      console.log(`  (não é por aqui)`);
    }
  } catch (e) {
    const motivo = e?.cause?.code || e?.message || String(e);
    const estourou = /abort|timeout/i.test(String(e?.name || motivo));
    console.log(
      estourou
        ? `  sem resposta em ${LIMITE_MS / 1000}s — aceitou a conexão e não respondeu`
        : ehRede(e)
          ? `  sem resposta (${motivo})`
          : `  erro: ${motivo}`
    );
  }
  console.log("");
}

console.log("=== veredito ===");
console.log(`  ${responderam} de ${CANDIDATOS.length} candidatos responderam 200`);
if (comTabela.length) {
  console.log(`  com tabela no corpo: ${comTabela.join(", ")}`);
  console.log("  → há de onde construir. O próximo passo é o parser, contra a amostra acima.");
} else {
  console.log("  nenhum candidato devolveu tabela.");
  console.log("  → ou a B3 está fora, ou nenhuma das URLs é a certa. Reconhecimento, não defeito:");
  console.log("    esta sonda não reprova por isso. Rode de novo, e se repetir, as URLs é que mudaram.");
}

// Sai 0 sempre: em reconhecimento não há contrato a violar, e o produto desta
// sonda é o log, não o código de saída. Quando o parser existir, ela herda a
// fronteira das irmãs — sem resposta passa, resposta estranha reprova.
process.exit(0);
