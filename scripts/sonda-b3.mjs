// scripts/sonda-b3.mjs — reconhecimento das fontes da B3 (DI futuro e FRC).
//
// POR QUE EXISTE: os endereços da B3 recusam conexão do ambiente de
// desenvolvimento, medido em 25/10/2026 — www2.bmf.com.br, arquivos.b3.com.br
// e www.b3.com.br devolveram todos código 000 (sem resposta). É a mesma
// barreira do Yahoo, do SGS e do Tesouro, e a mesma solução: um runner do
// GitHub é o único lugar com rede aberta para esses endereços.
//
// ESTA SONDA É DIFERENTE DAS OUTRAS DUAS. A sonda-tesouro e a sonda-mercado
// verificam fonte CONHECIDA: sabem o formato, e um desvio é defeito. Esta
// ainda não sabe o formato — ela existe para DESCOBRIR qual endereço responde
// e com que corpo, porque não dá para escrever parser contra arquivo que nunca
// se viu (foi assim que o repositório errou com a ANBIMA). Daí ela imprimir
// amostra, que é o produto dela, e não reprovar em 404: as URLs são palpite, e
// um 404 é resposta útil, não falha. Quando houver parser, ela herda a
// fronteira das irmãs.
//
// ---------------------------------------------------------------------------
// RODADA 1, medida em 25/10/2026 — NÃO PRECISA SER REFEITA.
//
// Nove candidatos do portal antigo, nenhum devolveu tabela:
//
//   TxRef1.asp (slcTaxa PRE, DOC, DOL) ........ 404 nos três
//   lum-ajustes-do-pregao-ptBR.asp ............ 200, mas redireciona para a
//                                               página nova do Boletim Diário,
//                                               50 KB de SPA, sem <table>
//   lum-ajustes... ?dData1=DD/MM/AAAA ......... 200 com corpo VAZIO (0 bytes)
//   SistemaPregao_excel1.asp DI1 .............. aceitou a conexão e não
//                                               respondeu em 20s
//   SistemaPregao_excel1.asp FRC e DDI ........ 200, redirecionam para
//                                               Erro.asp "Unspecified error"
//   arquivos.b3.com.br (raiz) ................. 200, casca de SPA Angular
//                                               ("B3 - UP2DATA WEB")
//
// Conclusão: o portal www2.bmf.com.br é de uma geração anterior e não serve
// mais. Não insista nele. O caminho vivo aparenta ser o UP2DATA, atrás
// daquele SPA, e é o que esta rodada 2 investiga.
// ---------------------------------------------------------------------------
//
// RODADA 2 — o UP2DATA tem download em DOIS PASSOS: pede-se o arquivo pelo
// nome e recebe-se um token, e só o token baixa o conteúdo. Por isso a sonda
// faz os dois: um primeiro passo que responde 200 não prova nada se o segundo
// não entregar bytes.

import { ehDiaUtil } from "../server/feriados.js";

const MS_DIA = 86400000;
const BASE = "https://arquivos.b3.com.br/api/download";

// O fetch do Node NÃO tem timeout padrão, e isso não é teoria: a primeira
// execução desta sonda ficou presa por mais de quatro minutos porque um
// candidato aceita a conexão e nunca responde. 20s por pedido — curto demais
// transformaria lentidão de hora de pico em "não respondeu", que é a conclusão
// errada.
const LIMITE_MS = 20000;

function diasUteisAtras(n) {
  let d = new Date(Date.now() - MS_DIA);
  while (n > 0) {
    if (ehDiaUtil(d)) n--;
    if (n > 0) d = new Date(d.getTime() - MS_DIA);
  }
  while (!ehDiaUtil(d)) d = new Date(d.getTime() - MS_DIA);
  return d.toISOString().slice(0, 10);
}

// Duas datas, de propósito. Se a mais recente vier vazia e a anterior vier
// cheia, o arquivo do dia só não foi processado ainda — e isso é rotina, não
// defeito. Sem a segunda data as duas situações seriam indistinguíveis.
const DATAS = [diasUteisAtras(1), diasUteisAtras(2)];

// Os nomes são palpite informado: o único documentado por terceiros é o
// TradeInformationConsolidated. Os outros seguem a nomenclatura da B3 para
// arquivos públicos, e descobrir quais existem é metade do trabalho desta
// rodada.
const ARQUIVOS = [
  "TradeInformationConsolidatedFile",
  "TradeInformationConsolidated",
  "SettlementPrices",
  "PriceReport",
  "InstrumentsConsolidatedFile",
  "EconomicIndicatorPrice",
];

const amostraTexto = (t) => t.slice(0, 500).replace(/\s+/g, " ").trim();

// Detecta o formato pelos primeiros bytes em vez de confiar no content-type:
// a B3 serve ZIP como application/octet-stream, e um parser escrito para o
// tipo declarado leria lixo.
function formato(bytes) {
  if (bytes.length >= 4 && bytes[0] === 0x50 && bytes[1] === 0x4b) return "ZIP";
  if (bytes.length >= 2 && bytes[0] === 0x1f && bytes[1] === 0x8b) return "GZIP";
  const inicio = new TextDecoder("utf-8", { fatal: false }).decode(bytes.slice(0, 200));
  if (/^\s*[[{]/.test(inicio)) return "JSON";
  if (/^\s*</.test(inicio)) return "HTML/XML";
  return "texto";
}

// Nomes das entradas de um ZIP, lidos dos cabeçalhos locais. Não descompacta:
// aqui só interessa SABER o que tem dentro, e um inflate completo seria código
// para jogar fora quando o parser de verdade existir.
function entradasDoZip(bytes) {
  const nomes = [];
  for (let i = 0; i + 30 < bytes.length && nomes.length < 12; i++) {
    if (bytes[i] === 0x50 && bytes[i + 1] === 0x4b && bytes[i + 2] === 0x03 && bytes[i + 3] === 0x04) {
      const tamNome = bytes[i + 26] | (bytes[i + 27] << 8);
      if (tamNome > 0 && tamNome < 300 && i + 30 + tamNome <= bytes.length) {
        nomes.push(new TextDecoder("utf-8").decode(bytes.slice(i + 30, i + 30 + tamNome)));
      }
    }
  }
  return nomes;
}

async function pedir(url, rotulo) {
  try {
    const r = await fetch(url, {
      headers: { Accept: "application/json,text/plain,*/*", "User-Agent": "tesouro-tracker (sonda de reconhecimento)" },
      redirect: "follow",
      signal: AbortSignal.timeout(LIMITE_MS),
    });
    const bytes = new Uint8Array(await r.arrayBuffer());
    return { ok: r.ok, status: r.status, tipo: r.headers.get("content-type") || "—", bytes, url: r.url };
  } catch (e) {
    const estourou = /abort|timeout/i.test(String(e?.name || e?.message || e));
    console.log(`  ${rotulo}: ${estourou ? `sem resposta em ${LIMITE_MS / 1000}s` : `sem resposta (${e?.cause?.code || e.message})`}`);
    return null;
  }
}

console.log(`sonda B3 rodada 2 — UP2DATA, datas ${DATAS.join(" e ")}\n`);

let baixouAlgo = false;

for (const data of DATAS) {
  for (const arquivo of ARQUIVOS) {
    const url = `${BASE}/requestname?fileName=${encodeURIComponent(arquivo)}&date=${data}&recaptchaToken=`;
    console.log(`=== ${arquivo} · ${data} ===`);

    const passo1 = await pedir(url, "passo 1");
    if (!passo1) {
      console.log("");
      continue;
    }

    const texto = new TextDecoder("utf-8", { fatal: false }).decode(passo1.bytes);
    console.log(`  passo 1: HTTP ${passo1.status} · ${passo1.tipo} · ${passo1.bytes.length} bytes`);

    if (!passo1.ok || !passo1.bytes.length) {
      console.log(`  corpo: ${amostraTexto(texto) || "(vazio)"}`);
      console.log("");
      continue;
    }
    console.log(`  corpo: ${amostraTexto(texto)}`);

    // O token pode vir com nomes diferentes conforme a versão da API; procura
    // os plausíveis em vez de fixar um e concluir "não tem token" por engano.
    let token = null;
    try {
      const j = JSON.parse(texto);
      token = j.token || j.redirectUrl || j.file?.token || j.data?.token || null;
    } catch {
      const m = texto.match(/[?&]token=([^"&\s]+)/);
      token = m ? m[1] : null;
    }

    if (!token) {
      console.log("  sem token no corpo — o passo 2 não tem como ser tentado");
      console.log("");
      continue;
    }
    console.log(`  token: ${String(token).slice(0, 60)}…`);

    const passo2 = await pedir(`${BASE}/?token=${encodeURIComponent(token)}`, "passo 2");
    if (!passo2) {
      console.log("");
      continue;
    }

    const fmt = formato(passo2.bytes);
    console.log(`  passo 2: HTTP ${passo2.status} · ${passo2.tipo} · ${passo2.bytes.length} bytes · formato ${fmt}`);

    if (passo2.ok && passo2.bytes.length > 0) {
      baixouAlgo = true;
      if (fmt === "ZIP") {
        const entradas = entradasDoZip(passo2.bytes);
        console.log(`  dentro do ZIP: ${entradas.length ? entradas.join(", ") : "(não consegui ler os nomes)"}`);
      } else {
        const t = new TextDecoder("utf-8", { fatal: false }).decode(passo2.bytes.slice(0, 1200));
        console.log("  primeiras linhas:");
        for (const linha of t.split(/\r?\n/).slice(0, 6)) console.log(`    ${linha.slice(0, 160)}`);
      }
    }
    console.log("");
  }
}

console.log("=== veredito ===");
if (baixouAlgo) {
  console.log("  pelo menos um arquivo veio com bytes. O próximo passo é o parser, contra a amostra acima.");
} else {
  console.log("  nenhum arquivo veio com bytes.");
  console.log("  → ou os nomes estão errados, ou o endereço pede algo que a sonda não manda");
  console.log("    (recaptcha de verdade, cookie de sessão, cabeçalho de origem).");
  console.log("  Reconhecimento, não defeito: esta sonda não reprova por isso.");
}

process.exit(0);
