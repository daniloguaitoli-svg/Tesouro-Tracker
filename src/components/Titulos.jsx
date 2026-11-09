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
import { Seletor } from "./Seletor.jsx";

// AS SEIS CATEGORIAS SÃO DUAS PERGUNTAS: qual indexação e se paga cupom. O id
// de cada categoria já diz as duas coisas ("ipca", "ipca-juros", "prefixado",
// "prefixado-juros", "selic"), e o filtro lê daí em vez de manter uma tabela
// paralela que pudesse divergir do catálogo.
const indiceDe = (id) => (id.startsWith("ipca") ? "ipca" : id.startsWith("prefixado") ? "prefixado" : "selic");
// A LFT não paga cupom — conta como "sem", que é o que ela é. Por isso "Com"
// fica desabilitado quando o índice é Selic: não existe LFT com cupom.
const temCupom = (id) => id.endsWith("-juros");

const INDICES = [
  { id: "todos", rotulo: "Todos" },
  { id: "ipca", rotulo: "IPCA+" },
  { id: "prefixado", rotulo: "Prefixado" },
  { id: "selic", rotulo: "Selic" },
];

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
  const [indice, setIndice] = useState("todos");
  const [cupom, setCupom] = useState("todos"); // "todos" | "sem" | "com"

  const categorias = dados.categorias || [];
  const filtradas = useMemo(() => {
    const q = normalizarBusca(busca);
    return categorias
      .filter((c) => indice === "todos" || indiceDe(c.id) === indice)
      .filter((c) => cupom === "todos" || temCupom(c.id) === (cupom === "com"))
      .map((c) => ({
        ...c,
        itens: c.itens.filter((t) => !q || normalizarBusca(`${t.nome} ${t.vencimento}`).includes(q)),
      }))
      .filter((c) => c.itens.length > 0);
  }, [categorias, busca, indice, cupom]);

  // Trocar para Selic com "Com" escolhido deixaria a lista vazia por uma
  // combinação que não existe — volta para "Todos" em vez de mostrar o vazio.
  const escolherIndice = (novo) => {
    setIndice(novo);
    if (novo === "selic" && cupom === "com") setCupom("todos");
  };

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
      <Seletor rotulo="Índice" opcoes={INDICES} valor={indice} onChange={escolherIndice} />
      <Seletor
        rotulo="Cupom"
        opcoes={[
          { id: "todos", rotulo: "Todos" },
          { id: "sem", rotulo: "Sem" },
          { id: "com", rotulo: "Com", desabilitada: indice === "selic" },
        ]}
        valor={cupom}
        onChange={setCupom}
      />

      <p className="section-sub" style={{ marginTop: "var(--s3)" }}>
        Toque na estrela para acompanhar um vencimento no Painel
        {marcados.size > 0 && <> · {marcados.size} acompanhado{marcados.size > 1 ? "s" : ""}</>}.
        A escolha fica só neste aparelho.
      </p>

      {filtradas.length === 0 && <Vazio texto="Nenhum vencimento com esse filtro." />}

      {filtradas.map((c) => (
        <section key={c.id}>
          <h2 className="section-title">{c.nome}</h2>
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
