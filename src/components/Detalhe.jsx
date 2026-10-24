// components/Detalhe.jsx — tela cheia de um vencimento.
//
// Três blocos, nesta ordem por um motivo: a taxa (o que se lê primeiro), a
// duration (o que a taxa não conta) e o FLUXO DE CAIXA (o que explica a
// duration). Ver as barrinhas dos cupons voltando antes do vencimento é a forma
// mais direta de entender por que um título com cupom tem duration menor que o
// prazo — melhor do que qualquer parágrafo.
import { useEffect, useState } from "react";
import { getDetalhe } from "../api.js";
import { GraficoTaxa } from "./GraficoTaxa.jsx";
import { Chip } from "./Chip.jsx";
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

      <div className="det-cabeca">
        <div className="det-taxa-linha">
          <b className="det-taxa mono">{taxa(t.taxa, t.tipo === "selic" ? 4 : 2)}</b>
          <span className="det-unidade">{unidadeTaxa(t.tipo)}</span>
        </div>

        {/* Os mesmos três chips do cartão do Painel, na mesma ordem: quem
            chegou aqui tocando num cartão reencontra os números onde os
            deixou, em vez de ter de procurá-los noutro arranjo. */}
        <div className="chips">
          <Chip rotulo="taxa" valor={pp(t.taxaVarPP)} dir={sinalTaxa(t.taxaVarPP)} />
          <Chip rotulo="preço" valor={pct(t.puVarPct)} dir={sinal(t.puVarPct)} />
          <Chip rotulo="PU" valor={reais(t.pu)} />
        </div>

        <div className="det-sub">
          {t.tipo === "selic" ? "Pós-fixado (Selic)" : t.comCupom ? "Juros semestrais" : "Sem cupom"} · vence{" "}
          {dataBR(t.vencimento)} · preço de {dataBR(t.data)}
          {t.secundario?.taxaIndicativa != null && <> · ANBIMA {taxa(t.secundario.taxaIndicativa)}</>}
        </div>
      </div>

      <div className="tfrow">
        {dados.timeframes.map((x) => (
          <button key={x} className="chip" aria-pressed={tf === x} onClick={() => setTf(x)}>
            {x}
          </button>
        ))}
      </div>

      <GraficoTaxa
        pontos={dados.pontos}
        media={dados.estatisticas?.media ?? null}
        rotulo={`${t.nome}: taxa de ${taxa(dados.estatisticas?.minima)} a ${taxa(dados.estatisticas?.maxima)} no período, média ${taxa(dados.estatisticas?.media)}, hoje ${taxa(t.taxa)}`}
      />
      <div className="pricedate" style={{ textAlign: "right" }}>
        {unidadeTaxa(t.tipo)} · {dados.pontos.length} pontos até {dataBR(t.data)}
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

      {d.macaulay != null && (
        <>
          <div className="section-title">Se a taxa mudar…</div>
          {/* Quatro cenários em vez de dois: ±1 p.p. sozinho não mostra que a
              reação é assimétrica, e é a assimetria que importa aqui — a queda
              de 2 p.p. ganha mais do que a alta de 2 p.p. tira. Os quatro vêm
              do servidor (ver calcularDuration), nunca de dobrar o ±1 na tela:
              a convexidade entra ao quadrado e dobrar exageraria a perda. */}
          <div className="cenarios">
            {[
              ["−2 p.p.", d.variacaoMenos2pp],
              ["−1 p.p.", d.variacaoMenos1pp],
              ["+1 p.p.", d.variacaoPor1pp],
              ["+2 p.p.", d.variacaoPor2pp],
            ].map(([rotulo, v]) => (
              <div key={rotulo}>
                <div className="cen-rotulo mono">{rotulo}</div>
                <div className={`cen-valor mono ${sinal(v)}`}>{pct(v)}</div>
              </div>
            ))}
          </div>
          <p className="section-sub">
            Variação no <strong>preço de mercado</strong>. Levado até o vencimento, você recebe{" "}
            {unidadeTaxa(t.tipo)} {taxa(t.taxa)} de qualquer forma.
          </p>
          <div className="det-metricas">
            <span>
              duration <b className="mono">{anos(d.macaulay)}</b>
            </span>
            <span>
              modificada <b className="mono">{num(d.modificada, 2)}</b>
            </span>
            <span>
              convexidade <b className="mono">{num(d.convexidade, 1)}</b>
            </span>
          </div>
          <div className="note">
            Duration de {anos(d.macaulay)} contra um prazo de {anos(t.anosAteVencer)}
            {t.comCupom
              ? " — menor que o prazo porque os cupons devolvem parte do dinheiro antes do vencimento."
              : " — igual ao prazo, porque há um único pagamento, lá no fim."}{" "}
            A duration modificada é quanto o preço se move, em %, por ponto percentual de taxa;
            as duas pontas não são simétricas por causa da convexidade.
          </div>
        </>
      )}

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

      {/* O aviso recolhido, não escondido: ele é a mesma frase em todas as
          telas e, aberto por extenso no fim de cada uma, vira texto que
          ninguém lê. Dobrado atrás de "Fontes e método" continua a um toque,
          e `details` já é acessível por teclado sem JS nenhum. */}
      <details className="fontes">
        <summary>Fontes e método</summary>
        <p>{dados.aviso}</p>
      </details>
    </div>
  );
}
