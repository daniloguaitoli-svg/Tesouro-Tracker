// components/MarcaIcone.jsx — o ícone da marca, desenhado.
//
// Era o emoji 🏛️, e emoji não é desenho nosso: cada sistema tem o seu (colorido
// na Apple, chapado no Android, ausente em parte dos Linux), então a marca
// mudava de cara conforme o aparelho — e no atalho da tela inicial ela É o app.
//
// O mesmo desenho existe em public/icone.svg para o favicon e o manifest. Lá
// as cores são literais, porque um arquivo servido solto não enxerga as custom
// properties; aqui são tokens. Se mexer na forma, mexa nos dois.
export function MarcaIcone({ tamanho = 30 }) {
  return (
    <svg
      className="marca-icone"
      width={tamanho}
      height={tamanho}
      viewBox="0 0 30 30"
      aria-hidden="true"
      focusable="false"
    >
      <rect x="1" y="1" width="28" height="28" rx="8" fill="var(--surface-2)" stroke="var(--line)" />
      <g stroke="var(--accent)" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round">
        <path d="M15 6l8 4H7z" />
        <path d="M8 11h14M9 21h12M7 23.5h16" />
        <path d="M10 11v10M15 11v10M20 11v10" />
      </g>
    </svg>
  );
}
