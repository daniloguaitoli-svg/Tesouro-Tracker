// components/Curva.jsx — a curva de juros reais: taxa por prazo.
//
// É a leitura que a lista não dá. Comparada com ela mesma há um mês e há um
// ano, mostra se o mercado inteiro repreçou (curva deslocou) ou se mudou a
// relação entre curto e longo (curva mudou de inclinação) — coisas diferentes,
// com consequências diferentes para quem carrega prazo longo.
import { useEffect, useState } from "react";
import { getCurva } from "../api.js";
import { CurvaChart, CurvaLegenda } from "./CurvaChart.jsx";
import { taxa, anos, dataBR, num, pp, mesBR } from "../format.js";
import { ErroBox, Skeletons, AguardandoColeta } from "./States.jsx";
import { CurvaFuturos } from "./CurvaFuturos.jsx";
import { TesouroContraFuturo } from "./TesouroFuturo.jsx";
import { Explica } from "./Explica.jsx";
import { Seletor } from "./Seletor.jsx";

// As quatro curvas são DUAS perguntas — qual indexação e se paga cupom — e o
// id de cada uma já carrega as duas ("ipca-sem-cupom", "pre-com-cupom"). Os
// dois seletores montam o id a partir das respostas, em vez de listar quatro
// chips que escondiam essa estrutura.
const indiceDaCurva = (id) => (id.startsWith("pre") ? "pre" : "ipca");
const cupomDaCurva = (id) => (id.includes("com-cupom") ? "com" : "sem");
const idDaCurva = (indice, cupom) => `${indice}-${cupom}-cupom`;

// A inflação implícita (breakeven): o que o mercado precisa que a inflação seja
// para o prefixado empatar com o IPCA+ de mesmo prazo. Acima disso o IPCA+
// ganha, abaixo o prefixado ganha — é a conta que decide entre as duas famílias,
// e o app tinha os dois lados dela sem nunca fazer a subtração.
//
// NÃO é previsão de inflação: embute prêmio de risco (quem compra prefixado
// cobra para assumir o risco) e diferença de liquidez entre os dois papéis. Por
// isso costuma ficar ACIMA da inflação que o mercado de fato espera. A tela diz
// isso — seria fácil e errado apresentar como projeção.
// A PESQUISA FOCUS AO LADO DA IMPLÍCITA. A implícita é o que os PREÇOS
// embutem, e a tela já avisa que isso não é previsão; a pesquisa é o que os
// economistas de fato esperam. Com as duas no mesmo cartão, "costuma ficar
// acima do que o mercado espera" deixa de ser uma frase e vira um número.
//
// A comparação só é feita onde os dois períodos coincidem: a pesquisa vai uns
// quatro anos à frente, e o servidor devolve `focus: null` nos pontos além
// disso em vez de repetir a última mediana. Usa-se o ponto mais curto que ela
// alcança.
function FocusDaInflacao({ focus, agora }) {
  if (!focus?.anos?.length) return null;
  const p = agora.find((x) => x.focus != null);
  const ultimoAno = focus.anos[focus.anos.length - 1].ano;
  return (
    <div className="card focus-inflacao">
      <div className="label focus-titulo">
        <span>O que os economistas esperam · Focus de {dataBR(focus.data)}</span>
        <Explica titulo="A pesquisa Focus e a inflação implícita">
          <p>
            O Focus é a pesquisa do Banco Central com economistas de bancos, gestoras e
            consultorias. Os números aqui são a mediana do IPCA esperado para cada ano.
          </p>
          <p>
            Para comparar com a implícita, que é uma média do período inteiro, o app tira a
            média composta das medianas entre hoje e o vencimento do prefixado, cada ano
            pesado pela parte dele que cai no período. No ano corrente usa a mediana do ano
            inteiro como se fosse o ritmo dos meses que faltam — num período de anos, esse
            pedaço pesa pouco.
          </p>
          <p>
            A pesquisa vai até {ultimoAno}. Nos prazos mais longos não há comparação: completar
            com a última mediana seria inventar a expectativa de longo prazo.
          </p>
          <p>
            A diferença entre as duas não é erro de nenhuma: preço embute o prêmio que se
            cobra para correr o risco de a inflação surpreender, e a diferença de liquidez
            entre os dois papéis. E a pesquisa também erra — é opinião, não resultado.
          </p>
          {focus.fonte && <p className="explica-fonte">{focus.fonte}.</p>}
        </Explica>
      </div>
      <div className="focus-anos">
        {focus.anos.map((a) => (
          <div key={a.ano}>
            <div className="cen-rotulo mono">{a.ano}</div>
            <div className="cen-valor mono">{taxa(a.mediana)}</div>
          </div>
        ))}
      </div>
      {p ? (
        <p className="focus-leitura">
          Até {mesBR(p.vencimento)} os preços embutem <b className="mono">{taxa(p.taxa)}</b> ao ano; a
          pesquisa, <b className="mono">{taxa(p.focus)}</b>. A diferença de{" "}
          <span className="mono">{pp(p.taxa - p.focus)}</span> é prêmio de risco e de liquidez, não
          inflação esperada.
        </p>
      ) : (
        <p className="focus-leitura">
          A pesquisa vai até {ultimoAno} e o ponto mais curto da implícita vence depois disso: não
          há período comum para comparar.
        </p>
      )}
    </div>
  );
}

function Implicita({ implicita, focus }) {
  const agora = implicita?.agora || [];
  if (agora.length < 2) return null;
  const comFocus = agora.some((p) => p.focus != null);

  const series = [
    { id: "1a", rotulo: "há um ano", pontos: implicita.umAnoAtras, cor: "var(--muted)", tracejado: true },
    { id: "1m", rotulo: "há um mês", pontos: implicita.umMesAtras, cor: "var(--accent-2)" },
    { id: "agora", rotulo: "hoje", pontos: agora, cor: "var(--accent)", forte: true },
  ].filter((s) => s.pontos && s.pontos.length >= 2);

  return (
    <>
      <h2 className="section-title">
        Inflação implícita
        <Explica titulo="Inflação implícita">
          <p>
            Acima dessa inflação o IPCA+ entrega mais; abaixo, o Prefixado. É a conta que
            decide entre as duas famílias.
          </p>
          <p>
            Conta pela relação de Fisher — (1+nominal)/(1+real) − 1 — e não pela subtração,
            que nestes níveis erra quase meio ponto.
          </p>
          <p>
            LTN e NTN-F vencem em 01/01 e as NTN-B em 15/05 ou 15/08, então não há par exato:
            a curva real é interpolada no prazo de cada ponto nominal, e só dentro do
            intervalo observado — nunca extrapolada.
          </p>
          <p>
            Por que não é previsão: embute o prêmio que quem compra prefixado cobra pelo
            risco de inflação e a diferença de liquidez entre os dois papéis. Por isso tende a
            ficar acima da inflação que o mercado de fato espera.
          </p>
        </Explica>
      </h2>
      {/* "Não é previsão" fica NA TELA, não no ⓘ: é a ressalva que muda a
          leitura do número. Sem ela, 6,3% neste gráfico vira "o mercado
          espera 6,3% de inflação" — fácil e errado. */}
      <p className="section-sub">
        A inflação que faz o Prefixado empatar com o IPCA+ de mesmo prazo.{" "}
        <strong>Não é previsão de inflação</strong>: costuma ficar acima do que o mercado espera.
      </p>

      <div className="card">
        <CurvaChart series={series} height={170} rotulo="Inflação implícita por prazo" />
        <CurvaLegenda series={series} />
      </div>

      <FocusDaInflacao focus={focus} agora={agora} />

      <details className="dobra">
        <summary>
          Prazo a prazo <span className="quantos">· {agora.length}</span>
        </summary>
        <div className="rolagem">
        <table className="tbl">
          <thead>
            <tr>
              <th className="rt">Prazo</th>
              <th className="rt">Nominal</th>
              <th className="rt">Real</th>
              <th className="rt">Implícita</th>
              {comFocus && <th className="rt">Focus</th>}
            </tr>
          </thead>
          <tbody>
            {agora.map((p) => (
              <tr key={p.anos}>
                <td className="rt mono">{anos(p.anos)}</td>
                <td className="rt mono">{taxa(p.nominal)}</td>
                <td className="rt mono">{taxa(p.real)}</td>
                <td className="rt mono"><b>{taxa(p.taxa)}</b></td>
                {comFocus && <td className="rt mono">{p.focus == null ? "—" : taxa(p.focus)}</td>}
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </details>

    </>
  );
}

export function Curva({ marcados }) {
  const [dados, setDados] = useState(null);
  const [erro, setErro] = useState(null);
  const [tentativa, setTentativa] = useState(0);
  const [familiaId, setFamiliaId] = useState("real");
  const [eixo, setEixo] = useState("anos"); // "anos" (prazo) | "duration"

  useEffect(() => {
    let vivo = true;
    setErro(null);
    getCurva()
      .then((d) => vivo && setDados(d))
      .catch((e) => vivo && setErro(e.message));
    return () => {
      vivo = false;
    };
  }, [tentativa]);

  if (erro && !dados) return <ErroBox erro={erro} onRetry={() => setTentativa((n) => n + 1)} />;
  if (!dados) return <Skeletons n={3} />;
  if (dados.pendente) return <AguardandoColeta />;

  // O ⭐ segue a escolha do usuário (aba Títulos), não o `destaque` do catálogo
  // que veio do servidor — senão a curva marcaria vencimentos diferentes dos
  // que o Painel mostra, e o app se contradiria na cara de quem usa.
  const meu = (p) => ({ ...p, destaque: marcados ? marcados.has(p.slug) : p.destaque });

  // Só oferece famílias que têm pontos (a prefixada fica vazia até a primeira
  // coleta que inclua LTN/NTN-F).
  const disponiveis = (dados.curvas || [])
    .filter((c) => c.agora.length > 0)
    .map((c) => ({ ...c, agora: c.agora.map(meu) }));
  const curva = disponiveis.find((c) => c.id === familiaId) || disponiveis[0];
  if (!curva) return <AguardandoColeta />;

  const existe = (id) => disponiveis.some((c) => c.id === id);
  const temIndice = (indice) => disponiveis.some((c) => indiceDaCurva(c.id) === indice);
  const indiceAtual = indiceDaCurva(curva.id);
  const cupomAtual = cupomDaCurva(curva.id);
  // Se a combinação pedida não tem pontos (a prefixada com cupom antes da
  // primeira coleta que a inclua, por exemplo), fica na outra forma do mesmo
  // índice em vez de cair num quadro vazio.
  const escolher = (indice, cupom) => {
    const alvo = idDaCurva(indice, cupom);
    const outra = idDaCurva(indice, cupom === "com" ? "sem" : "com");
    setFamiliaId(existe(alvo) ? alvo : existe(outra) ? outra : curva.id);
  };

  // Este quadro mistura as duas famílias? Depois da separação do IPCA+, só a
  // prefixada mistura — mas a pergunta é feita aos DADOS, não ao id da curva,
  // para o texto continuar certo se as famílias mudarem de arranjo.
  const misturada =
    curva.agora.some((p) => p.comCupom === true) && curva.agora.some((p) => p.comCupom === false);

  // DURATION SÓ EXISTE COMO COISA DISTINTA SE HOUVER CUPOM. Num quadro
  // zero-cupom a duration É o prazo, por construção — a tabela mostrava
  // "2,5 a | 2,5 a" em toda linha, e o eixo "Por duration" desenhava o mesmo
  // gráfico que "Por prazo". Uma coluna que repete a vizinha e um botão que
  // não muda nada: os dois somem quando não têm o que dizer.
  const temCupom = curva.agora.some((p) => p.comCupom === true);
  // Quem escolheu "duration" num quadro com cupom e trocou para um sem ficaria
  // preso num eixo que já não pode mudar. O estado é preservado; o que vale
  // para desenhar é o efetivo.
  const eixoEfetivo = temCupom ? eixo : "anos";

  const series = [
    { id: "1a", rotulo: "há um ano", pontos: curva.umAnoAtras, cor: "var(--muted)", tracejado: true },
    { id: "1m", rotulo: "há um mês", pontos: curva.umMesAtras, cor: "var(--accent-2)" },
    { id: "agora", rotulo: "hoje", pontos: curva.agora, cor: "var(--accent)", forte: true },
  ];

  return (
    <div>
      <h2 className="section-title">
        Curva de juros
        <Explica titulo="Curva de juros">
          <p>
            Cada ponto é um título: a taxa que ele paga até o vencimento, no prazo que falta.
            As três linhas são a mesma curva hoje, há um mês e há um ano — se ela inteira
            subiu ou desceu, o mercado repreçou; se mudou de inclinação, mudou a relação entre
            curto e longo.
          </p>
          <p>
            São quatro quadros: cada indexação, IPCA+ e Prefixado, com cupom e sem cupom.
            Elas não formam uma curva única — há vencimentos que existem nas duas formas, com
            a mesma data e taxas diferentes. Juntas, o desenho serrilhava e uma curva ficava
            espremida pela amplitude da outra. Nas NTN-B longas, a com cupom paga cerca de
            0,07 p.p. a mais.
          </p>
          {misturada && (
            <p>
              Este quadro tem as duas famílias, cada uma com a sua linha — ponto cheio sem
              cupom, anel com cupom.
            </p>
          )}
          {dados.prazoMinimo != null && (
            <p>
              Títulos a menos de {num(dados.prazoMinimo, 1)} ano do vencimento ficam de fora:
              perto do fim, um ruído pequeno no preço vira pontos percentuais de taxa, e o
              ponto passa a descrever o vencimento chegando, não a curva.
            </p>
          )}
          <p>Prazo em dias úteis/252, a convenção do Tesouro e da ANBIMA.</p>
        </Explica>
      </h2>
      <p className="section-sub">
        Real e nominal não se comparam ponto a ponto — a diferença entre elas é a inflação
        implícita, logo abaixo.
      </p>
      {disponiveis.length > 1 && (
        <>
          <Seletor
            rotulo="Índice"
            opcoes={[
              { id: "ipca", rotulo: "IPCA+", desabilitada: !temIndice("ipca") },
              { id: "pre", rotulo: "Prefixado", desabilitada: !temIndice("pre") },
            ]}
            valor={indiceAtual}
            onChange={(novo) => escolher(novo, cupomAtual)}
          />
          <Seletor
            rotulo="Cupom"
            opcoes={[
              { id: "sem", rotulo: "Sem cupom", desabilitada: !existe(idDaCurva(indiceAtual, "sem")) },
              { id: "com", rotulo: "Com cupom", desabilitada: !existe(idDaCurva(indiceAtual, "com")) },
            ]}
            valor={cupomAtual}
            onChange={(novo) => escolher(indiceAtual, novo)}
          />
        </>
      )}

      <div className="card">
        {/* O SELETOR DE EIXO MORA NO CARTÃO DO GRÁFICO, não junto dos
            filtros de cima. Ele não escolhe qual curva — escolhe com que
            régua medi-la. Tem o mesmo desenho dos filtros, então o que diz
            que ele é outra coisa é o LUGAR: dentro do cartão, a peça diz de
            quem é a propriedade que ela muda. */}
        {temCupom && (
          <Seletor
            compacto
            rotulo="Eixo"
            opcoes={[
              { id: "anos", rotulo: "Prazo" },
              { id: "duration", rotulo: "Duration" },
            ]}
            valor={eixo}
            onChange={setEixo}
          >
            {/* O ⓘ da duration mora AO LADO DO SELETOR, não no título da
                seção: é ali que a pergunta "o que muda se eu trocar?" nasce,
                e ele some junto com o seletor nos quadros sem cupom. */}
            <Explica titulo="Prazo ou duration">
              <p>
                Duration é quanto risco de juros o título carrega — a escala que permite
                comparar um com cupom e um sem. Mesmo prazo não é mesmo risco: o título com
                cupom devolve parte do dinheiro antes.
              </p>
              <p>
                Por duration, toda a NTN-B com juros semestrais cabe numa faixa estreita, por
                mais longo que seja o vencimento: comprar prazo não é comprar risco na mesma
                proporção.
              </p>
              <p>
                Num quadro sem cupom, duration e prazo são a mesma coisa — por isso este
                seletor só aparece onde há cupom.
              </p>
              <p>
                Calculada em dias úteis/252 e na data de cada curva, porque a duration encurta
                com o tempo.
              </p>
            </Explica>
          </Seletor>
        )}
        <CurvaChart
          series={series}
          campoX={eixoEfetivo}
          rotulo={eixoEfetivo === "duration" ? "Curva de juros por duration" : "Curva de juros por prazo"}
        />
        <CurvaLegenda series={series} campoX={eixoEfetivo} />
      </div>

      {/* A TABELA FICA COLADA NO SEU GRÁFICO, e dobrada.
          Antes ela vinha DEPOIS da seção de inflação implícita — que tem
          gráfico e tabela próprios — então o leitor encontrava uma tabela
          800px abaixo de um gráfico que não era o dela. E dobrada porque o
          gráfico é a leitura e a tabela é a conferência: as três tabelas
          desta aba somavam ~3.000px dos 5.868px de rolagem.
          O resumo SUBSTITUI o título da seção; um título que não clica ao
          lado de um que clica ensina a coisa errada. */}
      <details className="dobra">
        <summary>
          Pontos da curva <span className="quantos">· {curva.agora.length} vencimentos</span>
        </summary>
        <div className="rolagem">
        <table className="tbl">
          <thead>
            <tr>
              <th>Vencimento</th>
              <th className="rt">Prazo</th>
              {temCupom && <th className="rt">Duration</th>}
              <th className="rt">Taxa ({curva.sufixo})</th>
            </tr>
          </thead>
          <tbody>
            {[...curva.agora]
              .sort((a, b) => (a[eixoEfetivo] ?? 0) - (b[eixoEfetivo] ?? 0))
              .map((p) => (
              <tr key={p.slug}>
                <td>
                  {p.nome} {p.destaque && <span aria-label="acompanhado de perto">⭐</span>}
                  <br />
                  <span className="linha-menor">{dataBR(p.vencimento)}</span>
                </td>
                <td className="rt mono inteiro">{anos(p.anos)}</td>
                {temCupom && <td className="rt mono inteiro">{anos(p.duration)}</td>}
                <td className="rt mono">{taxa(p.taxa)}</td>
              </tr>
              ))}
          </tbody>
        </table>
      </div>
      </details>

      <Implicita implicita={dados.implicita} focus={dados.focus} />

      {/* O AVISO LONGO SAIU DAQUI. Ele repetia o rodapé, que já está nesta
          tela, e a convenção de dias úteis que ele trazia agora mora no ⓘ
          da curva e no da duration — perto do prazo que ela mede. O mercado
          futuro continua por último: é outra fonte, com ressalva e data
          próprias, e não deve parecer coberto pela explicação de cima. */}
      <CurvaFuturos />

      {/* DEPOIS das duas fontes, porque é o cruzamento delas: cada título do
          Tesouro contra o futuro da B3 no mesmo prazo. Os números vêm no
          payload da curva (o servidor casa as datas); se não houver futuro
          coletado na data do preço, a seção não existe. */}
      <TesouroContraFuturo dados={dados.contraFuturo} />
    </div>
  );
}
