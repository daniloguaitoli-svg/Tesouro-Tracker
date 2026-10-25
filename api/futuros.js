// api/futuros.js — função serverless da Vercel. As duas curvas do mercado
// futuro da B3: DI × pré em reais e cupom cambial limpo em dólar.
//
// Mesma janela de cache da /api/curva: a base só muda quando o coletor roda.
import { getFuturos } from "../server/datalayer.js";

export default async function handler(req, res) {
  try {
    res.setHeader("Cache-Control", "s-maxage=1800, stale-while-revalidate=7200");
    return res.status(200).json(await getFuturos());
  } catch (e) {
    return res.status(502).json({ error: e.message });
  }
}
