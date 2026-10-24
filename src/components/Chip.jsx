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
  const tom = dir === "up" || dir === "down" ? ` chip-${dir}` : "";
  return (
    <span className={`chip${tom}`}>
      {rotulo} <b className={`mono ${dir || ""}`}>{valor}</b>
    </span>
  );
}
