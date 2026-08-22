// components/Mercado.jsx — o quadro de juros e câmbio: as três decisões de
// política monetária (Copom, Fed, BCE), o câmbio PTAX e o par CDI × Selic.
//
// As datas dizem "vigente desde" DE PROPÓSITO: o que as séries sabem é o dia
// em que a taxa nova passou a valer, não o dia da reunião — e fingir saber a
// data da reunião seria inventar precisão.
import { useEffect, useState } from "react";
import { getMercado } from "../api.js";
import { Sparkline } from "./Sparkline.jsx";
import { num, pct, pp, dataBR, sinal } from "../format.js";
import { ErroBox, Skeletons } from "./States.jsx";

function CartaoDecisao({ d, taxaPrincipal, detalhe }) {
  if (!d) return null;
  return (
    <div className="card">
      <div className="label">{d.nome}</div>
      <div className="big">{taxaPrincipal}</div>
      <div className="label">{detalhe}</div>
      <div className="label" style={{ marginTop: 6 }}>
        {d.variacaoPP != null && (
          <span className={d.variacaoPP > 0 ? "down" : "up"}>{pp(d.variacaoPP)} </span>
        )}
        {d.vigenteDesde && <>· vigente desde {dataBR(d.vigenteDesde)}</>}
      </div>
      <div className="pricedate" style={{ marginTop: 4 }}>{d.fonte}</div>
    </div>
  );
}

export function Mercado() {
  const [dados, setDados] = useState(null);
  const [erro, setErro] = useState(null);
  const [tentativa, setTentativa] = useState(0);

  useEffect(() => {
    let vivo = true;
    setErro(null);
    getMercado()
      .then((d) => vivo && setDados(d))
      .catch((e) => vivo && setErro(e.message));
    return () => {
      vivo = false;
    };
  }, [tentativa]);

  if (erro && !dados) return <ErroBox erro={erro} onRetry={() => setTentativa((n) => n + 1)} />;
  if (!dados) return <Skeletons n={4} />;

  const { copom, fed, bce } = dados.decisoes || {};
  const { usd, eur } = dados.cambio || {};
  const { cdi, selic } = dados.juros || {};

  return (
    <div>
      <div className="section-title">Política monetária</div>
      <p className="section-sub">
        As três decisões que emolduram qualquer taxa desta tela.
      </p>
      <div className="grid grid-2" style={{ marginTop: 0 }}>
        <CartaoDecisao d={copom} taxaPrincipal={copom ? `${num(copom.taxa)}%` : "—"} detalhe="meta da Selic, a.a." />
        <CartaoDecisao
          d={fed}
          taxaPrincipal={fed ? `${num(fed.limiteInferior)}–${num(fed.limiteSuperior)}%` : "—"}
          detalhe="meta dos Fed Funds, a.a."
        />
        <CartaoDecisao
          d={bce}
          taxaPrincipal={bce ? `${num(bce.deposito)}%` : "—"}
          detalhe={bce ? `depósito · refi ${num(bce.refi)}%` : "depósito"}
        />
        {!fed && !bce && (
          <div className="card">
            <div className="label">Fed e BCE</div>
            <div className="big">—</div>
            <div className="label">
              chegam na próxima coleta agendada (o job grava dados/global.json duas vezes ao dia)
            </div>
          </div>
        )}
      </div>

      <div className="section-title">Câmbio (PTAX)</div>
      <div className="grid grid-2" style={{ marginTop: 0 }}>
        {[["USD/BRL", usd], ["EUR/BRL", eur]].map(([nome, fx]) => (
          <div className="card" key={nome}>
            <div className="label">{nome}</div>
            <div className="big">{fx ? num(fx.valor, 4) : "—"}</div>
            {fx && (
              <>
                <div className={`label ${sinal(fx.changePct)}`}>{pct(fx.changePct)} · {dataBR(fx.data)}</div>
                <Sparkline points={(fx.pontos || []).slice(-60).map((p) => p.close)} width={120} height={26} />
              </>
            )}
          </div>
        ))}
      </div>

      <div className="section-title">CDI × Selic</div>
      <p className="section-sub">
        O CDI anda colado na Selic (um pouco abaixo da meta) — é a referência da renda fixa privada.
      </p>
      <div className="grid grid-2" style={{ marginTop: 0 }}>
        {[["CDI", cdi], ["Selic meta", selic]].map(([nome, j]) => (
          <div className="card" key={nome}>
            <div className="label">{nome}</div>
            <div className="big">{j ? `${num(j.valor)}%` : "—"}</div>
            {j && <div className="label">a.a. · {dataBR(j.data)}</div>}
          </div>
        ))}
      </div>

      <div className="note">{dados.aviso}</div>
    </div>
  );
}
