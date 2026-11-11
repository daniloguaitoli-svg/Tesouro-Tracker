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
import { taxa, pp, pct, anos, reais, dataBR, sinal, sinalTaxa, normalizarBusca, unidadeTaxa } from "../format.js";
import { useTelaLarga } from "../telaLarga.js";
import { COLUNAS, ORDEM_PADRAO, ordenar } from "../ordem.js";
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

// A ORDEM VALE DENTRO DE CADA FAMÍLIA, nunca entre elas. Uma lista só, da
// maior taxa para a menor, poria um Prefixado a 14% (nominal) acima de um
// IPCA+ a 7,8% (real) — a comparação que o app inteiro existe para não fazer.
// Por isso os grupos e os títulos deles ficam; o que muda é a fila em cada um.
//
// "Variação" ordena pelo TAMANHO do movimento do dia, não pelo sinal: a
// pergunta é "o que mais mexeu?", e uma queda de 0,30 p.p. mexeu mais que uma
// alta de 0,05. Sem dado vai para o fim, em qualquer ordem.
const ORDENS = [
  { id: "vencimento", rotulo: "Vencimento" },
  { id: "taxa", rotulo: "Taxa" },
  { id: "variacao", rotulo: "Variação" },
];

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

// A lista como TABELA, uma por família, para telas largas.
//
// Uma tabela por família e não uma só: a taxa de um IPCA+ é real, a de um
// prefixado é nominal e a da Selic é um ágio — numa coluna única, ordenar
// por taxa poria as três em fila como se fossem a mesma grandeza. As
// larguras das colunas são fixas e iguais em todas, então as tabelas se
// alinham na tela como se fossem uma.
//
// A linha inteira abre o detalhe com o ponteiro, mas quem leva o foco do
// teclado e o nome para o leitor de tela é o botão do nome: uma <tr> com
// onClick sozinha não se alcança por Tab.
function Tabela({ c, ordem, onOrdenar, onOpen, marcados, onAlternar }) {
  const ehSelic = c.id === "selic";
  return (
    <table className="tabela-titulos">
      <caption className="so-leitor">{c.nome}</caption>
      <thead>
        <tr>
          <th className="col-estrela">
            <span className="so-leitor">Acompanhar</span>
          </th>
          <th className="col-nome" scope="col">Título</th>
          {COLUNAS.map((col) => {
            const ativa = ordem.por === col.id;
            return (
              <th key={col.id} scope="col" className={`col-${col.id}`} aria-sort={ativa ? (ordem.desc ? "descending" : "ascending") : "none"}>
                <button className="th-ordenar" onClick={() => onOrdenar(col)} title={col.dica}>
                  {col.rotulo}
                  <span className="th-seta" aria-hidden="true">{ativa ? (ordem.desc ? "↓" : "↑") : ""}</span>
                </button>
              </th>
            );
          })}
          <th className="col-spark" scope="col">45 dias</th>
        </tr>
      </thead>
      <tbody>
        {c.itens.map((t) => {
          const marcado = marcados.has(t.slug);
          const dia = t.variacoes?.["1D"]?.taxaPP ?? null;
          const mes = t.variacoes?.["1M"]?.taxaPP ?? null;
          return (
            <tr key={t.slug} className={marcado ? "marcado" : undefined} onClick={() => onOpen(t.slug)}>
              <td className="col-estrela" onClick={(e) => e.stopPropagation()}>
                <button
                  className="estrela"
                  aria-pressed={marcado}
                  aria-label={marcado ? `Deixar de acompanhar ${t.nome}` : `Acompanhar ${t.nome} no Painel`}
                  title={marcado ? "Acompanhado no Painel — clique para tirar" : "Acompanhar no Painel"}
                  onClick={() => onAlternar(t.slug)}
                >
                  {marcado ? "★" : "☆"}
                </button>
              </td>
              <th className="col-nome" scope="row">
                <button className="tt-nome" onClick={(e) => { e.stopPropagation(); onOpen(t.slug); }}>
                  {t.nome}
                </button>
                {t.desatualizado && <span className="stale">desatualizado</span>}
              </th>
              <td className="col-vencimento mono">{dataBR(t.vencimento)}</td>
              <td className="col-taxa mono tt-forte">{taxa(t.taxa, ehSelic ? 4 : 2)}</td>
              <td className={`col-dia mono ${sinalTaxa(dia)}`}>{pp(dia)}</td>
              <td className={`col-mes mono ${sinalTaxa(mes)}`}>{pp(mes)}</td>
              <td className="col-pu mono">{reais(t.pu)}</td>
              <td className="col-duration mono">{anos(t.duration?.macaulay ?? null)}</td>
              <td className={`col-sens mono ${sinal(t.duration?.variacaoPor1pp)}`}>{pct(t.duration?.variacaoPor1pp ?? null)}</td>
              <td className="col-spark">
                <Sparkline points={t.spark} inverter />
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

export function Titulos({ dados, onOpen, marcados, onAlternar }) {
  // A tabela MONTA só em tela larga (o mesmo corte da coluna do Painel): no
  // celular dez colunas não cabem, e a lista de cartões segue sendo a tela.
  const larga = useTelaLarga();
  const [busca, setBusca] = useState("");
  const [indice, setIndice] = useState("todos");
  const [cupom, setCupom] = useState("todos"); // "todos" | "sem" | "com"
  const [ordem, setOrdem] = useState(ORDEM_PADRAO);
  // O seletor do celular escolhe a grandeza e usa o sentido habitual dela; o
  // cabeçalho da tabela inverte quando se clica de novo na mesma coluna.
  const ordenarPeloSeletor = (por) => setOrdem({ por, desc: por !== "vencimento" });
  const ordenarPelaColuna = (col) =>
    setOrdem((atual) => (atual.por === col.id ? { por: col.id, desc: !atual.desc } : { por: col.id, desc: !col.crescente }));

  const categorias = dados.categorias || [];
  const filtradas = useMemo(() => {
    const q = normalizarBusca(busca);
    return categorias
      .filter((c) => indice === "todos" || indiceDe(c.id) === indice)
      .filter((c) => cupom === "todos" || temCupom(c.id) === (cupom === "com"))
      .map((c) => ({
        ...c,
        itens: ordenar(
          c.itens.filter((t) => !q || normalizarBusca(`${t.nome} ${t.vencimento}`).includes(q)),
          ordem
        ),
      }))
      .filter((c) => c.itens.length > 0);
  }, [categorias, busca, indice, cupom, ordem]);

  // Trocar para Selic com "Com" escolhido deixaria a lista vazia por uma
  // combinação que não existe — volta para "Todos" em vez de mostrar o vazio.
  const escolherIndice = (novo) => {
    setIndice(novo);
    if (novo === "selic" && cupom === "com") setCupom("todos");
  };

  if (dados.pendente) return <AguardandoColeta />;

  return (
    <div>
      {/* Em tela larga os controles ficam numa linha só, cada um com a
          largura do que contém (ver .titulos-controles): esticados de ponta a
          ponta em 1.200px, três posições de um seletor ficavam a um palmo
          uma da outra. A "Ordem" some ali — o cabeçalho da tabela a faz. */}
      <div className="titulos-controles">
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
        <Seletor rotulo="Índice" opcoes={INDICES} valor={indice} onChange={escolherIndice} compacto={larga} />
        <Seletor
          rotulo="Cupom"
          opcoes={[
            { id: "todos", rotulo: "Todos" },
            { id: "sem", rotulo: "Sem" },
            { id: "com", rotulo: "Com", desabilitada: indice === "selic" },
          ]}
          valor={cupom}
          onChange={setCupom}
          compacto={larga}
        />
        {!larga && <Seletor rotulo="Ordem" opcoes={ORDENS} valor={ordem.por} onChange={ordenarPeloSeletor} />}
      </div>

      <p className="section-sub" style={{ marginTop: "var(--s3)" }}>
        {larga ? "Clique" : "Toque"} na estrela para acompanhar um vencimento no Painel
        {marcados.size > 0 && <> · {marcados.size} acompanhado{marcados.size > 1 ? "s" : ""}</>}.
        A escolha fica só neste aparelho.
        {larga && " Clique no nome de uma coluna para ordenar por ela, dentro de cada família."}
      </p>

      {filtradas.length === 0 && <Vazio texto="Nenhum vencimento com esse filtro." />}

      {filtradas.map((c) => (
        <section key={c.id}>
          <h2 className="section-title">{c.nome}</h2>
          <p className="section-sub">{c.resumo}</p>
          {larga ? (
            <Tabela c={c} ordem={ordem} onOrdenar={ordenarPelaColuna} onOpen={onOpen} marcados={marcados} onAlternar={onAlternar} />
          ) : (
            c.itens.map((t) => (
              <Linha key={t.slug} t={t} onOpen={onOpen} marcado={marcados.has(t.slug)} onAlternar={onAlternar} />
            ))
          )}
        </section>
      ))}
    </div>
  );
}
