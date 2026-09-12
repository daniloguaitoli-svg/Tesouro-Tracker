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

// A inflação implícita (breakeven): o que o mercado precisa que a inflação seja
// para o prefixado empatar com o IPCA+ de mesmo prazo. Acima disso o IPCA+
// ganha, abaixo o prefixado ganha — é a conta que decide entre as duas famílias,
// e o app tinha os dois lados dela sem nunca fazer a subtração.
//
// NÃO é previsão de inflação: embute prêmio de risco (quem compra prefixado
// cobra para assumir o risco) e diferença de liquidez entre os dois papéis. Por
// isso costuma ficar ACIMA da inflação que o mercado de fato espera. A tela diz
// isso — seria fácil e errado apresentar como projeção.
function Implicita({ implicita }) {
  const agora = implicita?.agora || [];
  if (agora.length < 2) return null;

  const series = [
    { id: "1a", pontos: implicita.umAnoAtras, cor: "var(--muted)", tracejado: true },
    { id: "1m", pontos: implicita.umMesAtras, cor: "var(--accent-2)" },
    { id: "agora", pontos: agora, cor: "var(--accent)", forte: true },
  ].filter((s) => s.pontos && s.pontos.length >= 2);

  return (
    <>
      <div className="section-title">Inflação implícita</div>
      <p className="section-sub">
        A inflação que faria o Prefixado empatar com o IPCA+ de mesmo prazo. Acima dela o
        IPCA+ entrega mais; abaixo, o Prefixado.
      </p>

      <div className="card">
        <CurvaChart series={series} height={170} rotulo="Inflação implícita por prazo" />
        <div className="legenda">
          <span><i style={{ background: "var(--accent)" }} />hoje</span>
          <span><i style={{ background: "var(--accent-2)" }} />há um mês</span>
          <span><i style={{ background: "var(--muted)" }} />há um ano</span>
        </div>
      </div>

      <div className="rolagem">
        <table className="tbl">
          <thead>
            <tr>
              <th className="rt">Prazo</th>
              <th className="rt">Nominal</th>
              <th className="rt">Real</th>
              <th className="rt">Implícita</th>
            </tr>
          </thead>
          <tbody>
            {agora.map((p) => (
              <tr key={p.anos}>
                <td className="rt mono">{anos(p.anos)}</td>
                <td className="rt mono">{taxa(p.nominal)}</td>
                <td className="rt mono">{taxa(p.real)}</td>
                <td className="rt mono"><b>{taxa(p.taxa)}</b></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="note">
        Conta pela relação de Fisher — (1+nominal)/(1+real) − 1 — e não pela subtração, que
        nestes níveis erra quase meio ponto. Como LTN e NTN-F vencem em 01/01 e as NTN-B em
        15/05 ou 15/08, não há par exato: a curva real é <strong>interpolada</strong> no prazo
        de cada ponto nominal, e só dentro do intervalo observado — nunca extrapolada.{" "}
        <strong>Não é previsão de inflação:</strong> embute prêmio de risco e diferença de
        liquidez, então tende a ficar acima do que o mercado de fato espera.
      </div>
    </>
  );
}

export function Curva({ marcados }) {
  const [dados, setDados] = useState(null);
  const [erro, setErro] = useState(null);
  const [tentativa, setTentativa] = useState(0);
  const [familiaId, setFamiliaId] = useState("real");

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

  // O ⭐ segue a escolha do usuário (aba Títulos), não o `destaque` do catálogo
  // que veio do servidor — senão a curva marcaria vencimentos diferentes dos
  // que o Painel mostra, e o app se contradiria na cara de quem usa.
  const meu = (p) => ({ ...p, destaque: marcados ? marcados.has(p.slug) : p.destaque });

  // Só oferece famílias que têm pontos (a prefixada fica vazia até a primeira
  // coleta que inclua LTN/NTN-F).
  const disponiveis = (dados.curvas || [])
    .filter((c) => c.agora.length > 0)
    .map((c) => ({ ...c, agora: c.agora.map(meu) }));
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

      <Implicita implicita={dados.implicita} />

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
