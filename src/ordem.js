// src/ordem.js — por que grandeza a lista de títulos se ordena, e como.
//
// Mora fora do Titulos.jsx por um motivo só: é uma regra com dois jeitos de
// errar em silêncio (linhas sem dado subindo ao topo quando se inverte a
// ordem; uma coluna ordenando no sentido contrário ao que se lê), e num
// arquivo puro, sem JSX, o verificar.mjs consegue exercitá-la em node.
//
// A ORDEM VALE DENTRO DE CADA FAMÍLIA, nunca entre elas — quem garante isso é
// a tela, que chama ordenar() uma vez por família. Uma fila só, da maior taxa
// para a menor, poria um Prefixado a 14% (nominal) acima de um IPCA+ a 7,8%
// (real): a comparação que o app inteiro existe para não fazer.

// AS COLUNAS DA TABELA (tela larga), que são também as chaves de ordenação.
// No celular a lista tem três ordens num seletor; numa mesa há largura para
// uma coluna por grandeza, e o cabeçalho de cada uma ordena por ela — é o
// que qualquer tabela de cotações faz, e dispensa o seletor.
//
// `crescente` diz a direção do PRIMEIRO clique: datas do mais próximo para o
// mais distante, o resto do maior para o menor, que é como cada coluna
// costuma ser lida. O segundo clique inverte.
export const COLUNAS = [
  { id: "vencimento", rotulo: "Vencimento", valor: (t) => t.vencimento, crescente: true },
  { id: "taxa", rotulo: "Taxa", valor: (t) => t.taxa },
  { id: "dia", rotulo: "Dia", dica: "Variação da taxa no dia, em pontos percentuais", valor: (t) => t.variacoes?.["1D"]?.taxaPP ?? null },
  { id: "mes", rotulo: "1 mês", dica: "Variação da taxa em 1 mês, em pontos percentuais", valor: (t) => t.variacoes?.["1M"]?.taxaPP ?? null },
  { id: "pu", rotulo: "PU", dica: "Preço unitário de recompra", valor: (t) => t.pu },
  { id: "duration", rotulo: "Duration", valor: (t) => t.duration?.macaulay ?? null },
  { id: "sens", rotulo: "+1 p.p.", dica: "Variação do preço se a taxa subir 1 ponto percentual", valor: (t) => t.duration?.variacaoPor1pp ?? null },
];

// "variacao" é a ordem do seletor do celular: pelo TAMANHO do movimento do
// dia, não pelo sinal (ver o comentário de cima). Não é coluna da tabela —
// lá "Dia" ordena com sinal, e os dois sentidos estão a um clique.
const CHAVES = {
  ...Object.fromEntries(COLUNAS.map((c) => [c.id, c.valor])),
  variacao: (t) => (t.taxaVarPP == null ? null : Math.abs(t.taxaVarPP)),
};
export const ORDEM_PADRAO = { por: "vencimento", desc: false };

// Sem dado vai para o FIM nos dois sentidos: inverter a ordem não pode
// trazer para o topo as linhas que não têm o número pelo qual se ordena.
export function ordenar(itens, { por, desc }) {
  const chave = CHAVES[por];
  if (!chave) return itens;
  return [...itens].sort((a, b) => {
    const [x, y] = [chave(a), chave(b)];
    if (x == null || y == null) return (x == null) - (y == null);
    const c = x < y ? -1 : x > y ? 1 : 0;
    return desc ? -c : c;
  });
}
