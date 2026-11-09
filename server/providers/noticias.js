// server/providers/noticias.js — manchetes de mercado por região, via RSS do
// Google News (gratuito, sem chave).
//
// POR QUE RSS, E POR QUE O DO GOOGLE NEWS: não existe API de notícias gratuita
// e sem chave que valha o nome; os feeds RSS das agências grandes foram quase
// todos descontinuados. O RSS do Google News continua público, aceita consulta
// por tema e por região/idioma, e devolve manchetes COM a fonte original e o
// link para ela. O app mostra manchete + fonte + link — não copia conteúdo.
//
// PARSING COM REGEX DE PROPÓSITO (regra da casa: nenhuma dependência além de
// react). RSS é XML previsível o bastante para os campos que usamos; se o
// formato mudar, o provider devolve lista vazia e a tela diz isso — nunca
// inventa manchete.
//
// É a fonte mais "mole" do app: manchetes são DECORAÇÃO INFORMATIVA, não dado
// de decisão. Por isso: melhor esforço, cache curto, cada região independente
// (Promise.allSettled no datalayer), e falha silenciosa por região.

const TTL_MS = 20 * 60 * 1000;
const cache = new Map(); // id -> { ts, itens }

const UA = { "User-Agent": "Mozilla/5.0 (compatible; tesouro-tracker)", Accept: "application/rss+xml,application/xml,text/xml,*/*" };

export const REGIOES = [
  {
    id: "brasil",
    nome: "Brasil",
    url: "https://news.google.com/rss/search?q=mercado%20financeiro%20OR%20Ibovespa%20OR%20Copom%20when:2d&hl=pt-BR&gl=BR&ceid=BR:pt-419",
  },
  {
    id: "eua",
    nome: "Estados Unidos",
    url: "https://news.google.com/rss/search?q=stock%20market%20OR%20%22Federal%20Reserve%22%20OR%20treasuries%20when:2d&hl=en-US&gl=US&ceid=US:en",
  },
  {
    id: "europa",
    nome: "Europa",
    // "ECB" sozinho NÃO: com localização britânica, ECB é o England and
    // Wales Cricket Board — a primeira sonda real trouxe manchete de críquete.
    // Sempre o nome por extenso, e termos inequívocos de mercado.
    url: "https://news.google.com/rss/search?q=%22European%20Central%20Bank%22%20OR%20eurozone%20OR%20%22European%20stocks%22%20OR%20DAX%20when:2d&hl=en-GB&gl=GB&ceid=GB:en",
  },
];

// Entidades comuns em título de RSS. O suficiente para manchete legível.
function desescapar(txt) {
  return String(txt ?? "")
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;|&apos;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

// ---------- O que não é manchete ----------
// O feed é uma BUSCA, e busca devolve o que casa com as palavras, não o que é
// notícia. Medido no feed real de 09/11/2026: duas das oito manchetes dos EUA
// eram "symbol__ Stock Quote Price and Forecast" (página de cotação da CNN com
// o nome do ativo por preencher), e a primeira do Brasil era o anúncio de um
// simpósio universitário que cita "mercado financeiro".
//
// Só sai o que tem REGRA EXPLICÁVEL. Julgar relevância por regex seria fingir
// uma curadoria que o app não faz — e a tela diz que a seleção é do agregador.
// Cada regra abaixo descreve um TIPO de página, nunca um veículo.
const NAO_E_MANCHETE = [
  // Modelo por preencher: "symbol__", "{{ticker}}", "${nome}".
  { motivo: "modelo por preencher", re: /\w__(\s|$)|\{\{|\$\{/ },
  // Página de cotação de um ativo, não notícia sobre ele.
  { motivo: "página de cotação", re: /\bstock quote\b|\bprice and forecast\b|\bcotação em tempo real\b/i },
  // Divulgação de evento. A lista é curta DE PROPÓSITO: "congresso" e "curso"
  // ficam de fora porque "Congresso aprova…" e "corte de juros em curso" são
  // manchete de mercado, e "conference" porque a coletiva do Fed é "press
  // conference".
  { motivo: "divulgação de evento", re: /\bsimp[óo]sio\b|\bsemin[áa]rio\b|\bpalestra\b|\bwebinar\b|\binscrições abertas\b/i },
];

// Exportada para o verificar.mjs e para o coletor, que registra no log o que
// o filtro tirou do feed real — é a única forma de ver se uma regra está
// comendo manchete de verdade.
export function motivoDoDescarte(titulo) {
  return NAO_E_MANCHETE.find((r) => r.re.test(titulo))?.motivo ?? null;
}

// A mesma manchete chega mais de uma vez: republicada por outro veículo, ou
// com dois links para a mesma página. Compara sem acento, caixa e pontuação.
const chaveDoTitulo = (titulo) =>
  titulo.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

// Extrai os itens de um XML de RSS. Pura e exportada para o verificar.mjs.
//
// A ORDEM DAS ETAPAS IMPORTA:
//   1. lê o feed INTEIRO (são até 100 itens), e não só os primeiros `limite`:
//      cortar antes de filtrar devolvia menos manchetes do que havia;
//   2. tira o que não é manchete e as repetidas;
//   3. fica com os primeiros `limite` NA ORDEM DO AGREGADOR — é a seleção
//      dele por relevância, a que a tela diz mostrar. Pegar os oito mais
//      recentes de cem trocaria essa seleção por "o que saiu por último",
//      de qualquer veículo;
//   4. só então ordena esses por data, a mais nova primeiro, para a leitura.
export function extrairItens(xml, limite = 8) {
  const itens = [];
  const vistos = new Set();
  const blocos = String(xml ?? "").match(/<item>[\s\S]*?<\/item>/g) || [];
  for (const bloco of blocos) {
    const titulo = desescapar(bloco.match(/<title>([\s\S]*?)<\/title>/)?.[1]);
    const url = desescapar(bloco.match(/<link>([\s\S]*?)<\/link>/)?.[1]);
    const fonte = desescapar(bloco.match(/<source[^>]*>([\s\S]*?)<\/source>/)?.[1]);
    const pub = bloco.match(/<pubDate>([\s\S]*?)<\/pubDate>/)?.[1];
    let data = null;
    if (pub) {
      const d = new Date(pub.trim());
      if (!Number.isNaN(d.getTime())) data = d.toISOString();
    }
    if (!titulo || !url) continue;
    // O Google News repete a fonte no fim do título ("Manchete - Fonte");
    // com o campo <source> presente, o sufixo vira ruído — corta.
    const tituloLimpo = fonte && titulo.endsWith(` - ${fonte}`) ? titulo.slice(0, -(fonte.length + 3)) : titulo;
    if (motivoDoDescarte(tituloLimpo)) continue;
    const chave = chaveDoTitulo(tituloLimpo);
    if (!chave || vistos.has(chave) || vistos.has(url)) continue;
    vistos.add(chave);
    vistos.add(url);
    itens.push({ titulo: tituloLimpo, url, fonte: fonte || null, data });
    if (itens.length >= limite) break;
  }
  // Sem data vai para o fim, na ordem em que veio (o sort do JS é estável).
  return itens.sort((a, b) => (b.data ? Date.parse(b.data) : -Infinity) - (a.data ? Date.parse(a.data) : -Infinity));
}

// O que o filtro tirou de um feed, com o motivo. Não é usada pela tela: existe
// para o coletor escrever no log, no runner, o que cada regra descartou do
// feed de verdade. Uma regra que começa a comer manchete só aparece ali.
export function descartadosDoFeed(xml) {
  const fora = [];
  for (const bloco of String(xml ?? "").match(/<item>[\s\S]*?<\/item>/g) || []) {
    const titulo = desescapar(bloco.match(/<title>([\s\S]*?)<\/title>/)?.[1]);
    const motivo = titulo && motivoDoDescarte(titulo);
    if (motivo) fora.push({ titulo, motivo });
  }
  return fora;
}

// Baixa o feed de uma região. Separada de `manchetes` para o coletor poder
// olhar o XML inteiro (manchetes aproveitadas E descartadas) num pedido só.
export async function baixarFeed(regiao) {
  const r = await fetch(regiao.url, { headers: UA });
  if (!r.ok) throw new Error(`RSS ${regiao.id}: HTTP ${r.status}`);
  return r.text();
}

// Manchetes de uma região, com cache. Lança em falha — quem decide o que fazer
// com uma região fora do ar é o datalayer (allSettled).
export async function manchetes(regiao) {
  const hit = cache.get(regiao.id);
  if (hit && Date.now() - hit.ts < TTL_MS) return hit.itens;
  const itens = extrairItens(await baixarFeed(regiao));
  if (!itens.length) throw new Error(`RSS ${regiao.id}: nenhum item reconhecido`);
  cache.set(regiao.id, { ts: Date.now(), itens });
  return itens;
}
