// components/TesouroFuturo.jsx — o título do Tesouro lido contra a curva de
// juros futuros. Duas telas usam: a Curva (todos os títulos, lado a lado) e o
// Detalhe (um só).
//
// DUAS LEITURAS, e as duas vêm prontas do servidor (server/futuro.js):
//   - o PRÊMIO: quanto o título paga acima do futuro no mesmo prazo, com os
//     preços da MESMA data nas duas pontas;
//   - PARADO, EM 12 MESES: o que ele rende em um ano se a curva de futuros
//     ficar onde está — carrego mais rolagem.
//
// NENHUMA DAS DUAS É SINAL DE COMPRA, e isso fica NA TELA, não só no ⓘ. O
// prêmio tem um pedaço estrutural (DI é taxa entre bancos, o título é dívida
// do Tesouro; o preço do Tesouro Direto é o de recompra) e o ruído de um dia
// é do tamanho dele; "a curva fica onde está" é uma hipótese que quase nunca
// se cumpre. São réguas para comparar títulos entre si, não previsões.
//
// SEM COR DE ALTA E BAIXA no prêmio: verde e coral aqui querem dizer ganho e
// perda, e um prêmio maior não é nem um nem outro. A rolagem e o total são
// rendimento, e aí o sinal tem cor.
import { useState } from "react";
import { taxa, pct, pp, dataBR, sinal } from "../format.js";
import { Explica } from "./Explica.jsx";
import { Seletor } from "./Seletor.jsx";

const NOME_DO_FUTURO = { DI1: "DI futuro", DAP: "cupom de IPCA (DAP)" };

// "+0,11" em vez de "+0,11 p.p.": a unidade vai uma vez, no cabeçalho da
// coluna. Repetida em cada célula a tabela passava 1px de uma tela de 360.
// Um prêmio de −0,002 arredonda para zero, e zero não tem sinal: sem isto a
// tabela mostrava "-0,00".
const semUnidade = (v) => pp(Math.abs(v) < 0.005 ? 0 : v).replace(/\s*p\.p\.$/, "");

function Metodo({ pregoes, desde, fonte }) {
  return (
    <>
      <p>
        <strong>O prêmio</strong> é a taxa do título menos a taxa que a curva de juros futuros
        da B3 daria a ele: DI futuro para o Prefixado, cupom de IPCA (DAP) para o IPCA+. Num
        título com cupom cada pagamento é descontado pela taxa do futuro no prazo dele, e a
        comparação é com a taxa única que daria o mesmo preço.
      </p>
      <p>
        Um prêmio positivo não quer dizer "barato". Parte dele é permanente: o futuro é taxa
        entre bancos e o título é dívida do Tesouro; a taxa do Tesouro Direto aqui é a de
        recompra; e as duas fontes não fecham no mesmo instante do dia. De um dia para o outro
        ele oscila por um valor do tamanho dele mesmo — por isso a média vem junto.
        {pregoes != null && desde && (
          <>
            {" "}
            O histórico de futuros do app começou em {dataBR(desde)} e tem {pregoes}{" "}
            {pregoes === 1 ? "pregão" : "pregões"}: a média ganha sentido com o tempo.
          </>
        )}
      </p>
      <p>
        <strong>Parado, em 12 meses</strong> supõe que a curva de futuros fique exatamente onde
        está e que o título mantenha o prêmio de hoje sobre ela. Em um ano ele tem um ano a
        menos de prazo e passa a valer a taxa de um ponto mais curto da curva. O{" "}
        <em>carrego</em> é a taxa correndo; a <em>rolagem</em> é o ganho (ou a perda, onde a
        curva é invertida) dessa mudança de taxa.
      </p>
      <p>
        É bruto de imposto e, no IPCA+, é rendimento acima da inflação. Os cupons pagos no
        período entram reaplicados à taxa do próprio título. E a curva quase nunca fica onde
        está: isto compara títulos entre si, não prevê o ano que vem.
      </p>
      <p>
        As duas pontas usam o preço da mesma data. Sem futuro coletado na data do preço do
        título, a linha fica sem leitura. Prazo em dias úteis/252.
      </p>
      {fonte && <p className="explica-fonte">{fonte}.</p>}
    </>
  );
}

// ---------- Na aba Curva: todos os títulos ----------

const INDICES = [
  { id: "ipca", rotulo: "IPCA+" },
  { id: "pre", rotulo: "Prefixado" },
];

export function TesouroContraFuturo({ dados }) {
  const [indice, setIndice] = useState("ipca");
  const [leitura, setLeitura] = useState("premio");
  if (!dados?.linhas?.length) return null;

  const doIndice = (id) => dados.linhas.filter((l) => l.curva.startsWith(id));
  const tem = (id) => doIndice(id).some((l) => l.premioPP != null);
  const indiceEfetivo = tem(indice) ? indice : INDICES.find((i) => tem(i.id))?.id;
  if (!indiceEfetivo) return null;
  const linhas = doIndice(indiceEfetivo).sort((a, b) => (a.vencimento < b.vencimento ? -1 : a.vencimento > b.vencimento ? 1 : a.comCupom - b.comCupom));
  const ativo = linhas[0]?.ativo;
  const real = indiceEfetivo === "ipca";

  return (
    <>
      <h2 className="section-title">
        Tesouro × futuro
        <Explica titulo="Tesouro × futuro">
          <Metodo pregoes={dados.pregoes} desde={dados.desde} fonte={dados.fonte} />
        </Explica>
      </h2>
      {/* A DATA fica na tela: a defasagem do Tesouro é de pelo menos um dia
          útil, e um único pregão de reprecificação vale mais que o prêmio
          inteiro. "Não é sinal de compra" também: é a ressalva que muda a
          leitura do número. */}
      <p className="section-sub">
        Cada título contra o {NOME_DO_FUTURO[ativo] || "futuro"} no mesmo prazo, com os preços de{" "}
        {dataBR(dados.data)} nas duas pontas. <strong>Não é sinal de compra</strong>: parte da
        diferença é permanente.
      </p>
      <Seletor
        rotulo="Índice"
        opcoes={INDICES.map((i) => ({ ...i, desabilitada: !tem(i.id) }))}
        valor={indiceEfetivo}
        onChange={setIndice}
      />
      <Seletor
        rotulo="Leitura"
        opcoes={[
          { id: "premio", rotulo: "Prêmio" },
          { id: "parado", rotulo: "Parado, 12 meses" },
        ]}
        valor={leitura}
        onChange={setLeitura}
      />

      <div className="rolagem">
        <table className="tbl tbl-enxuta">
          <thead>
            {leitura === "premio" ? (
              <tr>
                <th>Vence</th>
                <th className="rt">Tesouro</th>
                <th className="rt">Futuro</th>
                <th className="rt">Prêmio (p.p.)</th>
              </tr>
            ) : (
              <tr>
                <th>Vence</th>
                <th className="rt">Carrego</th>
                <th className="rt">Rolagem</th>
                <th className="rt">Total</th>
              </tr>
            )}
          </thead>
          <tbody>
            {linhas.map((l) => (
              <tr key={l.slug}>
                <td>
                  <span className="mono">{l.vencimento.slice(0, 4)}</span>
                  <br />
                  <span className="linha-menor">{l.comCupom ? "com cupom" : "sem cupom"}</span>
                </td>
                {leitura === "premio" ? (
                  <>
                    <td className="rt mono">{taxa(l.taxa)}</td>
                    <td className="rt mono">{l.taxaFuturo == null ? "—" : taxa(l.taxaFuturo)}</td>
                    <td className="rt mono">
                      {l.premioPP == null ? "—" : <b>{semUnidade(l.premioPP)}</b>}
                      {l.media && (
                        <>
                          <br />
                          <span className="linha-menor">média {semUnidade(l.media.pp)}</span>
                        </>
                      )}
                    </td>
                  </>
                ) : (
                  <>
                    <td className="rt mono">{l.parado ? pct(l.parado.carregoPct) : "—"}</td>
                    <td className={`rt mono ${l.parado ? sinal(l.parado.rolagemPct) : ""}`}>{l.parado ? pct(l.parado.rolagemPct) : "—"}</td>
                    <td className="rt mono">{l.parado ? <b>{pct(l.parado.totalPct)}</b> : "—"}</td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="section-sub tbl-nota">
        {leitura === "premio"
          ? "Prêmio = Tesouro − futuro, em pontos percentuais; embaixo, a média dos pregões coletados."
          : `Se a curva de futuros ficar onde está por 12 meses — hipótese, não previsão. ${
              real ? "Acima da inflação, bruto" : "Bruto"
            } de imposto. Sem leitura quando o título vence antes ou a curva não alcança o prazo.`}
      </p>
    </>
  );
}

// ---------- No Detalhe: um título ----------

export function ContraFuturoDoTitulo({ c, tipo, taxaDoTitulo }) {
  if (!c) return null;
  const real = String(tipo).startsWith("ipca");
  const p = c.parado;
  return (
    <>
      <h2 className="section-title">
        Contra o mercado futuro
        <Explica titulo="Contra o mercado futuro">
          <Metodo />
        </Explica>
      </h2>
      <div className="statgrid">
        <div className="stat">
          <div className="k">este título</div>
          <div className="v">{taxa(taxaDoTitulo)}</div>
        </div>
        <div className="stat">
          <div className="k">{c.ativo === "DAP" ? "DAP" : "DI futuro"}</div>
          <div className="v">{taxa(c.taxaFuturo)}</div>
        </div>
        <div className="stat">
          {/* A unidade vai no rótulo: "+0,10 p.p." não cabe num terço de
              tela de telefone e quebrava em duas linhas. */}
          <div className="k">prêmio (p.p.)</div>
          <div className="v">{semUnidade(c.premioPP)}</div>
        </div>
      </div>
      <p className="section-sub">
        Contra o {NOME_DO_FUTURO[c.ativo] || "futuro"} no mesmo prazo, com os preços de {dataBR(c.data)} nas
        duas pontas.
        {c.media && (
          <>
            {" "}
            Na média de {c.media.pregoes} pregões o prêmio foi de <span className="mono">{pp(c.media.pp)}</span>.
          </>
        )}{" "}
        <strong>Não é sinal de compra</strong>: parte da diferença é permanente.
      </p>

      {p && (
        <>
          <div className="statgrid">
            <div className="stat">
              <div className="k">carrego</div>
              <div className="v">{pct(p.carregoPct)}</div>
            </div>
            <div className="stat">
              <div className="k">rolagem</div>
              <div className={`v ${sinal(p.rolagemPct)}`}>{pct(p.rolagemPct)}</div>
            </div>
            <div className="stat">
              <div className="k">em 12 meses</div>
              <div className="v">{pct(p.totalPct)}</div>
            </div>
          </div>
          <p className="section-sub">
            Se a curva de futuros ficar onde está até {dataBR(p.ate)}: com um ano a menos de
            prazo, a taxa do título iria de <span className="mono">{taxa(p.taxaHoje)}</span> a{" "}
            <span className="mono">{taxa(p.taxaRolada)}</span>. {real ? "Acima da inflação, bruto" : "Bruto"} de
            imposto. <strong>Hipótese, não previsão.</strong>
          </p>
        </>
      )}
    </>
  );
}
