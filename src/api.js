// src/api.js — cliente das rotas /api (mesma origem, dev e produção).

async function getJSON(url) {
  const r = await fetch(url);
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j.error || `Erro ${r.status}`);
  return j;
}

export const getTitulos = () => getJSON("/api/titulos");
export const getCurva = () => getJSON("/api/curva");
// Endpoint próprio, e não um campo do /api/curva: a fonte é a B3, não o
// Tesouro, e um dia sem coleta lá não pode esvaziar a curva dos títulos.
export const getFuturos = () => getJSON("/api/futuros");
export const getMacro = () => getJSON("/api/macro");
export const getMercado = () => getJSON("/api/mercado");
export const getNoticias = () => getJSON("/api/noticias");
export const getDetalhe = (slug, tf = "1A") =>
  getJSON(`/api/detalhe?slug=${encodeURIComponent(slug)}&tf=${encodeURIComponent(tf)}`);
