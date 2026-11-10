// rota.js — onde se está no app, escrito no endereço.
//
// POR QUE EXISTE: a aba e o título aberto viviam só em estado do React. O
// endereço era sempre o mesmo, então (1) o botão Voltar do Android saía do app
// em vez de fechar o título aberto, (2) não dava para guardar nem mandar o
// link de um título, e (3) recarregar a página devolvia ao Painel.
//
// POR QUE NO HASH (`#/curva`, `#/titulo/<slug>`) e não no caminho (`/curva`):
// caminho de verdade exige que o servidor devolva o index.html para qualquer
// endereço, e que o service worker saiba fazer o mesmo offline. O hash nunca
// chega ao servidor: funciona igual no dev, na Vercel e sem rede, sem tocar em
// configuração nenhuma.
//
// Este arquivo é PURO, sem importar nada — é o que deixa o verificar.mjs
// exercitar a leitura e a escrita do endereço em node. O gancho do React, que
// mexe no histórico do navegador, mora em useRota.js.

const TITULO = "titulo/";

// Lê o hash e devolve { tab, slug }. Qualquer coisa que não reconheça cai na
// aba padrão em vez de dar erro: um link antigo ou digitado errado tem de
// abrir o app, não uma tela vazia.
export function lerRota(hash, abasValidas, padrao) {
  const caminho = String(hash || "").replace(/^#\/?/, "");
  if (caminho.startsWith(TITULO)) {
    let slug = caminho.slice(TITULO.length);
    try {
      slug = decodeURIComponent(slug);
    } catch {
      /* % solto no endereço: usa como veio */
    }
    // O slug só tem letras, números e hífen. Qualquer outra coisa não é um
    // título — e não vai parar numa chamada de /api.
    if (/^[a-z0-9-]+$/i.test(slug)) return { tab: padrao, slug };
    return { tab: padrao, slug: null };
  }
  return { tab: abasValidas.includes(caminho) ? caminho : padrao, slug: null };
}

export function escreverRota({ tab, slug }) {
  return slug ? `#/${TITULO}${encodeURIComponent(slug)}` : `#/${tab}`;
}
