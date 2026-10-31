// components/Chip.jsx — o chip de variação, compartilhado pelo cartão do
// Painel e pelo cabeçalho do Detalhe.
//
// Mora num arquivo só porque os dois lugares precisam dizer a MESMA coisa do
// mesmo jeito: quem abre o detalhe tocando num cartão reencontra "taxa",
// "preço" e "PU" na mesma ordem e com a mesma cor. Duas cópias divergiriam na
// primeira vez que uma delas fosse ajustada.
export function Chip({ rotulo, valor, dir }) {
  // A cor vai só no NÚMERO, nunca no chip inteiro: pintar o rótulo junto faria
  // "preço" parecer ser o que subiu ou caiu.
  // A classe é `pilula`, não `chip`: `chip` é o BOTÃO de seleção (famílias,
  // timeframe, eixo), e as duas regras conviviam no styles.css com a desta
  // aqui vindo depois — sobrescrevendo raio, padding e altura dos botões em
  // silêncio. Os seletores da aba Curva saíam com 25px de alvo, contra os 44
  // mínimos de toque, e só o estado aceso sobrevivia, por especificidade.
  const tom = dir === "up" || dir === "down" ? ` pilula-${dir}` : "";
  return (
    <span className={`pilula${tom}`}>
      {rotulo} <b className={`mono ${dir || ""}`}>{valor}</b>
    </span>
  );
}
