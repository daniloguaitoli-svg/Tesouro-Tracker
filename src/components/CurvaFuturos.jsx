// components/CurvaFuturos.jsx — o bloco de mercado futuro dentro da aba Curva.
//
// POR QUE EM GRUPO SEPARADO, e não como mais duas famílias no seletor de cima:
// as curvas acima são de DÍVIDA SOBERANA, lidas do arquivo do Tesouro. Estas
// são de TAXA INTERBANCÁRIA, negociadas na B3. Respondem perguntas diferentes
// e o emissor não é o mesmo — pô-las no mesmo seletor faria o leitor trocar
// entre elas como quem troca de recorte, quando está trocando de mercado.
//
// BUSCA OS PRÓPRIOS DADOS, como a coluna lateral do Painel faz: endpoint
// próprio, fonte própria, falha própria. Um dia sem coleta da B3 deixa este
// bloco calado e não encosta na curva dos títulos logo acima.
import { useEffect, useState } from "react";
import { getFuturos } from "../api.js";
import { CurvaChart, CurvaLegenda } from "./CurvaChart.jsx";
import { taxa, anos, dataBR, num } from "../format.js";
import { Explica } from "./Explica.jsx";
import { Seletor } from "./Seletor.jsx";

export function CurvaFuturos() {
  const [dados, setDados] = useState(null);
  const [falhou, setFalhou] = useState(false);
  const [curvaId, setCurvaId] = useState("di-pre");

  useEffect(() => {
    let vivo = true;
    getFuturos()
      .then((d) => vivo && setDados(d))
      .catch(() => vivo && setFalhou(true));
    return () => {
      vivo = false;
    };
  }, []);

  // Falhou ou ainda não chegou: o bloco inteiro sai da tela em vez de virar um
  // quadro vazio. Aqui ele é acréscimo, não o dado que a pessoa veio buscar, e
  // um esqueleto permanente embaixo da curva dos títulos seria só ruído.
  if (falhou || !dados) return null;

  // Antes da primeira coleta não há o que desenhar. Uma linha honesta em vez
  // de um gráfico vazio com cara de defeito — e em vez do AguardandoColeta de
  // tela cheia, que apagaria a curva dos títulos acima, que está perfeita.
  if (dados.pendente) {
    return (
      <>
        <h2 className="section-title">Mercado futuro (B3)</h2>
        <p className="section-sub">
          Aguardando a primeira coleta dos futuros. A curva aparece aqui assim que o
          arquivo da B3 for lido — o histórico é acumulado dia a dia, não baixado de uma vez.
        </p>
      </>
    );
  }

  const curva = (dados.curvas || []).find((c) => c.id === curvaId) || dados.curvas?.[0];
  if (!curva?.agora?.length) return null;

  const series = [
    { id: "1m", rotulo: "há um mês", pontos: curva.umMesAtras, cor: "var(--accent-2)" },
    { id: "agora", rotulo: "hoje", pontos: curva.agora, cor: "var(--accent)", forte: true },
  ].filter((s) => s.pontos && s.pontos.length >= 2);

  const ehCupom = curva.id === "cupom-limpo";
  const ehIpca = curva.id === "cupom-ipca";

  return (
    <>
      <h2 className="section-title">
        Mercado futuro (B3)
        <Explica titulo="Mercado futuro (B3)">
          <p>
            Três curvas: o DI dá a curva pré-fixada em reais; o FRC, o cupom cambial — a curva
            em dólar; a DAP, o cupom de IPCA — o juro real, a contraparte de mercado da NTN-B.
          </p>
          {/* As convenções vêm do payload, curva a curva, e não escritas
              aqui: são três, e uma trocada dá número plausível e errado. */}
          <p>
            Cada uma na sua convenção:{" "}
            {(dados.curvas || [])
              .filter((c) => c.convencao)
              .map((c) => `${c.nome}, ${c.convencao}`)
              .join("; ")}
            .
          </p>
          <p>
            Os preços são os de ajuste da B3, de um dia que pode não ser o dos preços do
            Tesouro acima. Compare as datas antes de comparar as taxas: uma única sessão já
            moveu a curva mais do que a diferença entre as duas fontes.
          </p>
        </Explica>
      </h2>
      <p className="section-sub">
        Taxas interbancárias negociadas na B3 — outra fonte e outro emissor, não dívida do
        Tesouro.
      </p>

      {/* Uma pergunta, três respostas: o mesmo Seletor dos filtros da curva
          do Tesouro acima, para o bloco não parecer de outro app. Uma curva
          sem pontos fica apagada em vez de sumir — a peça não muda de
          largura num dia em que a B3 não entregou uma delas. */}
      <Seletor
        rotulo="Curva"
        opcoes={(dados.curvas || []).map((c) => ({
          id: c.id,
          rotulo: c.curto || c.nome,
          desabilitada: !c.agora?.length,
        }))}
        valor={curva.id}
        onChange={setCurvaId}
      />

      <div className="card">
        <CurvaChart series={series} height={170} rotulo={`Curva ${curva.nome} por prazo`} />
        <CurvaLegenda series={series} />
      </div>

      {/* A ressalva que o dado exige. A curva em dólar NÃO começa hoje, e
          dizer isso é o que separa um gráfico honesto de um que finge cobrir
          o curto prazo. O vértice sujo aparece com a taxa justamente para a
          diferença ficar visível: 29% ao lado de 5,4% explica sozinho por que
          ele não é ponto de curva. */}
      {ehCupom && curva.vertice && (
        <p className="section-sub">
          Começa em {dataBR(curva.vertice.vencimento)}, o primeiro vencimento de DDI em
          aberto — não hoje.
          <Explica titulo="Por que não começa hoje">
            <p>
              O DDI curto marca {taxa(curva.vertice.taxaSuja)} nesse prazo de{" "}
              {curva.vertice.dias} dias, mas é cupom sujo: carrega a variação do câmbio desde a
              PTAX do dia anterior, e por isso fica fora da curva.
            </p>
            <p>
              A curva sai do FRC, a taxa a termo a partir desse primeiro vencimento — o cupom
              limpo. Começar em hoje exigiria a taxa spot do dólar, que não está em fonte
              pública gratuita.
            </p>
          </Explica>
        </p>
      )}

      {/* A ressalva da DAP é outra, e precisa de texto próprio. O cupom
          cambial começa tarde por falta da taxa spot; a DAP começa tarde
          porque a ponta curta é distorcida pelo IPCA já conhecido dos
          próximos meses. Mesma honestidade, causas diferentes — e os vértices
          cortados aparecem com a taxa, para o leitor ver o tamanho do
          problema em vez de confiar na nossa palavra. */}
      {ehIpca && curva.curtos?.length > 0 && (
        <p className="section-sub">
          Começa em {anos(curva.agora[0].anos)}: os {curva.curtos.length} vencimentos mais curtos
          ficam de fora.
          <Explica titulo="Por que a ponta curta sai">
            <p>
              É o mesmo piso de prazo que as curvas do Tesouro usam. O corte é por prazo, não
              um a um — mas tem motivo: o mais curto marca{" "}
              {taxa(Math.min(...curva.curtos.map((p) => p.taxa)))} contra{" "}
              {taxa(curva.agora[0].taxa)} no primeiro ponto do gráfico.
            </p>
            <p>
              Num prazo curto, o IPCA já conhecido dos próximos meses domina o cálculo, e a taxa
              que sobra não descreve juro real de mercado.
            </p>
          </Explica>
        </p>
      )}

      {dados.historicoNota && <p className="section-sub">{dados.historicoNota}</p>}

      {/* Dobrada pela mesma razão das outras duas, e aqui mais ainda: a
          curva de DI tem 44 vencimentos, uns 2.500px — sozinha, quase
          metade da rolagem da aba inteira. */}
      <details className="dobra">
        <summary>
          Vértice a vértice <span className="quantos">· {curva.agora.length}</span>
        </summary>
        <div className="rolagem">
        <table className="tbl">
          <thead>
            <tr>
              <th>Vencimento</th>
              <th className="rt">Prazo</th>
              <th className="rt">Taxa ({curva.sufixo})</th>
              <th className="rt">PU</th>
            </tr>
          </thead>
          <tbody>
            {curva.agora.map((p) => (
              <tr key={p.slug}>
                <td>
                  {dataBR(p.vencimento)} <span className="muted">{p.slug}</span>
                </td>
                <td className="rt mono inteiro">{anos(p.anos)}</td>
                <td className="rt mono">{taxa(p.taxa)}</td>
                {/* O FRC não tem preço de ajuste: não é posição, é a forma de
                    negociar o DDI. Coluna vazia é a verdade, não falta de dado. */}
                <td className="rt mono">{p.pu == null ? "—" : num(p.pu, 2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </details>

      <p className="section-sub">
        Preços de ajuste de {dataBR(dados.data)}
        {dados.comparadoCom ? `, comparados com ${dataBR(dados.comparadoCom)}` : ""} · {dados.fonte}
      </p>
    </>
  );
}
