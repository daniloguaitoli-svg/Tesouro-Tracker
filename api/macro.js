// api/macro.js — função serverless da Vercel. IPCA, Selic e câmbio (PTAX) do
// Banco Central: a moldura para ler a taxa real.
import { getMacro } from "../server/datalayer.js";

export default async function handler(req, res) {
  try {
    // Séries diárias/mensais do BCB: uma hora de cache é folgado.
    res.setHeader("Cache-Control", "s-maxage=3600, stale-while-revalidate=21600");
    return res.status(200).json(await getMacro());
  } catch (e) {
    return res.status(502).json({ error: e.message });
  }
}
