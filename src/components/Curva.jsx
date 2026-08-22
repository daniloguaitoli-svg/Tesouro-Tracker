// components/Curva.jsx — a curva de juros reais: taxa por prazo.
//
// É a leitura que a lista não dá. Comparada com ela mesma há um mês e há um
// ano, mostra se o mercado inteiro repreçou (curva deslocou) ou se mudou a
// relação entre curto e longo (curva mudou de inclinação) — coisas diferentes,
// com consequências diferentes para quem carrega prazo longo.
import { useEffect, useState } from "react";
import { getCurva } from "../api.js";
import { CurvaChart } from "./CurvaChart.jsx";
import { taxa, anos, dataBR } from "../format.js";
import { ErroBox, Skeletons, AguardandoColeta } from "./States.jsx";

export function Curva() {
  const [dados, setDados] = useState(null);
  const [erro, setErro] = useState(null);

  const [tentativa, setTentativa] = useState(0);

  useEffect(() => {
    let vivo = true;
    setErro(null);
    getCurva()
      .then((d) => vivo && setDados(d))
      .catch((e) => vivo && setErro(e.message));
    return () => {
      vivo = false;
    };
  }, [tentativa]);

  if (erro && !dados) return <ErroBox erro={erro} onRetry={() => setTentativa((n) => n + 1)} />;
  if (!dados) return <Skeletons n={3} />;
  if (dados.pendente) return <AguardandoColeta />;

  // Só oferece famílias que têm pontos (a prefixada fica vazia até a primeira
  // coleta que inclua LTN/NTN-F).
  const disponiveis = (dados.curvas || []).filter((c) => c.agora.length > 0);
  const curva = disponiveis.find((c) => c.id === familiaId) || disponiveis[0];
  if (!curva) return <AguardandoColeta />;

  const series = [
    { id: "1a", pontos: curva.umAnoAtras, cor: "var(--muted)", tracejado: true },
    { id: "1m", pontos: curva.umMesAtras, cor: "var(--accent-2)" },
    { id: "agora", pontos: curva.agora, cor: "var(--accent)", forte: true },
  ];

  return (
    <div>
      <div className="section-title">Curva de juros</div>
      <p className="section-sub">
        Taxa por prazo até o vencimento. As duas curvas não se comparam ponto a ponto: a
        diferença entre a nominal e a real é a inflação que o mercado embute.
      </p>
      {disponiveis.length > 1 && (
        <div className="chips" style={{ marginBottom: 8 }}>
          {disponiveis.map((c) => (
            <button key={c.id} className="chip" aria-pressed={curva.id === c.id} onClick={() => setFamiliaId(c.id)}>
              {c.nome}
            </button>
          ))}
        </div>
      )}

      <div className="card">
        <CurvaChart series={series} />
        <div className="legenda">
          <span><i style={{ background: "var(--accent)" }} />hoje</span>
          <span><i style={{ background: "var(--accent-2)" }} />há um mês</span>
          <span><i style={{ background: "var(--muted)" }} />há um ano</span>
        </div>
      </div>

      <div className="section-title">Pontos da curva</div>
      <div className="rolagem">
        <table className="tbl">
          <thead>
            <tr>
              <th>Vencimento</th>
              <th className="rt">Prazo</th>
              <th className="rt">Taxa ({curva.sufixo})</th>
            </tr>
          </thead>
          <tbody>
            {curva.agora.map((p) => (
              <tr key={p.slug}>
                <td>
                  {p.nome} {p.destaque && <span aria-label="acompanhado de perto">⭐</span>}
                  <br />
                  <span className="muted" style={{ fontSize: 11 }}>{dataBR(p.vencimento)}</span>
                </td>
                <td className="rt mono">{anos(p.anos)}</td>
                <td className="rt mono">{taxa(p.taxa)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="note">
        Cada curva mistura títulos com e sem cupom: dois pontos no mesmo prazo podem ter
        taxas diferentes por isso — e as durations serão bem diferentes. {dados.aviso}
      </div>
    </div>
  );
}
