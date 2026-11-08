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
import { MarcaIcone } from "./components/MarcaIcone.jsx";
import { Tabs, BarraInferior } from "./components/Tabs.jsx";
import { SeloDados } from "./components/SeloDados.jsx";
import { Explica } from "./components/Explica.jsx";
import { Painel } from "./components/Painel.jsx";
import { Titulos } from "./components/Titulos.jsx";
import { Curva } from "./components/Curva.jsx";
import { Mercado } from "./components/Mercado.jsx";
import { Noticias } from "./components/Noticias.jsx";
import { Calculadora } from "./components/Calculadora.jsx";
import { Alertas } from "./components/Alertas.jsx";
import { Detalhe } from "./components/Detalhe.jsx";
import { ErroBox, Skeletons } from "./components/States.jsx";
import { dataBR, horaBR } from "./format.js";

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

  const todos = useMemo(() => (dados?.categorias || []).flatMap((c) => c.itens), [dados]);
  const marcados = useMemo(() => resolverDestaques(escolha, todos), [escolha, todos]);
  // Mantém a ordem das categorias (família, depois vencimento) em vez da ordem
  // em que a pessoa foi clicando — o Painel fica estável entre visitas.
  const itensDestaque = useMemo(() => todos.filter((t) => marcados.has(t.slug)), [todos, marcados]);

  // Trocar de tela pela navegação também fecha o Detalhe (a barra inferior
  // continua visível sobre ele) e volta ao topo — a tela nova não deve abrir
  // no meio da rolagem da anterior.
  const irPara = (id) => {
    setSlug(null);
    setTab(id);
    // Só rola se precisar: além de evitar trabalho à toa, o jsdom do teste de
    // fumaça não implementa scrollTo e encheria o log de erro.
    if (window.scrollY > 0) window.scrollTo(0, 0);
  };

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
          <MarcaIcone />
          <span>
            Tesouro
            <small>títulos do Tesouro Direto · taxas e duration</small>
          </span>
        </div>
        {/* Só o selo de data aqui. O IPCA 12m saiu: desde que o Painel ganhou a
            tira macro, ele aparecia DUAS VEZES na mesma tela, a quatro dedos de
            distância — e, espremido entre a marca e o selo, obrigava o subtítulo
            a quebrar em três linhas num iPhone. */}
        <div className="topo-direita">
          <SeloDados itens={itensDestaque} atualizadoEm={dados?.atualizadoEm} />
        </div>
      </header>

      {slug ? (
        <Detalhe slug={slug} onBack={() => setSlug(null)} />
      ) : (
        <>
          <Tabs value={tab} onChange={irPara} tabs={TABS} />

          {carregando && !dados && <Skeletons n={5} />}
          {erro && !dados && <ErroBox erro={erro} onRetry={carregar} />}

          {dados && (
            <main>
              {tab === "painel" && (
                <Painel
                  dados={dados}
                  itens={itensDestaque}
                  onOpen={setSlug}
                  onIrParaTitulos={() => irPara("titulos")}
                  onIrParaCurva={() => irPara("curva")}
                />
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

      {/* O rodapé não aparece no Detalhe: lá o mesmo aviso mora dobrado em
          "Fontes e método", e a tela ficaria com a frase duas vezes — uma
          recolhida e outra por extenso logo abaixo. */}
      {/* O RODAPÉ DIZ O ESSENCIAL E GUARDA O RESTO NO ⓘ. Ele aparece em todas
          as telas, e o aviso de 403 caracteres ocupava ~140px em cada uma —
          no Mercado e na Curva, duas vezes, porque as notas dessas telas o
          repetiam. Fica visível o que a regra da casa exige em toda tela
          (fonte pública, atraso, não é recomendação) e o estado da coleta;
          as fontes por nome, a convenção de dias úteis e a descrição do app
          vão para a folha.
          A lista de fontes também corrige um erro do texto antigo, que dizia
          "Tesouro Nacional e Banco Central" numa tela, o Mercado, que mostra
          dados do Yahoo, do FRED e do BCE. */}
      {!slug && (
      <footer className="footer">
        Dados públicos, com pelo menos um dia útil de atraso. Uso informativo — não é
        recomendação de investimento.{" "}
        <Explica titulo="Fontes e método" rotulo="Fontes">
          <p>
            Tesouro Nacional e Banco Central em todo o app. Também: B3 (futuros, na aba Curva),
            Yahoo Finance (bolsas), FRED (Fed e inflação de fora do Brasil), BCE (taxas do BCE)
            e Google Notícias (manchetes).
          </p>
          <p>
            Prazo, duration e sensibilidade são calculados em dias úteis/252, a convenção do
            Tesouro e da ANBIMA.
          </p>
          <p>
            Feito para acompanhar taxa, duration e sensibilidade a juros dos títulos do Tesouro
            Direto: IPCA+, Prefixado e Selic.
          </p>
        </Explica>
        {dados?.atualizadoEm && (
          <>
            <br />
            Última coleta: {dataBR(dados.atualizadoEm)} às {horaBR(dados.atualizadoEm)}.
          </>
        )}
      </footer>
      )}

      <BarraInferior value={slug ? null : tab} onChange={irPara} tabs={TABS} />
    </div>
  );
}
