// scripts/sonda-tesouro.mjs — a sonda da FONTE do Tesouro Direto.
//
// POR QUE EXISTE: quando o preço na tela para de andar, há duas explicações
// possíveis e elas pedem ações opostas — ou o Tesouro parou de publicar (não há
// nada a fazer além de esperar), ou nós estamos lendo uma cópia velha (defeito
// nosso, com conserto). Sem esta sonda a diferença é indistinguível de fora: o
// coletor loga "sucesso" nos dois casos, porque nos dois casos ele baixa um
// arquivo íntegro, parseia certo e grava. Foi exatamente a dúvida de 23/09/2026,
// com a tela parada em 18/09 e onze coletas seguidas verdes.
//
// `tesourotransparente.gov.br` não responde do ambiente de desenvolvimento (o
// proxy de saída recusa o host), então isto roda num runner do GitHub — o mesmo
// motivo da sonda-mercado.mjs. Não grava nada.
//
// Três perguntas, nesta ordem:
//
//   1. O que a FONTE diz sobre si mesma? O CKAN publica `last_modified` do
//      recurso, que é a data em que eles atualizaram o arquivo — a resposta
//      mais direta possível, vinda de quem publica.
//   2. Estamos pegando cache? A mesma URL é pedida duas vezes, a segunda com
//      um parâmetro que nenhum cache conhece. Se as duas respostas tiverem
//      conteúdos diferentes, o defeito é nosso e tem conserto.
//   3. O que existe DENTRO do arquivo? Lê pela mesma varrerSerie() do coletor
//      (e não por um parser paralelo que poderia discordar dele) e reporta as
//      últimas datas presentes, mais quais dias úteis recentes estão faltando.

import { URL_CSV, varrerSerie } from "../server/providers/tesouro.js";
import { hojeISO, diasUteisEntre } from "../server/util.js";

const marcar = (ok) => (ok ? "ok   " : "FALHA");
let falhas = 0;
// Fonte fora do ar NÃO é defeito nosso, e por isso não reprova.
//
// Esta sonda nasceu reprovando em qualquer tropeço e mandou um e-mail de falha
// duas horas depois de nascer: às 07:57 de 23/09/2026 o site recusou conexão
// nas quatro tentativas (UND_ERR_CONNECT_TIMEOUT), dois minutos depois de uma
// execução limpa. É o mesmo soluço que o coletor já tolera desde 29/08 — e a
// mesma lição: alerta que chora lobo por causa do tempo deixa de ser lido, e
// aí o dia em que ele disser a verdade passa batido.
//
// O que continua reprovando é defeito DESTE lado: o quebra-cache trazendo
// conteúdo diferente (estamos lendo cópia velha) e um arquivo que chega e não
// produz data nenhuma (parser quebrado) — a mesma fronteira que o coletor usa
// entre "recusou conexão" e "chegou e não deu para entender".
//
// A linha fica entre não-resposta e resposta: conexão recusada, timeout e 5xx
// são o servidor sem conseguir falar, e passam. Um 4xx é o servidor DIZENDO
// algo — recurso mudou de lugar, ou o site passou a barrar o runner —, e isso
// precisa aparecer, exatamente como no coletor, que também não retenta 4xx.
let inalcancavel = false;
const ehRede = (e) => {
  const txt = String(e?.cause?.code || e?.cause?.message || e?.message || e);
  return /fetch failed|ENOTFOUND|ECONNRESET|ECONNREFUSED|EAI_AGAIN|UND_ERR|timeout|socket hang up/i.test(txt)
    || /inalcançável após/i.test(txt)
    || /HTTP 5\d\d/.test(txt);
};

const CABECALHOS_DE_CACHE = [
  "date",
  "last-modified",
  "etag",
  "content-length",
  "age",
  "cache-control",
  "x-cache",
  "cf-cache-status",
  "via",
];

// ---------------------------------------------------------------
console.log("=== o que a fonte diz sobre si mesma (metadados CKAN) ===");
// O id do recurso é o trecho depois de /resource/ na URL do download — extraído
// dela em vez de escrito à mão, para os dois não poderem divergir.
const idRecurso = URL_CSV.match(/\/resource\/([0-9a-f-]+)\//i)?.[1];
const urlApi = `https://www.tesourotransparente.gov.br/ckan/api/3/action/resource_show?id=${idRecurso}`;
let publicadoEm = null;
try {
  const r = await fetch(urlApi, { headers: { Accept: "application/json" } });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  const j = await r.json();
  const rec = j?.result || {};
  publicadoEm = rec.last_modified || rec.metadata_modified || rec.created || null;
  console.log(`  ${marcar(!!publicadoEm)} recurso ${idRecurso}`);
  console.log(`         last_modified: ${rec.last_modified ?? "—"}`);
  console.log(`         metadata_modified: ${rec.metadata_modified ?? "—"}`);
  console.log(`         tamanho declarado: ${rec.size ?? "—"}`);
  if (!publicadoEm) falhas++;
} catch (e) {
  // Metadado é informação extra: se a API do CKAN estiver fora, a sonda segue —
  // as perguntas 2 e 3 não dependem dela.
  console.log(`  aviso  API do CKAN não respondeu (${e.message}) — seguindo sem ela`);
}

// ---------------------------------------------------------------
console.log("\n=== estamos lendo cache? (mesma URL, com e sem quebra-cache) ===");
async function cabecalhos(url, rotulo) {
  try {
    // GET e não HEAD: alguns CDNs respondem HEAD de um jeito e GET de outro, e
    // o que interessa é o que o coletor recebe — que é um GET.
    const r = await fetch(url, {
      headers: { Accept: "text/csv,text/plain,*/*", "User-Agent": "tesouro-tracker (sonda)" },
    });
    const h = Object.fromEntries(CABECALHOS_DE_CACHE.map((k) => [k, r.headers.get(k)]).filter(([, v]) => v));
    // Cancela o corpo: aqui só interessam os cabeçalhos, e são 14 MB.
    await r.body?.cancel();
    const naoRespondeu = r.status >= 500;
    console.log(`  ${r.ok ? marcar(true) : naoRespondeu ? "aviso" : marcar(false)} ${rotulo}: HTTP ${r.status}`);
    for (const [k, v] of Object.entries(h)) console.log(`         ${k}: ${v}`);
    if (!r.ok) {
      if (naoRespondeu) inalcancavel = true;
      else falhas++;
    }
    // Sem corpo não há o que comparar: devolver os cabeçalhos de uma resposta
    // de erro faria a comparação "as duas são o mesmo arquivo" passar comparando
    // duas páginas de erro idênticas — um ok que não quer dizer nada.
    return r.ok ? h : null;
  } catch (e) {
    if (ehRede(e)) {
      inalcancavel = true;
      console.log(`  aviso  ${rotulo}: fonte não respondeu (${e.cause?.code || e.message})`);
      return null;
    }
    console.log(`  ${marcar(false)} ${rotulo}: ${e.message}`);
    falhas++;
    return null;
  }
}

const direto = await cabecalhos(URL_CSV, "URL do coletor");
const semCache = await cabecalhos(`${URL_CSV}?_sonda=${Date.now()}`, "URL com quebra-cache");

if (direto && semCache) {
  // ETag e tamanho iguais = as duas requisições trouxeram o MESMO arquivo, ou
  // seja não há cópia velha sendo servida para nós. Diferentes = defeito nosso,
  // e com conserto (basta o coletor furar o cache do mesmo jeito).
  const mesmoEtag = (direto.etag ?? null) === (semCache.etag ?? null);
  const mesmoTamanho = (direto["content-length"] ?? null) === (semCache["content-length"] ?? null);
  const igual = mesmoEtag && mesmoTamanho;
  console.log(`  ${marcar(igual)} as duas respostas são o mesmo arquivo (etag ${mesmoEtag}, tamanho ${mesmoTamanho})`);
  if (!igual) {
    console.log("         ATENÇÃO: o quebra-cache trouxe conteúdo diferente — estamos lendo cópia velha, e isso é conserto nosso");
    falhas++;
  }
}

// ---------------------------------------------------------------
console.log("\n=== o que existe dentro do arquivo (pela varredura do coletor) ===");
// Janela curta de propósito: a pergunta é "qual a última data publicada", e
// pedir dois meses já responde isso lendo bem menos do que a coleta inteira.
const desde = new Date(Date.now() - 60 * 864e5).toISOString().slice(0, 10);
const porData = new Map();
let leu = false;
try {
  await varrerSerie({
    desdeISO: desde,
    aoLer: (p) => {
      if (p?.data) porData.set(p.data, (porData.get(p.data) || 0) + 1);
    },
  });
  leu = true;
} catch (e) {
  // Mesma fronteira do coletor: conexão recusada é tempo e se resolve sozinha;
  // qualquer outro erro veio de um arquivo que CHEGOU e não deu para entender,
  // e isso nunca se conserta esperando.
  if (ehRede(e)) {
    inalcancavel = true;
    console.log(`  aviso  a fonte não respondeu (${e.cause?.code || e.message}) — sem leitura nesta execução`);
  } else {
    console.log(`  ${marcar(false)} o arquivo chegou e a varredura falhou: ${e.message}`);
    falhas++;
  }
}

const datas = [...porData.keys()].sort();
const ultima = datas[datas.length - 1] || null;
if (leu) {
  console.log(`  ${marcar(!!ultima)} ${datas.length} datas nos últimos 60 dias; última: ${ultima ?? "nenhuma"}`);
  for (const d of datas.slice(-8)) console.log(`         ${d}  ${porData.get(d)} pontos`);
  // Arquivo íntegro que não produz data nenhuma é parser quebrado, e isso
  // reprova sempre — é o caso "chegou e não deu para entender".
  if (!ultima) falhas++;
}

// ---------------------------------------------------------------
console.log("\n=== veredito ===");
if (!ultima && inalcancavel) {
  console.log("  a fonte não respondeu nesta execução (conexão recusada ou timeout).");
  console.log(
    "  → nada se conclui daqui, e isso NÃO é defeito: o site do Tesouro recusa conexão de vez " +
      "em quando e volta sozinho. A próxima janela de coleta é em no máximo três horas; " +
      "rode a sonda de novo depois dela antes de investigar qualquer coisa."
  );
}
if (ultima) {
  const hoje = hojeISO();
  // Dias úteis, não corridos: um arquivo parado na sexta não está atrasado no
  // domingo. O feriado nacional não entra na conta (não há calendário aqui),
  // então um atraso de 1 pode ser feriado — de 2 para cima, não é mais.
  const atraso = diasUteisEntre(ultima, hoje);
  console.log(`  última data publicada: ${ultima} · hoje: ${hoje} · ${atraso} dia(s) útil(eis) de distância`);
  if (publicadoEm) console.log(`  a fonte diz ter atualizado o arquivo em: ${publicadoEm}`);
  // A leitura que interessa, dita em uma linha, porque é ela que decide se há
  // algo a consertar aqui dentro ou se é só esperar.
  if (atraso <= 1) {
    console.log("  → normal: o arquivo do dia sai ao longo do dia seguinte.");
  } else {
    console.log(
      `  → a FONTE está parada há ${atraso} dias úteis. O coletor e o parser estão certos ` +
        "(leram o arquivo inteiro e acharam estas datas); não há conserto deste lado, só esperar a publicação."
    );
  }
}

console.log(
  `\n${falhas === 0 ? (inalcancavel ? "sonda inconclusiva (fonte fora do ar) — sem defeito deste lado" : "sonda limpa") : `${falhas} problema(s)`}`
);
process.exit(falhas === 0 ? 0 : 1);
