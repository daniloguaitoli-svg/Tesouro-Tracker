// App.jsx — moldura do app. Topo com marca + IPCA, abas, e as telas. Um
// vencimento selecionado abre o Detalhe em tela cheia (sobre as abas).
//
// `getTitulos()` é carregado UMA vez aqui e passado para baixo: Painel, Títulos,
// Calculadora e Alertas leem do mesmo payload. Só Curva e Detalhe buscam os
// próprios endpoints. Assim, um campo novo em /api/titulos chega a quatro telas
// de graça — e o app faz uma requisição, não quatro.
import { useEffect, useState } from "react";
import { getTitulos } from "./api.js";
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
              {tab === "painel" && <Painel dados={dados} onOpen={setSlug} />}
              {tab === "titulos" && <Titulos dados={dados} onOpen={setSlug} />}
              {tab === "curva" && <Curva />}
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
        Feito para acompanhar a taxa real e a sensibilidade a juros das NTN-B (Tesouro IPCA+).
        {dados?.atualizadoEm && (
          <> Última coleta: {dataBR(dados.atualizadoEm)} às {horaBR(dados.atualizadoEm)}.</>
        )}
      </footer>
    </div>
  );
}
