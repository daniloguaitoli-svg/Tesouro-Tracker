// server/catalogo.js — os vencimentos de NTN-B que o app rotula e destaca.
//
// ATENÇÃO a uma diferença em relação aos irmãos (Cana/Café/Soja): aqui o
// catálogo NÃO é a lista fechada do que aparece na tela. O coletor DESCOBRE
// todos os vencimentos de Tesouro IPCA+ presentes no arquivo oficial e guarda
// todos eles. O catálogo serve para:
//
//   1. dar nome, descrição e ordem de exibição aos vencimentos conhecidos;
//   2. marcar quais são acompanhados de perto (`destaque`), que são os que
//      entram no arquivo-ponte e disparam o aviso de "cotação desatualizada".
//
// Por quê: a lista de títulos ofertados muda a cada leilão. Uma lista fixa
// chutada aqui envelheceria e esconderia vencimentos reais. Descobrir do
// arquivo e rotular pelo catálogo dá o melhor dos dois — nada some, e o que
// interessa vem nomeado. Um vencimento fora do catálogo aparece com rótulo
// genérico, nunca com dado inventado.

import { slugDe } from "./util.js";

export const CATEGORIAS = [
  {
    id: "ipca",
    nome: "Tesouro IPCA+ (sem cupom)",
    resumo:
      "Zero-cupom: um único pagamento no vencimento. A duration é igual ao prazo, então é o formato mais sensível a juros — e o mais previsível se levado até o fim.",
  },
  {
    id: "ipca-juros",
    nome: "Tesouro IPCA+ com Juros Semestrais",
    resumo:
      "Paga cupom de 6% a.a. em duas parcelas por ano (15/02 e 15/08, ou 15/05 e 15/11, conforme o vencimento). Como parte do dinheiro volta antes, a duration é bem menor que o prazo.",
  },
];

// `vencimento` em ISO; `destaque` marca as posições acompanhadas de perto.
const ENTRADAS = [
  // --- Zero-cupom (NTN-B Principal) ---
  { tipo: "ipca", vencimento: "2029-05-15" },
  { tipo: "ipca", vencimento: "2030-08-15" },
  { tipo: "ipca", vencimento: "2032-08-15" },
  { tipo: "ipca", vencimento: "2035-05-15", destaque: true },
  { tipo: "ipca", vencimento: "2040-08-15" },
  { tipo: "ipca", vencimento: "2045-05-15" },
  { tipo: "ipca", vencimento: "2050-08-15" },

  // --- Com juros semestrais (NTN-B) ---
  { tipo: "ipca-juros", vencimento: "2032-08-15", destaque: true },
  { tipo: "ipca-juros", vencimento: "2035-05-15", destaque: true },
  { tipo: "ipca-juros", vencimento: "2040-08-15" },
  { tipo: "ipca-juros", vencimento: "2045-05-15" },
  { tipo: "ipca-juros", vencimento: "2050-08-15" },
  { tipo: "ipca-juros", vencimento: "2055-05-15" },
  { tipo: "ipca-juros", vencimento: "2060-08-15" },
];

const rotulo = (tipo, vencimento) => {
  const ano = String(vencimento).slice(0, 4);
  return tipo === "ipca-juros" ? `Tesouro IPCA+ ${ano} (juros semestrais)` : `Tesouro IPCA+ ${ano}`;
};

export const CATALOGO = ENTRADAS.map((e) => ({
  slug: slugDe(e.tipo, e.vencimento),
  tipo: e.tipo,
  vencimento: e.vencimento,
  comCupom: e.tipo === "ipca-juros",
  nome: rotulo(e.tipo, e.vencimento),
  destaque: e.destaque === true,
  periodicidade: "diaria",
  fonte: "Tesouro Nacional (Tesouro Transparente)",
}));

export const porSlug = Object.fromEntries(CATALOGO.map((c) => [c.slug, c]));

// Os vencimentos acompanhados de perto: entram no arquivo-ponte (dados/ntnb.json
// e dados/ntnb.md) e são os que disparam o aviso de preço velho no Painel.
export const DESTAQUES = CATALOGO.filter((c) => c.destaque);

// Rótulo para um vencimento que apareceu no arquivo oficial mas não está no
// catálogo. Sem chute: só o que dá para afirmar a partir do próprio arquivo.
export function rotuloGenerico(tipo, vencimentoISO) {
  return rotulo(tipo, vencimentoISO);
}

// Séries macro do Banco Central (SGS). Contexto para ler a taxa real: a NTN-B
// paga IPCA + taxa real, então o IPCA acumulado e a Selic são a moldura.
export const MACRO = [
  { id: "ipca", serie: 433, nome: "IPCA", descricao: "Variação mensal do IPCA (IBGE), série 433 do SGS.", unidade: "%_MES", periodicidade: "mensal" },
  { id: "selic", serie: 432, nome: "Selic meta", descricao: "Meta da taxa Selic definida pelo Copom, série 432 do SGS.", unidade: "%_ANO", periodicidade: "diaria" },
  { id: "usdbrl", serie: 1, nome: "USD/BRL", descricao: "Dólar PTAX (venda), série 1 do SGS.", unidade: "BRL", periodicidade: "diaria" },
  { id: "eurbrl", serie: 21619, nome: "EUR/BRL", descricao: "Euro PTAX (venda), série 21619 do SGS.", unidade: "BRL", periodicidade: "diaria" },
];

export const macroPorId = Object.fromEntries(MACRO.map((m) => [m.id, m]));
