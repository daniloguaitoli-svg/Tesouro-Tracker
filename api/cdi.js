// api/cdi.js — função serverless da Vercel. O CDI acumulado dia a dia, como
// índice, para a Carteira comparar cada compra com o CDI do mesmo período.
//
// SEM PARÂMETROS, de propósito: a data de cada compra fica no aparelho. O
// servidor manda a série inteira e a conta é feita lá.
import { getCdi } from "../server/datalayer.js";

export default async function handler(req, res) {
  try {
    // O CDI de um dia sai no dia útil seguinte: uma hora de cache é folga.
    res.setHeader("Cache-Control", "s-maxage=3600, stale-while-revalidate=21600");
    return res.status(200).json(await getCdi());
  } catch (e) {
    return res.status(e.status || 502).json({ error: e.message });
  }
}
