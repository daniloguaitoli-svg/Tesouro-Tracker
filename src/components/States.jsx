// components/States.jsx — estados de carregamento, erro e vazio.

export function Loading({ texto = "Carregando…" }) {
  return (
    <div className="state">
      <div className="spinner" aria-hidden="true" />
      {texto}
    </div>
  );
}

export function Skeletons({ n = 5 }) {
  return (
    <div aria-hidden="true">
      {Array.from({ length: n }).map((_, i) => (
        <div className="skeleton" key={i} />
      ))}
    </div>
  );
}

export function ErroBox({ erro, onRetry }) {
  return (
    <div className="state" role="alert">
      <p>Não foi possível carregar os dados.</p>
      <p className="muted" style={{ fontSize: 12 }}>{String(erro)}</p>
      {onRetry && (
        <button className="btn btn-primary" onClick={onRetry} style={{ marginTop: 12 }}>
          Tentar de novo
        </button>
      )}
    </div>
  );
}

export function Vazio({ texto = "Nada por aqui." }) {
  return <div className="state">{texto}</div>;
}

// Estado específico do "ainda não houve coleta": o repositório sobe com os
// arquivos de dados vazios (sementes), e é o job agendado que os preenche.
// Melhor dizer isso com todas as letras do que mostrar uma tela vazia sem
// explicação.
export function AguardandoColeta() {
  return (
    <div className="state">
      <p><strong>Ainda não há dados coletados.</strong></p>
      <p className="muted" style={{ fontSize: 13, maxWidth: 380, margin: "0 auto" }}>
        A série vem do arquivo oficial do Tesouro Direto, lido uma vez por dia
        pelo job <code>Coletar Tesouro</code> no GitHub Actions. Assim que ele
        rodar pela primeira vez na branch <code>main</code>, os vencimentos
        aparecem aqui.
      </p>
    </div>
  );
}
