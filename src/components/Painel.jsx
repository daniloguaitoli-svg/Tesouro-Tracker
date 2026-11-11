// components/Painel.jsx — a primeira tela: uma tira de quatro números macro e,
// abaixo, os vencimentos acompanhados de perto. (O aviso de dado velho mora no
// selo do topo.)
//
// QUEM aparece aqui é escolha do usuário, feita na aba Títulos (a estrela) e
// guardada neste aparelho — ver src/destaques.js. O App resolve a lista e passa
// pronta em `itens`; numa instalação nova ela nasce com os `destaque` do
// catálogo, para a tela não abrir vazia.
//
// A escolha de destaque é deliberada: a taxa real grande, e logo abaixo a
// duration e o "±1 p.p.". Só a taxa não diz o que uma mudança de juros faz com
// a posição — é a duration que responde isso, e é ela que interessa em um
// horizonte longo.
import { taxa, pct, anos, dataBR, sinal, num, reais, unidadeTaxa } from "../format.js";
import { AguardandoColeta } from "./States.jsx";
import { PainelLateral } from "./PainelLateral.jsx";
import { ChipsDeVariacao, PERIODOS } from "./Chip.jsx";
import { Seletor } from "./Seletor.jsx";
import { Explica } from "./Explica.jsx";
import { useTelaLarga } from "../telaLarga.js";

// Um vencimento acompanhado, em três faixas de leitura: identidade à esquerda
// e taxa à direita, as variações como chips, e a duration numa escala.
//
// A taxa à direita existe para a COMPARAÇÃO: empilhados, os números grandes
// caem todos na mesma coluna e a diferença entre dois vencimentos se lê de
// relance. No layout anterior cada taxa começava onde o nome acabava.
function CartaoTitulo({ t, onOpen, periodo }) {
  const mac = t.duration?.macaulay ?? null;
  // "pós-fixado" em vez de "sem cupom" para a LFT: ela não tem cupom, mas
  // dizer isso sugere que o que importa nela é o mesmo que numa NTN-B curta.
  const sub = [
    t.tipo === "selic" ? "pós-fixado" : t.comCupom ? "com cupom" : "sem cupom",
    `vence ${dataBR(t.vencimento)}`,
  ].join(" · ");

  return (
    <button className="cartao-titulo" onClick={() => onOpen(t.slug)}>
      <span className="ct-topo">
        <span className="ct-id">
          <b className="ct-nome">{t.nome}</b>
          <span className="ct-sub">{sub}</span>
        </span>
        <span className="ct-num">
          <b className="ct-taxa mono">{taxa(t.taxa)}</b>
          <span className="ct-unidade">{unidadeTaxa(t.tipo)}</span>
        </span>
      </span>

      <ChipsDeVariacao t={t} periodo={periodo} />

      {mac != null ? (
        <span className="ct-dur">
          <span className="ct-dur-linha">
            <span>
              duration <b className="mono">{anos(mac)}</b>
            </span>
            <span>
              +1 p.p. na taxa →{" "}
              <b className={`mono ${sinal(t.duration?.variacaoPor1pp)}`}>{pct(t.duration?.variacaoPor1pp)}</b>
            </span>
          </span>
          {/* Escala FIXA, de 0 a 20 anos. Uma barra normalizada pelo
              maior valor da tela muda de significado a cada recorte: 100%
              seria a 2035 num dia e a 2060 no outro. Fixa, a mesma largura é
              sempre o mesmo risco de juros, e dois cartões se comparam sem
              ler número nenhum. O teto de 20 anos cobre da NTN-B curta à 2060
              com cupom (duration ~13,5a); acima dele a barra satura, e isso
              está certo — é "longa" de qualquer jeito. */}
          <span className="ct-trilho">
            <i style={{ width: `${Math.min(100, (mac / 20) * 100)}%` }} />
          </span>
          <span className="ct-escala" aria-hidden="true">
            <span>0</span>
            <span>5a</span>
            <span>10a</span>
            <span>15a</span>
            <span>20a</span>
          </span>
        </span>
      ) : (
        // A LFT não tem duration por construção (ver CLAUDE.md, semântica das
        // famílias). Antes a escala aparecia vazia, o que lia como dado
        // faltando em vez de grandeza que não existe.
        <span className="ct-dur ct-dur-nota">Pós-fixado: acompanha a Selic, quase sem risco de juros.</span>
      )}
    </button>
  );
}

// A faixa macro: os quatro números que emolduram a leitura dos títulos, numa
// tira só em vez de seis cartões em três linhas.
//
// Quais quatro é escolha de dono: inflação (o que a NTN-B corrige), Selic (o
// juro curto, que é a alternativa de não comprar título), Ibovespa em 12 meses
// (a alternativa de sair da renda fixa) e EUR/BRL (o câmbio de referência de
// quem usa este app; o dólar ficou na aba Mercado, ao lado dele).
//
// CDI e USD/BRL saíram da TIRA, não do app: a aba Mercado mostra os dois nas
// cinco janelas, e o CDI ao lado da Selic — onde a diferença entre eles é o
// que se quer ver. Aqui eles eram quase a repetição do vizinho: CDI 13,65% ao
// lado de Selic 13,75%, e o dólar ao lado do euro.
//
// Cada célula sai SEMPRE, com "—" quando falta dado. É a mesma razão de antes:
// uma célula que some reflui a tira e troca a posição das outras, e é pela
// posição que se acha o número sem ler o rótulo.
function FaixaMacro({ macro }) {
  const ind = macro?.indicadores || {};
  const celulas = [
    {
      rotulo: "IPCA 12m",
      valor: ind.ipca?.acumulado12m != null ? `${num(ind.ipca.acumulado12m)}%` : "—",
      // A data vai no title, não na tira: ela é o que não cabe em 90px, e
      // some-la de vez seria esconder que o IPCA é de um mês fechado.
      titulo: ind.ipca ? `último mês ${num(ind.ipca.valor)}% · ref. ${dataBR(ind.ipca.data)}` : "sem dados agora",
    },
    {
      rotulo: "Selic",
      valor: ind.selic?.valor != null ? `${num(ind.selic.valor)}%` : "—",
      titulo: ind.selic ? `meta a.a. · ${dataBR(ind.selic.data)}` : "sem dados agora",
    },
    {
      // O Ibovespa entra pela VARIAÇÃO, nunca pelo nível: "203.803 pontos" não
      // informa nada sem referência, e o que se quer saber ao lado de uma taxa
      // real de 6,8% é quanto a bolsa rendeu no mesmo intervalo. É a única
      // célula com sinal e cor — o rótulo diz "12m" justamente para ela não
      // ser lida como as outras três, que são nível.
      // "IBOV 12m" e não "Ibovespa 12m": o nome por extenso pede 71px numa
      // célula de 64px (57px num aparelho de 360px) e vazava por cima da
      // vizinha. IBOV é o ticker da B3, então encurtar aqui não é abreviar por
      // falta de espaço — é usar o nome curto que já existe.
      rotulo: "IBOV 12m",
      valor: ind.ibovespa?.var12m?.pct != null ? pct(ind.ibovespa.var12m.pct) : "—",
      dir: ind.ibovespa?.var12m?.pct != null ? sinal(ind.ibovespa.var12m.pct) : null,
      titulo: ind.ibovespa?.var12m
        ? `Ibovespa desde ${dataBR(ind.ibovespa.var12m.de)} · ${num(ind.ibovespa.valor, 0)} pontos em ${dataBR(ind.ibovespa.data)}`
        : "sem dados agora",
    },
    {
      rotulo: "EUR/BRL",
      valor: ind.eurbrl?.valor != null ? num(ind.eurbrl.valor, 4) : "—",
      titulo: ind.eurbrl ? `PTAX venda · ${dataBR(ind.eurbrl.data)}` : "sem dados agora",
    },
  ];

  return (
    <div className="faixa-macro">
      {celulas.map((c) => (
        <div key={c.rotulo} title={c.titulo}>
          <div className="fm-rotulo">{c.rotulo}</div>
          <div className={`fm-valor mono ${c.dir || ""}`}>{c.valor}</div>
        </div>
      ))}
    </div>
  );
}

// O aviso de alerta atingido. Fica no TOPO do Painel porque é a primeira coisa
// que quem criou um alerta quer saber ao abrir o app — e até 11/2026 ele só
// existia dentro da aba Alertas, que no celular fica atrás do "Mais".
//
// É um botão: leva à aba onde o alerta se desfaz. E é azul, não âmbar nem
// verde: âmbar já quer dizer "dado atrasado" (o selo do topo), e verde ou
// coral querem dizer que um preço subiu ou caiu. Isto não é nenhum dos dois —
// é uma condição que a própria pessoa definiu.
function AvisoDeAlertas({ atingidos, onAbrir }) {
  if (!atingidos?.length) return null;
  const [{ alerta, titulo }] = atingidos;
  return (
    <button className="aviso-alertas" onClick={onAbrir}>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M6 16V11a6 6 0 1 1 12 0v5l2 2H4zM10 21h4" />
      </svg>
      <span>
        {atingidos.length === 1 ? (
          <>
            <b>Alerta atingido:</b> {titulo.nome} está a <span className="mono">{taxa(titulo.taxa, titulo.tipo === "selic" ? 4 : 2)}</span>,{" "}
            {alerta.direcao === "acima" ? "acima de" : "abaixo de"} <span className="mono">{taxa(alerta.alvo)}</span>.
          </>
        ) : (
          <>
            <b>{atingidos.length} alertas atingidos</b> — {titulo.nome} e{" "}
            {atingidos.length === 2 ? "mais um" : `mais ${atingidos.length - 1}`}.
          </>
        )}
      </span>
      <span className="aviso-seta" aria-hidden="true">›</span>
    </button>
  );
}

// O resumo da carteira, quando há compras registradas. É o atalho para a aba
// Carteira, que no celular fica atrás do "Mais" — o mesmo problema que os
// alertas tinham, resolvido do mesmo jeito: o que é da pessoa aparece onde
// ela cai ao abrir o app. Neutro, e não azul como o aviso de alerta: aqui
// nada aconteceu, é só o número que ela veio ver. A cor vai só no resultado.
function ResumoDaCarteira({ total, onAbrir }) {
  if (!total) return null;
  return (
    <button className="resumo-carteira" onClick={onAbrir}>
      <span className="rc-rotulo">Minha carteira</span>
      <b className="rc-valor mono">{reais(total.valorHoje)}</b>
      <span className={`rc-resultado mono ${sinal(total.resultado)}`}>
        {reais(total.resultado)} ({pct(total.resultadoPct)})
      </span>
      <span className="aviso-seta" aria-hidden="true">›</span>
    </button>
  );
}

// O RESUMO DO DIA, escrito por um modelo de IA no coletor (server/resumo.js).
//
// "Gerado por IA" fica NA TELA, junto do texto, e não só no ⓘ: é o único
// lugar do app em que uma frase não saiu de uma conta, e quem lê precisa
// saber disso antes de ler. O servidor só manda o resumo quando ele é dos
// mesmos preços que estão na tela — sem resumo, o cartão simplesmente não
// existe.
function ResumoDoDia({ resumo }) {
  if (!resumo?.texto) return null;
  return (
    <div className="card resumo-dia">
      <div className="label resumo-dia-titulo">
        <span>
          Resumo de {dataBR(resumo.dataDosPrecos)} · <span className="resumo-selo">gerado por IA</span>
        </span>
        <Explica titulo="Como este resumo é escrito">
          <p>
            Uma vez por dia de preço novo, os números que o app já calcula — o que cada título
            fez, quem mais mexeu, o que o DI embute para o Copom — e as manchetes do dia são
            enviados a um modelo de linguagem, que escreve o parágrafo.
          </p>
          <p>
            <strong>Os números são do app, a frase é do modelo.</strong> Antes de publicar, um
            programa confere se todo número do texto está entre os que foram enviados; um que não
            esteja derruba o resumo inteiro, e o dia fica sem ele.
          </p>
          <p>
            A leitura ainda pode estar errada com os números certos — ligar um movimento a uma
            notícia que não o causou, por exemplo. Confira nas telas de cada título. E o texto
            descreve; não é recomendação.
          </p>
          <p>
            Nada do que é seu entra nisso: carteira, alertas e estrelas ficam no aparelho, e o
            resumo é o mesmo para todo mundo.
          </p>
          {resumo.geradoPor && <p className="explica-fonte">Escrito por {resumo.geradoPor}.</p>}
        </Explica>
      </div>
      {resumo.texto.split(/\n{2,}/).map((paragrafo, i) => (
        <p key={i}>{paragrafo}</p>
      ))}
    </div>
  );
}

export function Painel({ dados, itens, onOpen, onIrParaTitulos, onIrParaCurva, atingidos, onIrParaAlertas, periodo, onPeriodo, carteira, onIrParaCarteira }) {
  // Em tela larga a coluna da direita assume a moldura (os seis indicadores) e
  // a tira de quatro some — ver .faixa-macro no CSS. O hook decide a MONTAGEM
  // da lateral, não só a visibilidade: ela busca a curva, e um celular não
  // deve pagar essa requisição para nada.
  const larga = useTelaLarga();
  if (dados.pendente) return <AguardandoColeta />;
  const destaques = itens || [];
  const slugs = new Set(destaques.map((t) => t.slug));

  const principal = (
    <div className="painel-principal">
      <AvisoDeAlertas atingidos={atingidos} onAbrir={onIrParaAlertas} />
      <ResumoDaCarteira total={carteira} onAbrir={onIrParaCarteira} />
      <ResumoDoDia resumo={dados.resumo} />
      <FaixaMacro macro={dados.macro} />

      {/* O aviso de preço velho saiu daqui: agora é o selo do topo (SeloDados),
          que segue a mesma regra — só os vencimentos acompanhados. */}
      <h2 className="section-title">Acompanhados de perto</h2>
      {destaques.length === 0 ? (
        <div className="note">
          Nenhum vencimento acompanhado no momento. Abra a aba <strong>Títulos</strong> e
          toque na estrela (☆) dos que você quer ver aqui — a escolha fica só neste
          aparelho.
          {onIrParaTitulos && (
            <div style={{ marginTop: "var(--s3)" }}>
              <button className="btn btn-primary" onClick={onIrParaTitulos}>
                Escolher vencimentos
              </button>
            </div>
          )}
        </div>
      ) : (
        // Uma coluna, não duas: o cartão compacto tem chips e escala, e em 390px
        // dois por linha espremem as três faixas até nenhuma se ler.
        <>
          {/* UM SELETOR PARA TODOS OS CARTÕES, e não um por cartão: a leitura
              desta lista é comparar os títulos entre si, e isso só vale com
              todos na mesma janela. O ⓘ mora na linha dele porque é dele que
              fala — inclusive do "— cupom", que só aparece por causa dele. */}
          <Seletor rotulo="Período" opcoes={PERIODOS} valor={periodo} onChange={onPeriodo}>
            <Explica titulo="Variação no período">
              <p>
                Os chips “taxa” e “preço” de cada cartão mostram quanto os dois mudaram no
                período escolhido. A taxa varia em pontos percentuais e o preço em %, em sentidos
                opostos: taxa que sobe é título que vale menos hoje.
              </p>
              <p>
                “1 dia” compara o último preço com o do pregão anterior. “1 semana” e “1 mês”
                comparam com o preço de 7 e de 30 dias antes — ou com o último publicado antes
                dessa data, quando ela cai em fim de semana ou feriado.
              </p>
              <p>
                <strong>“— cupom” no lugar do preço:</strong> quando um título paga juros dentro
                do período, o preço dele cai o valor do pagamento sem que ninguém tenha perdido
                nada — o dinheiro foi para a conta. Mostrar essa queda como perda seria errado,
                então o preço fica de fora nesse período. A taxa continua valendo.
              </p>
              <p>
                Em períodos longos o preço também sobe sozinho, só por render juros: parado, um
                título a 14% ao ano sobe cerca de 1% num mês. Por isso a variação do preço em
                “1 mês” não é só o efeito da taxa.
              </p>
              <p>
                Um traço (—) quer dizer que o histórico do título não alcança a data: ele não
                tinha preço publicado naquela época.
              </p>
            </Explica>
          </Seletor>
          <div className="lista-cartoes">
            {destaques.map((t) => (
              <CartaoTitulo key={t.slug} t={t} onOpen={onOpen} periodo={periodo} />
            ))}
          </div>
        </>
      )}
    </div>
  );

  if (!larga) return principal;

  return (
    <div className="painel-largo">
      {principal}
      <PainelLateral macro={dados.macro} slugsAcompanhados={slugs} onIrParaCurva={onIrParaCurva} />
    </div>
  );
}
