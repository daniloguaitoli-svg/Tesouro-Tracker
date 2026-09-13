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
    curto: "IPCA+",
    resumo:
      "Zero-cupom indexado ao IPCA: um único pagamento no vencimento. A duration é igual ao prazo, então é o formato mais sensível a juros — e o mais previsível se levado até o fim.",
  },
  {
    id: "ipca-juros",
    nome: "Tesouro IPCA+ com Juros Semestrais",
    curto: "IPCA+ juros",
    resumo:
      "Paga cupom de 6% a.a. em duas parcelas por ano (15/02 e 15/08, ou 15/05 e 15/11, conforme o vencimento). Como parte do dinheiro volta antes, a duration é bem menor que o prazo.",
  },
  {
    id: "prefixado",
    nome: "Tesouro Prefixado (LTN)",
    curto: "Prefixado",
    resumo:
      "Zero-cupom NOMINAL: a taxa é cheia, sem correção pela inflação. Rende exatamente a taxa contratada se levado ao vencimento — em reais nominais; a inflação do período corre por conta do investidor.",
  },
  {
    id: "prefixado-juros",
    nome: "Tesouro Prefixado com Juros Semestrais (NTN-F)",
    curto: "Prefixado juros",
    resumo:
      "Prefixado que paga cupom de 10% a.a. em duas parcelas por ano (01/01 e 01/07). Taxa nominal; o cupom alto encurta bastante a duration em relação ao prazo.",
  },
  {
    id: "selic",
    nome: "Tesouro Selic (LFT)",
    curto: "Selic",
    resumo:
      "Pós-fixado: acompanha a Selic diária. A \"taxa\" cotada é um pequeno ágio ou deságio sobre a Selic, não uma taxa cheia — e a sensibilidade a juros de mercado é praticamente nula, por isso não há duration aqui.",
  },
];

// `vencimento` em ISO; `destaque` marca as posições acompanhadas de perto.
//
// ESTA LISTA É SOURCED, NÃO CHUTADA: são exatamente os vencimentos IPCA+ vivos
// no arquivo do Tesouro Transparente lido em 21/08/2026. Não invente entradas
// aqui — se um vencimento novo aparecer, o coletor o lista no log como "fora do
// catálogo" e aí sim se acrescenta. Uma entrada para um título que não existe
// nunca quebra nada (some da tela), mas engana quem lê o arquivo.
//
// OS `destaque` ESPELHAM AS ESTRELAS DO APARELHO, conferidas em 22/08/2026:
// IPCA+ 2032, IPCA+ 2035 (ambos zero-cupom), Prefixado 2029 (LTN) e Selic
// 2031. A estrela de verdade mora no localStorage do celular e o servidor
// não a enxerga; esta lista é a cópia dela que o arquivo-ponte publica, para
// o assistente ler as mesmas quatro linhas que aparecem no Painel. Se a
// seleção mudar no celular, mude aqui também — senão a ponte fica contando
// outra história.
//
// A LFT entra de propósito mesmo sem duration (é pós-fixada): a ponte a
// publica com duration null, que é o honesto, e não com um zero.
const ENTRADAS = [
  // --- Zero-cupom (NTN-B Principal) ---
  { tipo: "ipca", vencimento: "2029-05-15" },
  { tipo: "ipca", vencimento: "2032-08-15", destaque: true },
  { tipo: "ipca", vencimento: "2035-05-15", destaque: true },
  { tipo: "ipca", vencimento: "2040-08-15" },
  { tipo: "ipca", vencimento: "2045-05-15" },
  { tipo: "ipca", vencimento: "2050-08-15" },

  // --- Com juros semestrais (NTN-B) ---
  { tipo: "ipca-juros", vencimento: "2030-08-15" },
  { tipo: "ipca-juros", vencimento: "2032-08-15" },
  { tipo: "ipca-juros", vencimento: "2035-05-15" },
  { tipo: "ipca-juros", vencimento: "2037-05-15" },
  { tipo: "ipca-juros", vencimento: "2040-08-15" },
  { tipo: "ipca-juros", vencimento: "2045-05-15" },
  { tipo: "ipca-juros", vencimento: "2050-08-15" },
  { tipo: "ipca-juros", vencimento: "2055-05-15" },
  { tipo: "ipca-juros", vencimento: "2060-08-15" },

  // --- Prefixados (LTN) — vencem em 01/01 ---
  { tipo: "prefixado", vencimento: "2027-01-01" },
  { tipo: "prefixado", vencimento: "2028-01-01" },
  { tipo: "prefixado", vencimento: "2029-01-01", destaque: true },
  { tipo: "prefixado", vencimento: "2031-01-01" },
  { tipo: "prefixado", vencimento: "2032-01-01" },

  // --- Prefixados com juros semestrais (NTN-F) — vencem em 01/01 ---
  { tipo: "prefixado-juros", vencimento: "2027-01-01" },
  { tipo: "prefixado-juros", vencimento: "2029-01-01" },
  { tipo: "prefixado-juros", vencimento: "2031-01-01" },
  { tipo: "prefixado-juros", vencimento: "2033-01-01" },
  { tipo: "prefixado-juros", vencimento: "2035-01-01" },
  { tipo: "prefixado-juros", vencimento: "2037-01-01" },

  // --- Tesouro Selic (LFT) — vencem em 01/03 ---
  { tipo: "selic", vencimento: "2027-03-01" },
  { tipo: "selic", vencimento: "2028-03-01" },
  { tipo: "selic", vencimento: "2029-03-01" },
  { tipo: "selic", vencimento: "2031-03-01", destaque: true },
];

// Data da observação do arquivo oficial que gerou a lista acima.
export const CATALOGO_EM = "2026-08-22"; // NTN-B em 21/08; Prefixado/Selic do log da coleta de 22/08

const rotulo = (tipo, vencimento) => {
  const ano = String(vencimento).slice(0, 4);
  switch (tipo) {
    case "ipca-juros":
      return `Tesouro IPCA+ ${ano} (juros semestrais)`;
    case "ipca":
      return `Tesouro IPCA+ ${ano}`;
    case "prefixado-juros":
      return `Tesouro Prefixado ${ano} (juros semestrais)`;
    case "prefixado":
      return `Tesouro Prefixado ${ano}`;
    case "selic":
      return `Tesouro Selic ${ano}`;
    default:
      return `Tesouro ${ano}`;
  }
};

export const CATALOGO = ENTRADAS.map((e) => ({
  slug: slugDe(e.tipo, e.vencimento),
  tipo: e.tipo,
  vencimento: e.vencimento,
  comCupom: e.tipo === "ipca-juros" || e.tipo === "prefixado-juros",
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
  { id: "cdi", serie: 4389, nome: "CDI", descricao: "Taxa DI anualizada (base 252), série 4389 do SGS.", unidade: "%_ANO", periodicidade: "diaria" },
  { id: "usdbrl", serie: 1, nome: "USD/BRL", descricao: "Dólar PTAX (venda), série 1 do SGS.", unidade: "BRL", periodicidade: "diaria" },
  { id: "eurbrl", serie: 21619, nome: "EUR/BRL", descricao: "Euro PTAX (venda), série 21619 do SGS.", unidade: "BRL", periodicidade: "diaria" },
];

export const macroPorId = Object.fromEntries(MACRO.map((m) => [m.id, m]));

// As bolsas não vêm do SGS do Banco Central como o resto da moldura — vêm do
// Yahoo (server/providers/yahoo.js). Ficam fora de MACRO de propósito: aquela
// lista é "séries do BCB", e misturar as duas faria o loop do getMacro tentar
// buscar um código de série que não existe.
//
// Não diga "fechamento" em lugar nenhum: o Yahoo devolve uma linha para o dia
// corrente antes de o pregão abrir, e durante o pregão o valor é o último
// negociado. A primeira sonda real pegou justamente isso (22/08 às 06:39 de
// Brasília, com variação 0,00% porque o pregão nem tinha começado). Com cinco
// praças em três fusos isso deixa de ser detalhe: quando é meio-dia em São
// Paulo, Amsterdã está fechando e Nova York mal abriu, então as datas das
// linhas legitimamente não batem entre si. Cada linha carrega a SUA data.
export const INDICES = [
  // `casas` é de EXIBIÇÃO e segue o costume de cada praça: o Ibovespa se cota
  // em pontos inteiros ("187.207"), os demais com dois decimais. Um único
  // arredondamento para todos deixaria o AEX (~950) com precisão de menos ou o
  // Ibovespa com uma vírgula que ninguém escreve.
  // `praca` é a CIDADE, curta de propósito: na grade ela divide 132px com a
  // data, e "Euronext (Amsterdã) · 11/09/2026" empurrava a linha para três
  // alturas de texto. O nome da bolsa fica em `bolsa`, que vai na descrição.
  { id: "ibovespa", simbolo: "^BVSP", nome: "Ibovespa", bolsa: "B3", praca: "São Paulo", moeda: "BRL", casas: 0 },
  { id: "sp500", simbolo: "^GSPC", nome: "S&P 500", bolsa: "NYSE/Nasdaq", praca: "Nova York", moeda: "USD", casas: 2 },
  { id: "nasdaq", simbolo: "^IXIC", nome: "Nasdaq Composite", bolsa: "Nasdaq", praca: "Nova York", moeda: "USD", casas: 2 },
  { id: "dowjones", simbolo: "^DJI", nome: "Dow Jones", bolsa: "NYSE", praca: "Nova York", moeda: "USD", casas: 2 },
  { id: "aex", simbolo: "^AEX", nome: "AEX", bolsa: "Euronext", praca: "Amsterdã", moeda: "EUR", casas: 2 },
].map((i) => ({
  ...i,
  descricao: `Índice da ${i.bolsa}, ${i.praca} (${i.simbolo} via Yahoo Finance). Durante o pregão, é o último valor negociado — não o fechamento.`,
  unidade: "PONTOS",
  periodicidade: "diaria",
}));

export const indicePorId = Object.fromEntries(INDICES.map((i) => [i.id, i]));

// O Painel e o getMacro pedem o Ibovespa pelo nome; deriva daqui para não
// existirem duas definições do mesmo índice podendo divergir.
export const IBOVESPA = indicePorId.ibovespa;

// Séries DIÁRIAS de juros (% ao dia), separadas das de MACRO de propósito.
//
// MACRO traz o NÍVEL anualizado (432 Selic meta, 4389 CDI a.a.), que é como se
// cotam essas taxas e o que a tela mostra na coluna "último". Mas a variação de
// uma taxa não é comparável com a de uma bolsa: o que se compara é o RETORNO
// ACUMULADO no período, e para compor isso é preciso a taxa de cada dia. Daí
// as séries 11 e 12. Elas não entram em MACRO porque MACRO alimenta a Moldura
// do Painel, e lá um "CDI 0,0494%" ao lado do IPCA seria só confusão.
export const JUROS_DIARIOS = [
  { id: "selic", serie: 11, nome: "Selic", descricao: "Taxa Selic diária (% a.d.), série 11 do SGS." },
  { id: "cdi", serie: 12, nome: "CDI", descricao: "Taxa DI diária (% a.d.), série 12 do SGS." },
];
