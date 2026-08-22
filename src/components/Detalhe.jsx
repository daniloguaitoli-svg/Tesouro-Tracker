// components/Detalhe.jsx — tela cheia de um vencimento.
//
// Três blocos, nesta ordem por um motivo: a taxa (o que se lê primeiro), a
// duration (o que a taxa não conta) e o FLUXO DE CAIXA (o que explica a
// duration). Ver as barrinhas dos cupons voltando antes do vencimento é a forma
// mais direta de entender por que um título com cupom tem duration menor que o
// prazo — melhor do que qualquer parágrafo.
import { useEffect, useState } from "react";
import { getDetalhe } from "../api.js";
import { AreaChart } from "./AreaChart.jsx";
import { ErroBox, Loading } from "./States.jsx";
import { taxa, pct, pp, anos, reais, dataBR, num, sinal, sinalTaxa, unidadeTaxa } from "../format.js";

export function Detalhe({ slug, onBack }) {
  const [tf, setTf] = useState("1A");
  const [dados, setDados] = useState(null);
  const [erro, setErro] = useState(null);
  const [tentativa, setTentativa] = useState(0);

  useEffect(() => {
    let vivo = true;
    setErro(null);
    getDetalhe(slug, tf)
      // Mantém o payload anterior visível enquanto a nova janela carrega, para
      // a tela não piscar a cada troca de período.
      .then((d) => vivo && setDados(d))
      .catch((e) => vivo && setErro(e.message));
    return () => {
      vivo = false;
    };
  }, [slug, tf, tentativa]);

  if (erro && !dados) {
    return (
      <div>
        <button className="backlink" onClick={onBack}>← voltar</button>
        <ErroBox erro={erro} onRetry={() => setTentativa((n) => n + 1)} />
      </div>
    );
  }
  if (!dados) {
    return (
      <div>
        <button className="backlink" onClick={onBack}>← voltar</button>
        <Loading />
      </div>
    );
  }

  const t = dados.item;
  const d = t.duration || {};
  const fluxos = dados.fluxos || [];
  const maiorFluxo = fluxos.reduce((m, f) => Math.max(m, f.valor), 0) || 1;

  return (
    <div>
      <button className="backlink" onClick={onBack}>← voltar</button>

      <div className="detail-head">
        <div style={{ flex: 1 }}>
          <div className="label muted">{t.nome}</div>
          <div className="price">{taxa(t.taxa, t.tipo === "selic" ? 4 : 2)}</div>
          <div className="label">
            <strong>{unidadeTaxa(t.tipo)}</strong> · PU {reais(t.pu)}
          </div>
          <div className={`label ${sinalTaxa(t.taxaVarPP)}`}>
            {pp(t.taxaVarPP)} na taxa{" "}
            {t.puVarPct != null && <span className={sinal(t.puVarPct)}>· {pct(t.puVarPct)} no preço</span>}
          </div>
          <div>
            <span className="pill">vence {dataBR(t.vencimento)}</span>
            <span className="pill">
              {t.tipo === "selic" ? "pós-fixado (Selic)" : t.comCupom ? "juros semestrais" : "sem cupom"}
            </span>
            {t.secundario?.taxaIndicativa != null && (
              <span className="pill">ANBIMA {taxa(t.secundario.taxaIndicativa)}</span>
            )}
          </div>
        </div>
      </div>

      <div className="tfrow">
        {dados.timeframes.map((x) => (
          <button key={x} className="chip" aria-pressed={tf === x} onClick={() => setTf(x)}>
            {x}
          </button>
        ))}
      </div>

      <AreaChart points={dados.pontos} campo="taxa" />
      <div className="pricedate" style={{ textAlign: "right" }}>
        taxa real · {dados.pontos.length} pontos até {dataBR(t.data)}
      </div>

      {dados.estatisticas && (
        <div className="statgrid">
          <div className="stat">
            <div className="k">mínima</div>
            <div className="v">{taxa(dados.estatisticas.minima)}</div>
          </div>
          <div className="stat">
            <div className="k">média</div>
            <div className="v">{taxa(dados.estatisticas.media)}</div>
          </div>
          <div className="stat">
            <div className="k">máxima</div>
            <div className="v">{taxa(dados.estatisticas.maxima)}</div>
          </div>
        </div>
      )}

      {t.tipo === "selic" && (
        <div className="note">
          <strong>Por que não há duration aqui.</strong> A LFT é pós-fixada: rende a Selic
          diária até o resgate, então o preço quase não reage a juros de mercado. A taxa
          cotada acima é o pequeno ágio ou deságio sobre a Selic — não uma taxa cheia — e
          pode até ser negativa.
        </div>
      )}

      {d.macaulay != null && (<>
      <div className="section-title">Sensibilidade a juros</div>
      <div className="statgrid">
        <div className="stat">
          <div className="k">duration</div>
          <div className="v">{anos(d.macaulay, 2)}</div>
        </div>
        <div className="stat">
          <div className="k">se +1 p.p.</div>
          <div className={`v ${sinal(d.variacaoPor1pp)}`}>{pct(d.variacaoPor1pp)}</div>
        </div>
        <div className="stat">
          <div className="k">se −1 p.p.</div>
          <div className={`v ${sinal(d.variacaoMenos1pp)}`}>{pct(d.variacaoMenos1pp)}</div>
        </div>
      </div>
      <div className="note">
        Duration de {anos(d.macaulay, 2)} contra um prazo de {anos(t.anosAteVencer, 2)}
        {t.comCupom
          ? " — menor que o prazo porque os cupons devolvem parte do dinheiro antes do vencimento."
          : " — igual ao prazo, porque há um único pagamento, lá no fim."}{" "}
        Duration modificada {num(d.modificada, 2)}: é quanto o preço se move, em %, por ponto
        percentual de taxa. As duas pontas não são simétricas por causa da convexidade
        ({num(d.convexidade, 1)}).
      </div>
      </>)}

      {fluxos.length > 0 && (
        <>
          <div className="section-title">Fluxo de caixa até o vencimento</div>
          <p className="section-sub">
            {fluxos.length} pagamento{fluxos.length > 1 ? "s" : ""} por 100 de valor nominal
            corrigido (VNA). O último traz o principal junto.
          </p>
          <div className="fluxos">
            {fluxos.map((f) => (
              <div className="fluxo" key={f.dataISO}>
                <span className="mono muted">{dataBR(f.dataISO)}</span>
                <span className="barra">
                  <i style={{ width: `${(f.valor / maiorFluxo) * 100}%` }} />
                </span>
                <span className="mono">{num(f.valor)}</span>
              </div>
            ))}
          </div>
        </>
      )}

      {dados.notaHistorico && <div className="note">{dados.notaHistorico}</div>}
      <div className="note">{dados.aviso}</div>
    </div>
  );
}
