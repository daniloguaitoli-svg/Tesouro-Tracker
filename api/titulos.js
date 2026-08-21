// api/titulos.js — função serverless da Vercel. Lista de todos os vencimentos
// de NTN-B conhecidos, por categoria, já com taxa real, PU e duration.
import { getTitulos } from "../server/datalayer.js";

export default async function handler(req, res) {
  try {
    // A base é coletada duas vezes por dia; meia hora de cache de borda não
    // atrasa nada e poupa o cold start.
    res.setHeader("Cache-Control", "s-maxage=1800, stale-while-revalidate=7200");
    return res.status(200).json(await getTitulos());
  } catch (e) {
    return res.status(502).json({ error: e.message });
  }
}
