// components/PainelLateral.jsx — a coluna da direita do Painel, só em tela
// larga (ver src/telaLarga.js).
//
// POR QUE EXISTE: acima de ~960px os cartões dos vencimentos param de crescer
// — passam a caber dois por linha e sobra largura à direita. Essa faixa vazia
// é onde cabem as duas coisas que no celular competiam por altura com os
// títulos: o FORMATO da curva e a moldura macro inteira.
//
// A moldura aqui traz os SEIS indicadores, inclusive Ibovespa e EUR/BRL, que
// saíram da tira do celular. Eles não foram cortados por serem dispensáveis;
// foram cortados por falta de altura numa tela de 390px. Onde há espaço,
// voltam.
//
// A curva é buscada aqui dentro, como a aba Curva faz com o mesmo endpoint, e
// não no App: assim o celular nunca paga essa requisição, já que o componente
// só monta quando a tela é larga.
import { useEffect, useState } from "react";
import { getCurva } from "../api.js";
import { CurvaChart } from "./CurvaChart.jsx";
import { num, dataBR } from "../format.js";

// A família mostrada é a IPCA+ sem cupom: é a curva com mais pontos, e a que
// dá sentido à taxa real dos cartões ao lado. As outras três ficam na aba
// Curva, com o seletor de família e o eixo de duration.
const FAMILIA = "ipca-sem-cupom";

function CurvaResumo({ slugsAcompanhados, onAbrir }) {
  const [curva, setCurva] = useState(null);
  const [falhou, setFalhou] = useState(false);

  useEffect(() => {
    let vivo = true;
    getCurva()
      .then((d) => {
        if (!vivo) return;
        const lista = (d.curvas || []).filter((c) => c.agora?.length);
        setCurva(lista.find((c) => c.id === FAMILIA) || lista[0] || null);
      })
      .catch(() => vivo && setFalhou(true));
    return () => {
      vivo = false;
    };
  }, []);

  // Enquanto carrega (ou se falhar), o cartão inteiro sai da tela em vez de
  // virar um quadro vazio: aqui ele é contexto, não o dado que a pessoa veio
  // buscar, e um esqueleto permanente na lateral seria só ruído.
  if (falhou || !curva) return null;

  // A estrela é a do APARELHO, como no resto do app — a mesma lista que
  // alimenta os cartões ao lado, não o `destaque` do catálogo.
  const pontos = curva.agora.map((p) => ({ ...p, destaque: slugsAcompanhados.has(p.slug) }));
  const series = [{ id: "agora", rotulo: "hoje", pontos, cor: "var(--accent)", forte: true }];
  const temAcompanhado = pontos.some((p) => p.destaque);

  return (
    <section className="card lat-card">
      <div className="lat-topo">
        <h2 className="lat-titulo">{curva.nome} hoje</h2>
        {onAbrir && (
          <button className="lat-link" onClick={onAbrir}>
            Abrir
          </button>
        )}
      </div>
      <CurvaChart series={series} height={150} rotulo={`Curva ${curva.nome} de hoje, taxa por prazo`} />
      <p className="lat-nota">
        Taxa por prazo, em {curva.sufixo}.{temAcompanhado && " Ponto maior: acompanhado."}
      </p>
    </section>
  );
}

// Uma linha da moldura: rótulo à esquerda, número à direita. Lista e não
// grade porque aqui a leitura é vertical — percorrer seis nomes — enquanto na
// tira do celular era horizontal.
function Linha({ rotulo, valor, titulo }) {
  return (
    <div className="lat-linha" title={titulo}>
      <span>{rotulo}</span>
      <b className="mono">{valor}</b>
    </div>
  );
}

function MolduraLista({ macro }) {
  const ind = macro?.indicadores || {};
  const quando = (i, extra) => (i ? `${extra ? `${extra} · ` : ""}${dataBR(i.data)}` : "sem dados agora");

  return (
    <section className="card lat-card">
      <h2 className="lat-titulo">Moldura</h2>
      <div className="lat-lista">
        <Linha
          rotulo="IPCA 12 meses"
          valor={ind.ipca?.acumulado12m != null ? `${num(ind.ipca.acumulado12m)}%` : "—"}
          titulo={quando(ind.ipca, ind.ipca ? `último mês ${num(ind.ipca.valor)}%` : "")}
        />
        <Linha
          rotulo="Selic meta"
          valor={ind.selic?.valor != null ? `${num(ind.selic.valor)}%` : "—"}
          titulo={quando(ind.selic, "a.a.")}
        />
        <Linha rotulo="CDI" valor={ind.cdi?.valor != null ? `${num(ind.cdi.valor)}%` : "—"} titulo={quando(ind.cdi, "a.a.")} />
        <Linha
          rotulo="USD/BRL (PTAX)"
          valor={ind.usdbrl?.valor != null ? num(ind.usdbrl.valor, 4) : "—"}
          titulo={quando(ind.usdbrl, "venda")}
        />
        <Linha
          rotulo="EUR/BRL (PTAX)"
          valor={ind.eurbrl?.valor != null ? num(ind.eurbrl.valor, 4) : "—"}
          titulo={quando(ind.eurbrl, "venda")}
        />
        {/* O Ibovespa entra pelo nível aqui, com a variação de 12 meses ao
            lado no title: em lista, uma linha que mostra variação onde as
            outras cinco mostram nível quebra a leitura da coluna. */}
        <Linha
          rotulo="Ibovespa"
          valor={ind.ibovespa?.valor != null ? num(ind.ibovespa.valor, 0) : "—"}
          titulo={quando(ind.ibovespa, ind.ibovespa?.var12m ? `${num(ind.ibovespa.var12m.pct)}% em 12 meses` : "pontos")}
        />
      </div>
    </section>
  );
}

export function PainelLateral({ macro, slugsAcompanhados, onIrParaCurva }) {
  return (
    <aside className="painel-lateral" aria-label="Contexto">
      <CurvaResumo slugsAcompanhados={slugsAcompanhados} onAbrir={onIrParaCurva} />
      <MolduraLista macro={macro} />
    </aside>
  );
}
