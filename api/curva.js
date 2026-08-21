// api/curva.js — função serverless da Vercel. A curva de juros reais: taxa por
// prazo, hoje, há um mês e há um ano.
import { getCurva } from "../server/datalayer.js";

export default async function handler(req, res) {
  try {
    res.setHeader("Cache-Control", "s-maxage=1800, stale-while-revalidate=7200");
    return res.status(200).json(await getCurva());
  } catch (e) {
    return res.status(502).json({ error: e.message });
  }
}
