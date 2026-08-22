// components/Painel.jsx — a primeira tela: os vencimentos acompanhados de
// perto, a moldura macro e o aviso de dado velho.
//
// A escolha de destaque é deliberada: a taxa real grande, e logo abaixo a
// duration e o "±1 p.p.". Só a taxa não diz o que uma mudança de juros faz com
// a posição — é a duration que responde isso, e é ela que interessa em um
// horizonte longo.
import { taxa, pct, pp, anos, reais, dataBR, sinal, sinalTaxa, num, unidadeTaxa } from "../format.js";
import { AguardandoColeta } from "./States.jsx";

function CartaoTitulo({ t, onOpen }) {
  return (
    <button className="card" onClick={() => onOpen(t.slug)} style={{ textAlign: "left", cursor: "pointer", font: "inherit", color: "inherit" }}>
      <div className="label">{t.nome}</div>
      <div className="big">
        {taxa(t.taxa)} <span className="unit">{unidadeTaxa(t.tipo)}</span>
      </div>
      <div className={`delta ${sinalTaxa(t.taxaVarPP)}`}>
        {pp(t.taxaVarPP)} na taxa {t.puVarPct != null && <span className={sinal(t.puVarPct)}>· {pct(t.puVarPct)} no preço</span>}
      </div>
      <div className="durbar">
        <span className="label" style={{ minWidth: 74 }}>duration {anos(t.duration?.macaulay)}</span>
        <span className="trilho">
          {/* Escala até 20 anos: cobre de uma NTN-B curta à 2060 com cupom. */}
          <i className="forte" style={{ width: `${Math.min(100, ((t.duration?.macaulay ?? 0) / 20) * 100)}%` }} />
        </span>
      </div>
      <div className="label" style={{ marginTop: 6 }}>
        se a taxa subir 1 p.p.: <span className={sinal(t.duration?.variacaoPor1pp)}>{pct(t.duration?.variacaoPor1pp)}</span> no preço
      </div>
      <div className="pricedate" style={{ marginTop: 6 }}>
        PU {reais(t.pu)} · {dataBR(t.data)}
        {t.desatualizado && <span className="stale" style={{ marginLeft: 6 }}>desatualizado</span>}
      </div>
    </button>
  );
}

function Macro({ macro }) {
  const ind = macro?.indicadores || {};
  const ipca = ind.ipca;
  const selic = ind.selic;
  const usd = ind.usdbrl;
  const eur = ind.eurbrl;
  if (!ipca && !selic && !usd && !eur) return null;
  return (
    <>
      <div className="section-title">Moldura</div>
      <p className="section-sub">
        A NTN-B paga IPCA <em>mais</em> a taxa real. Estes números são o outro lado da conta.
      </p>
      <div className="grid grid-2" style={{ marginTop: 0 }}>
        {ipca && (
          <div className="card">
            <div className="label">IPCA acumulado 12 meses</div>
            <div className="big">{ipca.acumulado12m != null ? `${num(ipca.acumulado12m)}%` : "—"}</div>
            <div className="label">último mês {num(ipca.valor)}% · {dataBR(ipca.data)}</div>
          </div>
        )}
        {selic && (
          <div className="card">
            <div className="label">Selic meta</div>
            <div className="big">{num(selic.valor)}%</div>
            <div className="label">a.a. · {dataBR(selic.data)}</div>
          </div>
        )}
        {ind.cdi && (
          <div className="card">
            <div className="label">CDI</div>
            <div className="big">{num(ind.cdi.valor)}%</div>
            <div className="label">a.a. · {dataBR(ind.cdi.data)}</div>
          </div>
        )}
        {usd && (
          <div className="card">
            <div className="label">USD/BRL (PTAX)</div>
            <div className="big">{num(usd.valor, 4)}</div>
            <div className={`label ${sinal(usd.changePct)}`}>{pct(usd.changePct)} · {dataBR(usd.data)}</div>
          </div>
        )}
        {eur && (
          <div className="card">
            <div className="label">EUR/BRL (PTAX)</div>
            <div className="big">{num(eur.valor, 4)}</div>
            <div className={`label ${sinal(eur.changePct)}`}>{pct(eur.changePct)} · {dataBR(eur.data)}</div>
          </div>
        )}
      </div>
    </>
  );
}

export function Painel({ dados, onOpen }) {
  if (dados.pendente) return <AguardandoColeta />;
  const destaques = dados.destaques || [];

  return (
    <div>
      {dados.desatualizados?.length > 0 && (
        <div className="stale-banner" role="status">
          <span aria-hidden="true">⚠</span>
          <span>
            <b>Cotações desatualizadas:</b> {dados.desatualizados.join(", ")}. O arquivo do
            Tesouro é diário e só sai em dia útil — se persistir, confira o job de coleta.
          </span>
        </div>
      )}

      <div className="section-title">Acompanhados de perto</div>
      {destaques.length === 0 ? (
        <p className="section-sub">
          Nenhum vencimento marcado como destaque foi encontrado no arquivo. Marque os que
          interessam em <code>server/catalogo.js</code>.
        </p>
      ) : (
        <div className="grid grid-2" style={{ marginTop: 0 }}>
          {destaques.map((t) => (
            <CartaoTitulo key={t.slug} t={t} onOpen={onOpen} />
          ))}
        </div>
      )}

      <Macro macro={dados.macro} />
    </div>
  );
}
