// components/Seletor.jsx — uma escolha entre poucas posições, com rótulo.
//
// POR QUE EXISTE: os filtros por família eram seis chips numa lista plana
// (IPCA+, IPCA+ juros, Prefixado, Prefixado juros, Selic, todas), quebrando em
// duas linhas. Só que aquelas seis opções respondem a DUAS perguntas — qual
// indexação, e com ou sem cupom — e a lista plana escondia isso. Duas peças
// segmentadas, cada uma com o nome da sua pergunta, mostram a estrutura e
// cabem numa largura só.
//
// O mesmo desenho serve o seletor de eixo da Curva (prazo × duration). O que
// separa "qual curva" de "com que régua" agora é o LUGAR, não o formato: o
// eixo mora dentro do cartão do gráfico, os filtros ficam acima dele.
//
// Também serve uma pergunta só, com poucas respostas: qual das três curvas
// da B3. Os chips (`.chip`) ficaram para a lista que não cabe numa peça — as
// seis variações da Calculadora.
//
// Botões com aria-pressed, como os chips e as estrelas do app, e não um
// radiogroup: um radiogroup promete navegação pelas setas, e prometer o que
// não se entrega é pior para quem usa leitor de tela do que não prometer.
import { useId } from "react";

// `opcoes`: [{ id, rotulo, desabilitada? }]. Uma opção desabilitada fica
// visível e apagada, em vez de sumir: a peça não muda de largura nem de
// ordem, e a posição é o que se usa para achar uma opção sem ler o rótulo.
// `children` entra na mesma linha, depois da peça — é onde mora o ⓘ que
// explica a escolha, colado a ela (o do eixo da Curva).
export function Seletor({ rotulo, opcoes, valor, onChange, compacto = false, children }) {
  const id = useId();
  return (
    <div className={compacto ? "seletor compacto" : "seletor"}>
      <span className="seletor-rotulo" id={id}>{rotulo}</span>
      <div className="seletor-pecas" role="group" aria-labelledby={id}>
        {opcoes.map((o) => (
          <button
            key={o.id}
            type="button"
            aria-pressed={valor === o.id}
            disabled={o.desabilitada}
            onClick={() => onChange(o.id)}
          >
            <span className="seletor-texto">{o.rotulo}</span>
          </button>
        ))}
      </div>
      {children}
    </div>
  );
}
