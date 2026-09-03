// App.jsx — moldura do app. Topo com marca + IPCA, abas, e as telas. Um
// vencimento selecionado abre o Detalhe em tela cheia (sobre as abas).
//
// A escolha de "acompanhados de perto" também mora aqui, e não dentro de uma
// tela: quem marca é a aba Títulos e quem exibe é o Painel, então o estado tem
// de ser comum às duas. Fica no localStorage (ver src/destaques.js).
//
// `getTitulos()` é carregado UMA vez aqui e passado para baixo: Painel, Títulos,
// Calculadora e Alertas leem do mesmo payload. Só Curva e Detalhe buscam os
// próprios endpoints. Assim, um campo novo em /api/titulos chega a quatro telas
// de graça — e o app faz uma requisição, não quatro.
import { useEffect, useMemo, useState } from "react";
import { getTitulos } from "./api.js";
import { carregarDestaques, salvarDestaques, resolverDestaques, alternarDestaque } from "./destaques.js";
import { Tabs } from "./components/Tabs.jsx";
import { Painel } from "./components/Painel.jsx";
import { Titulos } from "./components/Titulos.jsx";
import { Curva } from "./components/Curva.jsx";
import { Mercado } from "./components/Mercado.jsx";
import { Noticias } from "./components/Noticias.jsx";
import { Calculadora } from "./components/Calculadora.jsx";
import { Alertas } from "./components/Alertas.jsx";
import { Detalhe } from "./components/Detalhe.jsx";
import { ErroBox, Skeletons } from "./components/States.jsx";
import { num, dataBR, horaBR } from "./format.js";

const TABS = [
  { id: "painel", label: "Painel" },
  { id: "titulos", label: "Títulos" },
  { id: "curva", label: "Curva" },
  { id: "mercado", label: "Mercado" },
  { id: "calculadora", label: "Calculadora" },
  { id: "noticias", label: "Notícias" },
  { id: "alertas", label: "Alertas" },
];

export default function App() {
  const [tab, setTab] = useState("painel");
  const [slug, setSlug] = useState(null);
  const [dados, setDados] = useState(null);
  const [erro, setErro] = useState(null);
  const [carregando, setCarregando] = useState(true);
  // null = nunca escolheu (cai nos padrões do catálogo); array = escolha feita.
  const [escolha, setEscolha] = useState(carregarDestaques);

  const carregar = () => {
    setCarregando(true);
    setErro(null);
    getTitulos()
      .then(setDados)
      .catch((e) => setErro(e.message))
      .finally(() => setCarregando(false));
  };
  useEffect(carregar, []);

  const ipca12 = dados?.macro?.indicadores?.ipca?.acumulado12m;

  const todos = useMemo(() => (dados?.categorias || []).flatMap((c) => c.itens), [dados]);
  const marcados = useMemo(() => resolverDestaques(escolha, todos), [escolha, todos]);
  // Mantém a ordem das categorias (família, depois vencimento) em vez da ordem
  // em que a pessoa foi clicando — o Painel fica estável entre visitas.
  const itensDestaque = useMemo(() => todos.filter((t) => marcados.has(t.slug)), [todos, marcados]);

  const alternar = (slug) => {
    setEscolha((atual) => {
      const proxima = alternarDestaque(atual, todos, slug);
      salvarDestaques(proxima);
      return proxima;
    });
  };

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <span className="selo" aria-hidden="true">🏛️</span>
          <span>
            Tesouro
            <small>títulos do Tesouro Direto · taxas e duration</small>
          </span>
        </div>
        {ipca12 != null && (
          <div className="macro">
            IPCA 12m<br />
            <b className="mono">{num(ipca12)}%</b>
          </div>
        )}
      </header>

      {slug ? (
        <Detalhe slug={slug} onBack={() => setSlug(null)} />
      ) : (
        <>
          <Tabs value={tab} onChange={setTab} tabs={TABS} />

          {carregando && !dados && <Skeletons n={5} />}
          {erro && !dados && <ErroBox erro={erro} onRetry={carregar} />}

          {dados && (
            <main>
              {tab === "painel" && (
                <Painel dados={dados} itens={itensDestaque} onOpen={setSlug} onIrParaTitulos={() => setTab("titulos")} />
              )}
              {tab === "titulos" && (
                <Titulos dados={dados} onOpen={setSlug} marcados={marcados} onAlternar={alternar} />
              )}
              {tab === "curva" && <Curva marcados={marcados} />}
              {tab === "mercado" && <Mercado />}
              {tab === "noticias" && <Noticias />}
              {tab === "calculadora" && <Calculadora dados={dados} />}
              {tab === "alertas" && <Alertas dados={dados} />}
            </main>
          )}
        </>
      )}

      <footer className="footer">
        <strong>Aviso:</strong>{" "}
        {dados?.aviso ||
          "Dados de fontes públicas (Tesouro Nacional, ANBIMA e Banco Central), com defasagem de ao menos um dia útil. Uso informativo — não é recomendação de investimento."}
        <br />
        Feito para acompanhar taxa, duration e sensibilidade a juros dos títulos do Tesouro
        Direto: IPCA+, Prefixado e Selic.
        {dados?.atualizadoEm && (
          <> Última coleta: {dataBR(dados.atualizadoEm)} às {horaBR(dados.atualizadoEm)}.</>
        )}
      </footer>
    </div>
  );
}
