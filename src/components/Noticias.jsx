// components/Noticias.jsx — manchetes de mercado por região.
//
// Manchete é CONTEXTO, não dado: vem por RSS (Google News), cada link leva à
// fonte original, e uma região fora do ar não derruba as outras. A tela diz de
// onde vem e não finge curadoria.
import { useEffect, useState } from "react";
import { getNoticias } from "../api.js";
import { relativoBR } from "../format.js";
import { ErroBox, Skeletons, Vazio } from "./States.jsx";

export function Noticias() {
  const [dados, setDados] = useState(null);
  const [erro, setErro] = useState(null);
  const [tentativa, setTentativa] = useState(0);

  useEffect(() => {
    let vivo = true;
    setErro(null);
    getNoticias()
      .then((d) => vivo && setDados(d))
      .catch((e) => vivo && setErro(e.message));
    return () => {
      vivo = false;
    };
  }, [tentativa]);

  if (erro && !dados) return <ErroBox erro={erro} onRetry={() => setTentativa((n) => n + 1)} />;
  if (!dados) return <Skeletons n={6} />;
  if (dados.pendente) return <Vazio texto="Nenhuma manchete disponível agora — as fontes de notícias podem estar fora do ar." />;

  return (
    <div>
      {dados.regioes.map((r) => (
        <section key={r.id}>
          <div className="section-title">{r.nome}</div>
          {r.itens.length === 0 && (
            <p className="section-sub">Sem manchetes desta região agora{r.erro ? " (fonte indisponível)" : ""}.</p>
          )}
          {r.itens.map((n) => (
            <a className="row" key={n.url} href={n.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none" }}>
              <div className="rowmain">
                <div className="rowname" style={{ whiteSpace: "normal" }}>{n.titulo}</div>
                <div className="rowsub">
                  {n.fonte || "fonte no link"} {n.data && <>· {relativoBR(n.data)}</>}
                </div>
              </div>
              <span className="muted" aria-hidden="true">↗</span>
            </a>
          ))}
        </section>
      ))}
      <div className="note">
        {dados.fonte} Manchetes são contexto, não recomendação; a seleção é do agregador, não deste app.
      </div>
    </div>
  );
}
