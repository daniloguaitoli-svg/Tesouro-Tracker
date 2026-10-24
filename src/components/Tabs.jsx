// components/Tabs.jsx — navegação entre as telas, em duas formas:
//
// - `Tabs`: a tira de abas no topo, usada em telas largas (≥ 720px).
// - `BarraInferior`: a barra fixa no rodapé, usada no celular. Sete abas não
//   cabem lado a lado em 390px — a tira cortava "Calculadora" sem nenhum sinal
//   de que rolava. A barra mostra as quatro telas de consulta diária e junta
//   as demais em "Mais", que abre uma folha com a lista.
//
// As duas ficam no DOM o tempo todo; é o CSS (media query) que esconde uma ou
// outra. `display: none` também as tira da árvore de acessibilidade, então o
// leitor de tela só encontra a que está visível. A tira mantém `role="tab"`
// (o teste de fumaça procura as abas por ele); a barra usa botões simples com
// `aria-current`, para não haver duas tablists com os mesmos nomes.
import { useEffect, useState } from "react";

export function Tabs({ value, onChange, tabs }) {
  return (
    <div className="tabs" role="tablist" aria-label="Seções">
      {tabs.map((t) => (
        <button key={t.id} role="tab" aria-selected={value === t.id} className="tab" onClick={() => onChange(t.id)}>
          {t.label}
        </button>
      ))}
    </div>
  );
}

// Ícones de traço, no mesmo peso, herdando a cor do texto (currentColor).
const ICONES = {
  painel: (
    <>
      <rect x="3" y="3" width="7" height="9" rx="1.5" />
      <rect x="14" y="3" width="7" height="5" rx="1.5" />
      <rect x="14" y="12" width="7" height="9" rx="1.5" />
      <rect x="3" y="16" width="7" height="5" rx="1.5" />
    </>
  ),
  titulos: <path d="M8 6h13M8 12h13M8 18h13M3.5 6h.01M3.5 12h.01M3.5 18h.01" />,
  curva: <path d="M3 20h18M4 16c3-6 6-9 9-9s5 2 7 4" />,
  mercado: <path d="M3 17l5-5 4 3 8-8M15 7h5v5" />,
  calculadora: (
    <>
      <rect x="5" y="3" width="14" height="18" rx="2" />
      <path d="M8 7h8M8 12h.01M12 12h.01M16 12h.01M8 16h.01M12 16h.01M16 16h.01" />
    </>
  ),
  noticias: <path d="M5 4h11v16H6a2 2 0 0 1-2-2V5a1 1 0 0 1 1-1zM16 8h3a1 1 0 0 1 1 1v9a2 2 0 0 1-4 0M8 8h5M8 12h5M8 16h3" />,
  alertas: <path d="M6 16V11a6 6 0 1 1 12 0v5l2 2H4zM10 21h4" />,
  mais: (
    <>
      <circle cx="5" cy="12" r="1.3" />
      <circle cx="12" cy="12" r="1.3" />
      <circle cx="19" cy="12" r="1.3" />
    </>
  ),
};

function Icone({ id }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {ICONES[id]}
    </svg>
  );
}

// Quantas abas cabem na barra antes do "Mais". Quatro + "Mais" = cinco alvos
// de ~78px em 390px, folgados acima dos 44px mínimos de toque.
const NA_BARRA = 4;

export function BarraInferior({ value, onChange, tabs }) {
  const [folhaAberta, setFolhaAberta] = useState(false);
  const principais = tabs.slice(0, NA_BARRA);
  const extras = tabs.slice(NA_BARRA);
  const extraAtiva = extras.find((t) => t.id === value);

  // Esc fecha a folha. O ouvinte só existe enquanto ela está aberta.
  useEffect(() => {
    if (!folhaAberta) return;
    const aoTeclar = (e) => e.key === "Escape" && setFolhaAberta(false);
    window.addEventListener("keydown", aoTeclar);
    return () => window.removeEventListener("keydown", aoTeclar);
  }, [folhaAberta]);

  const ir = (id) => {
    setFolhaAberta(false);
    onChange(id);
  };

  return (
    <>
      {folhaAberta && (
        <div className="folha-fundo" onClick={() => setFolhaAberta(false)}>
          <div className="folha" role="dialog" aria-label="Mais seções" onClick={(e) => e.stopPropagation()}>
            {extras.map((t) => (
              <button key={t.id} className="folha-item" aria-current={value === t.id ? "page" : undefined} onClick={() => ir(t.id)}>
                <Icone id={t.id} />
                {t.label}
              </button>
            ))}
          </div>
        </div>
      )}

      <nav className="barra-inferior" aria-label="Seções">
        {principais.map((t) => (
          <button key={t.id} className="barra-item" aria-current={value === t.id ? "page" : undefined} onClick={() => ir(t.id)}>
            <Icone id={t.id} />
            <span>{t.label}</span>
          </button>
        ))}
        {extras.length > 0 && (
          <button
            className="barra-item"
            aria-current={extraAtiva ? "page" : undefined}
            aria-expanded={folhaAberta}
            aria-haspopup="dialog"
            onClick={() => setFolhaAberta((a) => !a)}
          >
            <Icone id={extraAtiva ? extraAtiva.id : "mais"} />
            {/* Numa tela do "Mais", o botão leva o nome dela — senão a pessoa
                não vê em lugar nenhum onde está. */}
            <span>{extraAtiva ? extraAtiva.label : "Mais"}</span>
          </button>
        )}
      </nav>
    </>
  );
}
