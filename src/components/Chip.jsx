// components/Chip.jsx — o chip de variação, compartilhado pelo cartão do
// Painel e pelo cabeçalho do Detalhe.
//
// Mora num arquivo só porque os dois lugares precisam dizer a MESMA coisa do
// mesmo jeito: quem abre o detalhe tocando num cartão reencontra "taxa",
// "preço" e "PU" na mesma ordem e com a mesma cor. Duas cópias divergiriam na
// primeira vez que uma delas fosse ajustada.
import { pp, pct, reais, sinal, sinalTaxa } from "../format.js";

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

// As janelas de variação. Os `id` são os de JANELAS_DO_TITULO em
// server/util.js — duplicados à mão, como tudo que atravessa a linha entre
// server/ e src/, e o verificar.mjs confere que os dois lados batem.
export const PERIODOS = [
  { id: "1D", rotulo: "1 dia", frase: "no dia" },
  { id: "1S", rotulo: "1 semana", frase: "em 1 semana" },
  { id: "1M", rotulo: "1 mês", frase: "em 1 mês" },
];
export const PERIODO_PADRAO = "1D";

// Os três chips de um título — taxa, preço e PU — para a janela escolhida.
// Um componente só para o cartão do Painel e o cabeçalho do Detalhe: a regra
// do cupom (abaixo) tem de valer igual nos dois.
//
// "— cupom" NO LUGAR DO PREÇO: quando um cupom é pago dentro da janela, o PU
// cai o valor dele sem que ninguém tenha perdido nada. O servidor manda o
// preço como null e a data do cupom junto; a tela diz o motivo no próprio
// chip, porque um "—" sozinho leria como dado faltando.
export function ChipsDeVariacao({ t, periodo = PERIODO_PADRAO, comFrase = false }) {
  const v = t.variacoes?.[periodo] ?? null;
  const taxaPP = v?.taxaPP ?? null;
  const puPct = v?.puPct ?? null;
  return (
    <span className="chips">
      <Chip rotulo="taxa" valor={pp(taxaPP)} dir={sinalTaxa(taxaPP)} />
      <Chip rotulo="preço" valor={v?.cupom ? "— cupom" : pct(puPct)} dir={sinal(puPct)} />
      <Chip rotulo="PU" valor={reais(t.pu)} />
      {comFrase && <span className="chips-frase">variação {PERIODOS.find((p) => p.id === periodo)?.frase}</span>}
    </span>
  );
}
