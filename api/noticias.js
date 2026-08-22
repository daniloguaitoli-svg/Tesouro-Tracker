// api/noticias.js — função serverless da Vercel. Manchetes de mercado por
// região (Brasil, EUA, Europa), via RSS, melhor esforço.
import { getNoticias } from "../server/datalayer.js";

export default async function handler(req, res) {
  try {
    // Manchetes envelhecem rápido: cache curto.
    res.setHeader("Cache-Control", "s-maxage=900, stale-while-revalidate=3600");
    return res.status(200).json(await getNoticias());
  } catch (e) {
    return res.status(502).json({ error: e.message });
  }
}
