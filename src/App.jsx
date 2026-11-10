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
//
// A ROTA (aba e título aberto) vem do endereço — ver src/rota.js e useRota.js.
// OS ALERTAS também moram aqui desde 11/2026: a aba Alertas os edita, mas quem
// avisa que um deles foi atingido é o Painel e a navegação.
import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { getTitulos, assinarConexao, estadoDaConexao } from "./api.js";
import { carregarDestaques, salvarDestaques, resolverDestaques, alternarDestaque } from "./destaques.js";
import { carregarAlertas, salvarAlertas, alertasAtingidos } from "./alertas.js";
import { useRota } from "./useRota.js";
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

const IDS_DAS_ABAS = TABS.map((t) => t.id);
const NOME_DO_APP = "Tesouro Tracker";

export default function App() {
  const { tab, slug, irParaAba, abrirTitulo, fecharTitulo } = useRota(IDS_DAS_ABAS, "painel");
  const [dados, setDados] = useState(null);
  const [erro, setErro] = useState(null);
  const [carregando, setCarregando] = useState(true);
  // null = nunca escolheu (cai nos padrões do catálogo); array = escolha feita.
  const [escolha, setEscolha] = useState(carregarDestaques);
  const [alertas, setAlertas] = useState(carregarAlertas);
  // null = dados da rede; { salvoEm, motivo } = o aparelho está mostrando o
  // que guardou, porque a rede ou o servidor falharam (ver src/api.js).
  const conexao = useSyncExternalStore(assinarConexao, estadoDaConexao, () => null);
  // Sobe a cada volta da rede, e é a `key` das telas: remonta a que está
  // aberta para ela buscar de novo. Sem isto, a faixa de aviso sumiria e a
  // tela continuaria com o dado guardado — a pior combinação possível.
  const [geracao, setGeracao] = useState(0);
  const recarregando = useRef(false);

  const carregar = () => {
    setCarregando(true);
    setErro(null);
    recarregando.current = true;
    getTitulos()
      .then(setDados)
      .catch((e) => setErro(e.message))
      .finally(() => {
        recarregando.current = false;
        setCarregando(false);
      });
  };
  useEffect(carregar, []);

  // A REDE VOLTOU. Dois sinais, porque nenhum dos dois basta sozinho: o evento
  // `online` do navegador (que não dispara se a falha era do servidor), e a
  // faixa de aviso se apagando porque OUTRA tela conseguiu buscar. Nos dois
  // casos os títulos — que este componente carrega uma vez só — têm de ser
  // buscados de novo, e a tela aberta, remontada.
  const estavaGuardado = useRef(false);
  useEffect(() => {
    if (estavaGuardado.current && !conexao) {
      setGeracao((g) => g + 1);
      if (!recarregando.current) carregar();
    }
    estavaGuardado.current = !!conexao;
  }, [conexao]);
  useEffect(() => {
    const aoVoltar = () => estadoDaConexao() && carregar();
    window.addEventListener("online", aoVoltar);
    return () => window.removeEventListener("online", aoVoltar);
  }, []);

  // O nome da tela na aba do navegador e no histórico: com endereço próprio,
  // "Tesouro Tracker" repetido em toda entrada não diz para onde se volta. O
  // Detalhe põe o nome do título quando o dado chega; aqui fica o da aba.
  useEffect(() => {
    if (!slug) document.title = `${TABS.find((t) => t.id === tab)?.label} · ${NOME_DO_APP}`;
  }, [tab, slug]);

  const todos = useMemo(() => (dados?.categorias || []).flatMap((c) => c.itens), [dados]);
  const marcados = useMemo(() => resolverDestaques(escolha, todos), [escolha, todos]);
  // Mantém a ordem das categorias (família, depois vencimento) em vez da ordem
  // em que a pessoa foi clicando — o Painel fica estável entre visitas.
  const itensDestaque = useMemo(() => todos.filter((t) => marcados.has(t.slug)), [todos, marcados]);
  const atingidos = useMemo(() => alertasAtingidos(alertas, todos), [alertas, todos]);
  // O número que a navegação mostra ao lado de cada aba. Só os alertas têm
  // um, por enquanto; é um mapa para a navegação não saber o que ele conta.
  const avisos = useMemo(() => (atingidos.length ? { alertas: atingidos.length } : {}), [atingidos]);

  // Trocar de tela pela navegação também fecha o Detalhe (a barra inferior
  // continua visível sobre ele) e volta ao topo — quem cuida das duas coisas,
  // e do endereço, é o useRota.
  const irPara = irParaAba;

  const mudarAlertas = (transformar) => {
    setAlertas((atual) => {
      const proxima = transformar(atual);
      salvarAlertas(proxima);
      return proxima;
    });
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
            <small>Títulos do Tesouro Direto · taxas e duration</small>
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

      {/* UM AVISO SÓ, no mesmo lugar em todas as telas — o Detalhe inclusive.
          Âmbar, como o selo de atraso: é a mesma família de notícia ("o que
          você vê não é de agora"), não um erro. role="status" para o leitor
          de tela anunciar quando aparece, sem interromper. */}
      {conexao && (
        <div className="faixa-guardado" role="status">
          <span>
            <b>{conexao.motivo === "servidor" ? "O servidor não respondeu." : "Sem conexão."}</b>{" "}
            {conexao.salvoEm
              ? `Mostrando o que este aparelho guardou em ${dataBR(conexao.salvoEm)} às ${horaBR(conexao.salvoEm)}.`
              : "Mostrando o que este aparelho tinha guardado."}
          </span>
          <button className="btn" onClick={() => window.location.reload()}>
            Tentar de novo
          </button>
        </div>
      )}

      {slug ? (
        <Detalhe key={`${slug}-${geracao}`} slug={slug} onBack={fecharTitulo} nomeDoApp={NOME_DO_APP} />
      ) : (
        <>
          <Tabs value={tab} onChange={irPara} tabs={TABS} avisos={avisos} />

          {carregando && !dados && <Skeletons n={5} />}
          {erro && !dados && <ErroBox erro={erro} onRetry={carregar} />}

          {dados && (
            <main key={geracao}>
              {/* O NOME DA TELA, para quem navega por títulos. Invisível: em
                  tela a aba acesa já diz onde se está, mas um leitor de tela
                  pula de título em título, e sem este a página não tinha
                  nenhum — nem h1, nem h2 (os títulos de seção eram <div>). */}
              <h1 className="so-leitor">{TABS.find((t) => t.id === tab)?.label}</h1>
              {tab === "painel" && (
                <Painel
                  dados={dados}
                  itens={itensDestaque}
                  onOpen={abrirTitulo}
                  onIrParaTitulos={() => irPara("titulos")}
                  onIrParaCurva={() => irPara("curva")}
                  atingidos={atingidos}
                  onIrParaAlertas={() => irPara("alertas")}
                />
              )}
              {tab === "titulos" && (
                <Titulos dados={dados} onOpen={abrirTitulo} marcados={marcados} onAlternar={alternar} />
              )}
              {tab === "curva" && <Curva marcados={marcados} />}
              {tab === "mercado" && <Mercado />}
              {tab === "noticias" && <Noticias />}
              {tab === "calculadora" && <Calculadora dados={dados} />}
              {tab === "alertas" && <Alertas dados={dados} alertas={alertas} onMudar={mudarAlertas} />}
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

      <BarraInferior value={slug ? null : tab} onChange={irPara} tabs={TABS} avisos={avisos} />
    </div>
  );
}
