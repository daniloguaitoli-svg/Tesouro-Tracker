// api/detalhe.js — função serverless da Vercel. Detalhe de um vencimento:
// cabeçalho, série da taxa real no período, estatísticas e o fluxo de caixa
// futuro que explica a duration.
import { getDetalhe } from "../server/datalayer.js";

export default async function handler(req, res) {
  const slug = req.query?.slug;
  if (!slug) return res.status(400).json({ error: "Faltou o parâmetro slug" });
  try {
    res.setHeader("Cache-Control", "s-maxage=1800, stale-while-revalidate=7200");
    return res.status(200).json(await getDetalhe(slug, req.query?.tf || "1A"));
  } catch (e) {
    return res.status(e.status === 404 ? 404 : 502).json({ error: e.message });
  }
}
