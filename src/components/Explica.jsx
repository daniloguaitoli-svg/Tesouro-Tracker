// components/Explica.jsx — o ⓘ que abre a explicação de uma parte da tela.
//
// POR QUE EXISTE: o texto explicativo do app é importante e poluía a tela. No
// Mercado, uma nota única de 2.067 caracteres no fim da aba explicava quatro
// tabelas diferentes, longe de todas elas. A divisão agora é:
//
//   - fica NA TELA, em uma linha: a ressalva que muda a leitura de um número
//     (sem ela, alguém lê "+9,4%" no CDI como variação da taxa);
//   - vai para o ⓘ: método, definição e o porquê das escolhas.
//
// O ⓘ fica SEMPRE colado ao que explica — na linha do título da seção, não no
// fim da página. Pode haver vários por tela; o que não pode é um ⓘ longe do
// seu contexto, que obriga a ler a explicação sem ver a coisa explicada.
//
// O ÍCONE É DESENHADO, não o caractere "ⓘ": cada sistema desenha o caractere
// de um jeito (é a mesma razão por que o ícone do app deixou de ser emoji).
//
// A folha do "Mais" (Tabs.jsx) não serviu de base: o CSS dela só existe na
// faixa de celular, e ela não move o foco. Aqui o foco entra na folha ao abrir
// e volta ao ⓘ ao fechar — sem isso, quem navega por teclado ou leitor de tela
// abre a explicação e se perde na página de trás.
//
// A FOLHA VAI PARA O <body> por portal. Renderizada no lugar, ela herdava o
// estilo de quem a contém — no título da seção, o corpo inteiro saía em
// maiúsculas espaçadas; no rodapé, em letra miúda e apagada.
import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";

function IconeInfo() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <line x1="12" y1="11" x2="12" y2="16.5" />
      <circle cx="12" cy="7.6" r="0.6" fill="currentColor" stroke="none" />
    </svg>
  );
}

// `titulo` nomeia a folha e o botão para o leitor de tela ("Como ler:
// Câmbio"). `rotulo`, quando existe, aparece ao lado do ícone — é o caso do
// "Fontes" do rodapé, onde um ícone sozinho não diria do que se trata.
export function Explica({ titulo, rotulo, children }) {
  const [aberta, setAberta] = useState(false);
  const idTitulo = useId();
  const gatilho = useRef(null);
  const fechar = useRef(null);
  const jaAbriu = useRef(false);

  useEffect(() => {
    if (aberta) {
      jaAbriu.current = true;
      fechar.current?.focus();
      const aoTeclar = (e) => e.key === "Escape" && setAberta(false);
      window.addEventListener("keydown", aoTeclar);
      return () => window.removeEventListener("keydown", aoTeclar);
    }
    // Devolve o foco só depois de ter aberto ao menos uma vez — senão a
    // montagem da página roubaria o foco para o primeiro ⓘ da tela.
    if (jaAbriu.current) gatilho.current?.focus();
  }, [aberta]);

  return (
    <>
      <button
        ref={gatilho}
        type="button"
        className={rotulo ? "explica-botao com-rotulo" : "explica-botao"}
        aria-label={rotulo ? undefined : `Como ler: ${titulo}`}
        aria-haspopup="dialog"
        aria-expanded={aberta}
        onClick={() => setAberta(true)}
      >
        {rotulo && <span>{rotulo}</span>}
        <IconeInfo />
      </button>

      {aberta && createPortal(
        <div className="explica-fundo" onClick={() => setAberta(false)}>
          <div
            className="explica"
            role="dialog"
            aria-modal="true"
            aria-labelledby={idTitulo}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="explica-cabeca">
              <span id={idTitulo} className="explica-titulo">{titulo}</span>
              <button ref={fechar} type="button" className="explica-fechar" aria-label="Fechar" onClick={() => setAberta(false)}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                  <line x1="6" y1="6" x2="18" y2="18" />
                  <line x1="18" y1="6" x2="6" y2="18" />
                </svg>
              </button>
            </div>
            <div className="explica-corpo">{children}</div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
