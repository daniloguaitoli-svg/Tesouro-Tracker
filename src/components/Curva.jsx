// components/Curva.jsx — a curva de juros reais: taxa por prazo.
//
// É a leitura que a lista não dá. Comparada com ela mesma há um mês e há um
// ano, mostra se o mercado inteiro repreçou (curva deslocou) ou se mudou a
// relação entre curto e longo (curva mudou de inclinação) — coisas diferentes,
// com consequências diferentes para quem carrega prazo longo.
import { useEffect, useState } from "react";
import { getCurva } from "../api.js";
import { CurvaChart, CurvaLegenda } from "./CurvaChart.jsx";
import { taxa, anos, dataBR, num } from "../format.js";
import { ErroBox, Skeletons, AguardandoColeta } from "./States.jsx";
import { CurvaFuturos } from "./CurvaFuturos.jsx";
import { Explica } from "./Explica.jsx";

// A inflação implícita (breakeven): o que o mercado precisa que a inflação seja
// para o prefixado empatar com o IPCA+ de mesmo prazo. Acima disso o IPCA+
// ganha, abaixo o prefixado ganha — é a conta que decide entre as duas famílias,
// e o app tinha os dois lados dela sem nunca fazer a subtração.
//
// NÃO é previsão de inflação: embute prêmio de risco (quem compra prefixado
// cobra para assumir o risco) e diferença de liquidez entre os dois papéis. Por
// isso costuma ficar ACIMA da inflação que o mercado de fato espera. A tela diz
// isso — seria fácil e errado apresentar como projeção.
function Implicita({ implicita }) {
  const agora = implicita?.agora || [];
  if (agora.length < 2) return null;

  const series = [
    { id: "1a", rotulo: "há um ano", pontos: implicita.umAnoAtras, cor: "var(--muted)", tracejado: true },
    { id: "1m", rotulo: "há um mês", pontos: implicita.umMesAtras, cor: "var(--accent-2)" },
    { id: "agora", rotulo: "hoje", pontos: agora, cor: "var(--accent)", forte: true },
  ].filter((s) => s.pontos && s.pontos.length >= 2);

  return (
    <>
      <div className="section-title">
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
      </div>
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
            </tr>
          </thead>
          <tbody>
            {agora.map((p) => (
              <tr key={p.anos}>
                <td className="rt mono">{anos(p.anos)}</td>
                <td className="rt mono">{taxa(p.nominal)}</td>
                <td className="rt mono">{taxa(p.real)}</td>
                <td className="rt mono"><b>{taxa(p.taxa)}</b></td>
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
      <div className="section-title">
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
      </div>
      <p className="section-sub">
        Real e nominal não se comparam ponto a ponto — a diferença entre elas é a inflação
        implícita, logo abaixo.
      </p>
      {disponiveis.length > 1 && (
        <div className="chips" style={{ marginBottom: 8 }}>
          {disponiveis.map((c) => (
            <button key={c.id} className="chip" aria-pressed={curva.id === c.id} onClick={() => setFamiliaId(c.id)}>
              {c.nome}
            </button>
          ))}
        </div>
      )}

      <div className="card">
        {/* O SELETOR DE EIXO MORA NO CARTÃO DO GRÁFICO, não na fileira de
            chips. Ele não escolhe qual curva — escolhe com que régua medi-la —
            e como chip idêntico aos de família deixava dois botões acesos ao
            mesmo tempo no que parecia um bloco só. Dentro do cartão, a peça
            diz de quem é a propriedade que ela muda. */}
        {temCupom && (
          <div className="eixo">
            <span className="eixo-rotulo" id="rot-eixo">Eixo</span>
            <div className="eixo-seg" role="group" aria-labelledby="rot-eixo">
              {[
                ["anos", "Prazo"],
                ["duration", "Duration"],
              ].map(([id, rot]) => (
                <button key={id} type="button" aria-pressed={eixo === id} onClick={() => setEixo(id)}>
                  {rot}
                </button>
              ))}
            </div>
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
          </div>
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
                  <span className="muted" style={{ fontSize: 11 }}>{dataBR(p.vencimento)}</span>
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

      <Implicita implicita={dados.implicita} />

      {/* O AVISO LONGO SAIU DAQUI. Ele repetia o rodapé, que já está nesta
          tela, e a convenção de dias úteis que ele trazia agora mora no ⓘ
          da curva e no da duration — perto do prazo que ela mede. O mercado
          futuro continua por último: é outra fonte, com ressalva e data
          próprias, e não deve parecer coberto pela explicação de cima. */}
      <CurvaFuturos />
    </div>
  );
}
