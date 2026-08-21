// src/format.js — formatação pt-BR de números, taxas e datas.

const nf = (min, max) => new Intl.NumberFormat("pt-BR", { minimumFractionDigits: min, maximumFractionDigits: max });
const nf2 = nf(2, 2);
const nf3 = nf(2, 3);
const nf4 = nf(2, 4);

export function num(v, casas = 2) {
  if (v == null || !Number.isFinite(v)) return "—";
  return (casas >= 4 ? nf4 : casas === 3 ? nf3 : nf2).format(v);
}

export function reais(v, casas = 2) {
  if (v == null || !Number.isFinite(v)) return "—";
  return `R$ ${num(v, casas)}`;
}

// Taxa real ao ano. O sufixo "% a.a." é sempre explícito porque a taxa da NTN-B
// é REAL (acima do IPCA) — omitir a unidade convida ao erro de lê-la como
// nominal.
export function taxa(v, casas = 2) {
  if (v == null || !Number.isFinite(v)) return "—";
  return `${num(v, casas)}%`;
}

// Percentual com sinal (variação de preço).
export function pct(v, casas = 2) {
  if (v == null || !Number.isFinite(v)) return "—";
  return `${v > 0 ? "+" : ""}${num(v, casas)}%`;
}

// Variação de TAXA se mede em pontos percentuais, não em porcentagem: sair de
// 6,00% para 6,10% é +0,10 p.p. (e não +1,67%).
export function pp(v, casas = 2) {
  if (v == null || !Number.isFinite(v)) return "—";
  return `${v > 0 ? "+" : ""}${num(v, casas)} p.p.`;
}

export function anos(v, casas = 1) {
  if (v == null || !Number.isFinite(v)) return "—";
  return `${num(v, casas)} a`;
}

export function sinal(v) {
  if (v == null || !Number.isFinite(v) || v === 0) return "flat";
  return v > 0 ? "up" : "down";
}

// Para a TAXA, o sinal semântico é invertido em relação ao preço: taxa subindo
// é preço caindo. Quem compra hoje ganha com taxa alta, quem já tem posição
// perde. Aqui a cor segue o PREÇO (a marcação a mercado da posição), que é o
// que o app mostra ao lado.
export function sinalTaxa(v) {
  if (v == null || !Number.isFinite(v) || v === 0) return "flat";
  return v > 0 ? "down" : "up";
}

// "2026-08-20T22:04..." ou "2026-08-20" -> "20/08/2026"
export function dataBR(iso) {
  if (!iso) return "";
  const d = String(iso).slice(0, 10).split("-");
  if (d.length !== 3) return String(iso);
  return `${d[2]}/${d[1]}/${d[0]}`;
}

export function dataCurtaBR(iso) {
  const cheia = dataBR(iso);
  return cheia ? cheia.slice(0, 5) : "";
}

export function horaBR(iso) {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo" });
  } catch {
    return "";
  }
}

// Rótulo da periodicidade, para explicar por que um número "parado" é normal.
// DUPLICADO DE PROPÓSITO: espelha ROTULO_PERIODICIDADE em server/util.js.
// server/ e src/ nunca se importam (o cliente só vê JSON), então os dois lados
// são copiados à mão — e scripts/verificar.mjs confere que continuam iguais.
export const PERIODICIDADE = { diaria: "diário", mensal: "mensal" };

// Normaliza texto para busca: sem acento, minúsculo. Assim "2035" acha o de
// 2035 e "juros" acha os com cupom, mesmo digitado sem acentuação.
export function normalizarBusca(txt) {
  return String(txt ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}
