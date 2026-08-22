// components/Titulos.jsx — todos os vencimentos, agrupados por família.
//
// A linha mostra taxa E duration lado a lado de propósito: são os dois eixos da
// decisão. Duas NTN-B com a mesma taxa e durations diferentes não são o mesmo
// investimento.
//
// A estrela de cada linha escolhe quem aparece em "Acompanhados de perto", no
// Painel. Por isso a linha é uma <div> com DOIS botões dentro (abrir o detalhe
// e alternar a estrela) em vez de um <button> só: botão dentro de botão é HTML
// inválido, e os navegadores resolvem isso de formas diferentes — clicar na
// estrela acabaria abrindo o detalhe junto.
import { useMemo, useState } from "react";
import { taxa, pp, anos, reais, dataBR, sinalTaxa, normalizarBusca, unidadeTaxa } from "../format.js";
import { Sparkline } from "./Sparkline.jsx";
import { AguardandoColeta, Vazio } from "./States.jsx";

function Linha({ t, onOpen, marcado, onAlternar }) {
  return (
    <div className={`row row-sel${marcado ? " marcado" : ""}`}>
      <button className="rowabrir" onClick={() => onOpen(t.slug)}>
        <div className="rowmain">
          <div className="rowname">
            {t.nome} {!t.noCatalogo && <span className="muted" title="Vencimento presente no arquivo mas ainda sem entrada no catálogo">·</span>}
          </div>
          <div className="rowsub">
            vence {dataBR(t.vencimento)}
            {t.duration?.macaulay != null && <> · duration {anos(t.duration.macaulay)}</>}
            {t.desatualizado && <span className="stale" style={{ marginLeft: 6 }}>desatualizado</span>}
          </div>
        </div>
        <Sparkline points={t.spark} inverter />
        <div className="rowprice">
          <div className="p">{taxa(t.taxa, t.tipo === "selic" ? 4 : 2)}</div>
          <div className="sub">{unidadeTaxa(t.tipo)}</div>
          <div className={`d ${sinalTaxa(t.taxaVarPP)}`}>{pp(t.taxaVarPP)}</div>
          <div className="sub">{reais(t.pu)}</div>
        </div>
      </button>
      <button
        className="estrela"
        aria-pressed={marcado}
        aria-label={marcado ? `Deixar de acompanhar ${t.nome}` : `Acompanhar ${t.nome} no Painel`}
        title={marcado ? "Acompanhado no Painel — clique para tirar" : "Acompanhar no Painel"}
        onClick={() => onAlternar(t.slug)}
      >
        {marcado ? "★" : "☆"}
      </button>
    </div>
  );
}

export function Titulos({ dados, onOpen, marcados, onAlternar }) {
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
            {c.curto || c.nome}
          </button>
        ))}
      </div>

      <p className="section-sub" style={{ marginTop: "var(--s3)" }}>
        Toque na estrela para acompanhar um vencimento no Painel
        {marcados.size > 0 && <> · {marcados.size} acompanhado{marcados.size > 1 ? "s" : ""}</>}.
        A escolha fica só neste aparelho.
      </p>

      {filtradas.length === 0 && <Vazio texto="Nenhum vencimento com esse filtro." />}

      {filtradas.map((c) => (
        <section key={c.id}>
          <div className="section-title">{c.nome}</div>
          <p className="section-sub">{c.resumo}</p>
          {c.itens.map((t) => (
            <Linha
              key={t.slug}
              t={t}
              onOpen={onOpen}
              marcado={marcados.has(t.slug)}
              onAlternar={onAlternar}
            />
          ))}
        </section>
      ))}
    </div>
  );
}
