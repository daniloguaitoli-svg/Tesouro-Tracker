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

// Extrai os itens de um XML de RSS. Pura e exportada para o verificar.mjs.
export function extrairItens(xml, limite = 8) {
  const itens = [];
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
    itens.push({ titulo: tituloLimpo, url, fonte: fonte || null, data });
    if (itens.length >= limite) break;
  }
  return itens;
}

// Manchetes de uma região, com cache. Lança em falha — quem decide o que fazer
// com uma região fora do ar é o datalayer (allSettled).
export async function manchetes(regiao) {
  const hit = cache.get(regiao.id);
  if (hit && Date.now() - hit.ts < TTL_MS) return hit.itens;
  const r = await fetch(regiao.url, { headers: UA });
  if (!r.ok) throw new Error(`RSS ${regiao.id}: HTTP ${r.status}`);
  const itens = extrairItens(await r.text());
  if (!itens.length) throw new Error(`RSS ${regiao.id}: nenhum item reconhecido`);
  cache.set(regiao.id, { ts: Date.now(), itens });
  return itens;
}
