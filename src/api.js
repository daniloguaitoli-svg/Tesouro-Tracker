// src/api.js — cliente das rotas /api (mesma origem, dev e produção).

async function getJSON(url) {
  const r = await fetch(url);
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j.error || `Erro ${r.status}`);
  return j;
}

export const getTitulos = () => getJSON("/api/titulos");
export const getCurva = () => getJSON("/api/curva");
export const getMacro = () => getJSON("/api/macro");
export const getDetalhe = (slug, tf = "1A") =>
  getJSON(`/api/detalhe?slug=${encodeURIComponent(slug)}&tf=${encodeURIComponent(tf)}`);
