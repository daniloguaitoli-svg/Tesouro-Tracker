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
import { taxa, pct, pp, anos, reais, dataBR, sinal, sinalTaxa, num, unidadeTaxa } from "../format.js";
import { AguardandoColeta } from "./States.jsx";

// Um vencimento acompanhado, em três faixas de leitura: identidade à esquerda
// e taxa à direita, as variações como chips, e a duration numa régua.
//
// A taxa à direita existe para a COMPARAÇÃO: empilhados, os números grandes
// caem todos na mesma coluna e a diferença entre dois vencimentos se lê de
// relance. No layout anterior cada taxa começava onde o nome acabava.
function CartaoTitulo({ t, onOpen }) {
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

      <span className="chips">
        <Chip rotulo="taxa" valor={pp(t.taxaVarPP)} dir={sinalTaxa(t.taxaVarPP)} />
        <Chip rotulo="preço" valor={pct(t.puVarPct)} dir={sinal(t.puVarPct)} />
        <Chip rotulo="PU" valor={reais(t.pu)} />
      </span>

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
          {/* Régua de escala FIXA, 0 a 20 anos. Uma barra normalizada pelo
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
        // famílias). Antes a régua aparecia vazia, o que lia como dado
        // faltando em vez de grandeza que não existe.
        <span className="ct-dur ct-dur-nota">Pós-fixado: acompanha a Selic, quase sem risco de juros.</span>
      )}
    </button>
  );
}

// Um chip de variação. A cor vai só no NÚMERO, nunca no chip inteiro: pintar
// o rótulo junto faria "preço" parecer ser o que subiu ou caiu.
function Chip({ rotulo, valor, dir }) {
  const tom = dir === "up" || dir === "down" ? ` chip-${dir}` : "";
  return (
    <span className={`chip${tom}`}>
      {rotulo} <b className={`mono ${dir || ""}`}>{valor}</b>
    </span>
  );
}

// A faixa macro: os quatro números que emolduram a leitura dos títulos, numa
// tira só em vez de seis cartões em três linhas.
//
// Ibovespa e EUR/BRL saíram daqui, e não do app: a aba Mercado mostra os dois
// com as cinco janelas e mais quatro bolsas ao lado. No Painel eles disputavam
// altura com o que esta tela existe para mostrar, que são os vencimentos.
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
      rotulo: "CDI",
      valor: ind.cdi?.valor != null ? `${num(ind.cdi.valor)}%` : "—",
      titulo: ind.cdi ? `a.a. · ${dataBR(ind.cdi.data)}` : "sem dados agora",
    },
    {
      rotulo: "USD/BRL",
      valor: ind.usdbrl?.valor != null ? num(ind.usdbrl.valor, 4) : "—",
      titulo: ind.usdbrl ? `PTAX venda · ${dataBR(ind.usdbrl.data)}` : "sem dados agora",
    },
  ];

  return (
    <div className="faixa-macro">
      {celulas.map((c) => (
        <div key={c.rotulo} title={c.titulo}>
          <div className="fm-rotulo">{c.rotulo}</div>
          <div className="fm-valor mono">{c.valor}</div>
        </div>
      ))}
    </div>
  );
}

export function Painel({ dados, itens, onOpen, onIrParaTitulos }) {
  if (dados.pendente) return <AguardandoColeta />;
  const destaques = itens || [];
  return (
    <div>
      <FaixaMacro macro={dados.macro} />

      {/* O aviso de preço velho saiu daqui: agora é o selo do topo (SeloDados),
          que segue a mesma regra — só os vencimentos acompanhados. */}
      <div className="section-title">Acompanhados de perto</div>
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
        // Uma coluna, não duas: o cartão compacto tem chips e régua, e em 390px
        // dois por linha espremem as três faixas até nenhuma se ler.
        <div className="lista-cartoes">
          {destaques.map((t) => (
            <CartaoTitulo key={t.slug} t={t} onOpen={onOpen} />
          ))}
        </div>
      )}
    </div>
  );
}
