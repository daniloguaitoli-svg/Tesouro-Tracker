// src/tema.js — claro, escuro ou o que o aparelho pedir.
//
// TRÊS POSIÇÕES, e a do meio é o padrão: "auto" segue o sistema (o
// prefers-color-scheme), que é o que a pessoa já escolheu para o aparelho
// inteiro. Claro e escuro existem para quem quer o app diferente do resto —
// ler taxa na rua, ao sol, com o telefone em modo escuro, por exemplo.
//
// COMO CHEGA AO CSS: "auto" não põe atributo nenhum, e o styles.css resolve
// sozinho pela media query. Claro e escuro põem `data-tema` no <html>, que
// vence a media query. Assim o app abre no tema certo mesmo antes de este
// arquivo rodar: o index.html lê a mesma chave num script de três linhas, no
// <head>, e sem isso a tela piscaria escura a cada abertura para quem
// escolheu o claro. A chave está duplicada lá de propósito, e o verificar.mjs
// confere que as duas batem.
//
// A escolha fica no localStorage: é uma preferência DESTE aparelho, como as
// estrelas. Arquivo puro, sem importar nada.

export const CHAVE = "tesouro-tracker-tema";
export const TEMAS = [
  { id: "auto", rotulo: "Auto" },
  { id: "claro", rotulo: "Claro" },
  { id: "escuro", rotulo: "Escuro" },
];

// A cor da barra do navegador (meta theme-color) em cada tema: o --bg de
// cada um. Duplicada do styles.css, porque uma <meta> não lê custom property;
// o verificar.mjs confere que continua igual ao token.
export const COR_DA_BARRA = { claro: "#f3f5fa", escuro: "#080b14" };

const ehTema = (t) => t === "claro" || t === "escuro";

export function carregarTema() {
  if (typeof window === "undefined") return "auto";
  try {
    const t = window.localStorage.getItem(CHAVE);
    return ehTema(t) ? t : "auto";
  } catch {
    return "auto";
  }
}

export function salvarTema(tema) {
  try {
    if (ehTema(tema)) window.localStorage.setItem(CHAVE, tema);
    else window.localStorage.removeItem(CHAVE);
  } catch {
    /* modo privativo — o tema vale até fechar o app */
  }
}

// Põe (ou tira) o atributo no <html> e acerta a cor da barra do navegador.
export function aplicarTema(tema, doc = typeof document === "undefined" ? null : document) {
  if (!doc) return;
  const raiz = doc.documentElement;
  if (ehTema(tema)) raiz.setAttribute("data-tema", tema);
  else raiz.removeAttribute("data-tema");

  // O index.html traz duas <meta name="theme-color">, uma por esquema do
  // sistema. Com um tema escolhido à mão as duas passam a dizer a mesma cor;
  // em "auto" cada uma volta à sua (guardada em data-padrao).
  for (const meta of doc.querySelectorAll('meta[name="theme-color"]')) {
    const padrao = meta.getAttribute("data-padrao");
    if (ehTema(tema)) meta.setAttribute("content", COR_DA_BARRA[tema]);
    else if (padrao) meta.setAttribute("content", padrao);
  }
}
