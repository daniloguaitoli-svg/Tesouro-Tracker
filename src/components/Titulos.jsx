// components/Titulos.jsx — todos os vencimentos, agrupados por família.
//
// A linha mostra taxa E duration lado a lado de propósito: são os dois eixos da
// decisão. Duas NTN-B com a mesma taxa e durations diferentes não são o mesmo
// investimento.
import { useMemo, useState } from "react";
import { taxa, pp, anos, reais, dataBR, sinalTaxa, normalizarBusca } from "../format.js";
import { Sparkline } from "./Sparkline.jsx";
import { AguardandoColeta, Vazio } from "./States.jsx";

function Linha({ t, onOpen }) {
  return (
    <button className="row" onClick={() => onOpen(t.slug)}>
      <div className="rowmain">
        <div className="rowname">
          {t.nome} {!t.noCatalogo && <span className="muted" title="Vencimento presente no arquivo mas ainda sem entrada no catálogo">·</span>}
        </div>
        <div className="rowsub">
          vence {dataBR(t.vencimento)} · duration {anos(t.duration?.macaulay)}
          {t.desatualizado && <span className="stale" style={{ marginLeft: 6 }}>desatualizado</span>}
        </div>
      </div>
      <Sparkline points={t.spark} inverter />
      <div className="rowprice">
        <div className="p">{taxa(t.taxa)}</div>
        <div className={`d ${sinalTaxa(t.taxaVarPP)}`}>{pp(t.taxaVarPP)}</div>
        <div className="sub">{reais(t.pu)}</div>
      </div>
    </button>
  );
}

export function Titulos({ dados, onOpen }) {
  const [busca, setBusca] = useState("");
  const [familia, setFamilia] = useState("todas");

  const categorias = dados.categorias || [];
  const filtradas = useMemo(() => {
    const q = normalizarBusca(busca);
    return categorias
      .filter((c) => familia === "todas" || c.id === familia)
      .map((c) => ({
        ...c,
        itens: c.itens.filter((t) => !q || normalizarBusca(`${t.nome} ${t.vencimento}`).includes(q)),
      }))
      .filter((c) => c.itens.length > 0);
  }, [categorias, busca, familia]);

  if (dados.pendente) return <AguardandoColeta />;

  return (
    <div>
      <div className="controls">
        <input
          className="input"
          type="search"
          placeholder="Buscar por ano ou nome…"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          aria-label="Buscar vencimento"
        />
      </div>
      <div className="chips">
        <button className="chip" aria-pressed={familia === "todas"} onClick={() => setFamilia("todas")}>
          todas
        </button>
        {categorias.map((c) => (
          <button key={c.id} className="chip" aria-pressed={familia === c.id} onClick={() => setFamilia(c.id)}>
            {c.id === "ipca-juros" ? "com juros" : "sem cupom"}
          </button>
        ))}
      </div>

      {filtradas.length === 0 && <Vazio texto="Nenhum vencimento com esse filtro." />}

      {filtradas.map((c) => (
        <section key={c.id}>
          <div className="section-title">{c.nome}</div>
          <p className="section-sub">{c.resumo}</p>
          {c.itens.map((t) => (
            <Linha key={t.slug} t={t} onOpen={onOpen} />
          ))}
        </section>
      ))}
    </div>
  );
}
