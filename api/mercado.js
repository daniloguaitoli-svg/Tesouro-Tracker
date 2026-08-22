// api/mercado.js — função serverless da Vercel. Decisões de política monetária
// (Copom, Fed, BCE), câmbio PTAX e o par CDI × Selic.
import { getMercado } from "../server/datalayer.js";

export default async function handler(req, res) {
  try {
    res.setHeader("Cache-Control", "s-maxage=1800, stale-while-revalidate=7200");
    return res.status(200).json(await getMercado());
  } catch (e) {
    return res.status(502).json({ error: e.message });
  }
}
