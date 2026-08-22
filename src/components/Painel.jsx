// components/Painel.jsx — a primeira tela: os vencimentos acompanhados de
// perto, a moldura macro e o aviso de dado velho.
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

function CartaoTitulo({ t, onOpen }) {
  return (
    <button className="card" onClick={() => onOpen(t.slug)} style={{ textAlign: "left", cursor: "pointer", font: "inherit", color: "inherit" }}>
      <div className="label">{t.nome}</div>
      <div className="big">
        {taxa(t.taxa)} <span className="unit">{unidadeTaxa(t.tipo)}</span>
      </div>
      <div className={`delta ${sinalTaxa(t.taxaVarPP)}`}>
        {pp(t.taxaVarPP)} na taxa {t.puVarPct != null && <span className={sinal(t.puVarPct)}>· {pct(t.puVarPct)} no preço</span>}
      </div>
      <div className="durbar">
        <span className="label" style={{ minWidth: 74 }}>duration {anos(t.duration?.macaulay)}</span>
        <span className="trilho">
          {/* Escala até 20 anos: cobre de uma NTN-B curta à 2060 com cupom. */}
          <i className="forte" style={{ width: `${Math.min(100, ((t.duration?.macaulay ?? 0) / 20) * 100)}%` }} />
        </span>
      </div>
      <div className="label" style={{ marginTop: 6 }}>
        se a taxa subir 1 p.p.: <span className={sinal(t.duration?.variacaoPor1pp)}>{pct(t.duration?.variacaoPor1pp)}</span> no preço
      </div>
      <div className="pricedate" style={{ marginTop: 6 }}>
        PU {reais(t.pu)} · {dataBR(t.data)}
        {t.desatualizado && <span className="stale" style={{ marginLeft: 6 }}>desatualizado</span>}
      </div>
    </button>
  );
}

// As duas janelas de variação, lado a lado. Cada uma leva a data de onde a
// comparação parte — "12 meses" nunca cai exatamente 365 dias atrás (fim de
// semana, feriado), e mostrar a data de origem evita fingir precisão.
// `mostrar12m` fica falso quando o número grande do cartão JÁ é a variação de
// 12 meses (Ibovespa) — repetir logo abaixo seria ruído.
function Janelas({ v12m, v1sem, mostrar12m = true }) {
  if (!v12m && !v1sem) return null;
  return (
    <div className="varlinha">
      {mostrar12m && (
        <span>
          12 meses <b className={sinal(v12m?.pct)}>{v12m ? pct(v12m.pct) : "—"}</b>
        </span>
      )}
      <span>
        1 semana <b className={sinal(v1sem?.pct)}>{v1sem ? pct(v1sem.pct) : "—"}</b>
      </span>
    </div>
  );
}

// Cartão de um indicador da moldura. Renderiza SEMPRE, mesmo sem dado: mostra
// "—" em vez de sumir. Duas razões — a regra da casa ("dado ausente é —, nunca
// omitido") e a grade: um cartão que some reflui a linha e desfaz o
// pareamento pedido (IPCA|Ibovespa, EUR|USD, CDI|Selic).
//
// `comoVariacao` troca o número grande pelo retorno de 12 meses (é o caso do
// Ibovespa: o nível do índice em pontos não diz nada sozinho — 171.032 só
// significa alguma coisa comparado com onde estava).
function CartaoMacro({ titulo, ind, casas = 2, sufixo = "%", rodape, comoVariacao = false, janelas = false }) {
  const v12m = ind?.var12m;
  const v1sem = ind?.var1sem;
  const grande = comoVariacao
    ? v12m
      ? pct(v12m.pct)
      : "—"
    : ind?.valor == null
      ? "—"
      : `${num(ind.valor, casas)}${sufixo}`;

  return (
    <div className="card">
      <div className="label">{titulo}</div>
      <div className={`big ${comoVariacao ? sinal(v12m?.pct) : ""}`}>{grande}</div>
      <div className={`label ${!comoVariacao && ind?.changePct != null ? sinal(ind.changePct) : ""}`}>
        {ind ? (
          comoVariacao ? (
            // A data de origem da comparação, não a de hoje: "12 meses" parte
            // do último pregão em ou antes de 365 dias atrás, e dizer qual é
            // evita fingir que a janela é exata.
            <>em 12 meses{v12m && <> · desde {dataBR(v12m.de)}</>}</>
          ) : (
            <>
              {ind.changePct != null && <>{pct(ind.changePct)} · </>}
              {rodape}
              {ind.data && <> {dataBR(ind.data)}</>}
            </>
          )
        ) : (
          "sem dados agora"
        )}
      </div>
      {janelas && <Janelas v12m={v12m} v1sem={v1sem} mostrar12m={!comoVariacao} />}
    </div>
  );
}

// A moldura macro, em três linhas de dois — nesta ordem, de propósito:
//   IPCA | Ibovespa     (a inflação que corrige a NTN-B, e a bolsa ao lado)
//   EUR/BRL | USD/BRL   (câmbio)
//   CDI | Selic         (o juro curto, que é a alternativa a comprar título)
// A grade é `grid-2`, então a ordem dos cartões É o pareamento das linhas.
// Em telas estreitas (<460px) ela colapsa para uma coluna e vira uma lista na
// mesma ordem — comportamento responsivo esperado, não perda do layout.
function Macro({ macro }) {
  const ind = macro?.indicadores || {};
  return (
    <>
      <div className="section-title">Moldura</div>
      <p className="section-sub">
        A NTN-B paga IPCA <em>mais</em> a taxa real. Estes números são o outro lado da conta.
      </p>
      <div className="grid grid-2" style={{ marginTop: 0 }}>
        <div className="card">
          <div className="label">IPCA acumulado 12 meses</div>
          <div className="big">
            {ind.ipca?.acumulado12m != null ? `${num(ind.ipca.acumulado12m)}%` : "—"}
          </div>
          <div className="label">
            {ind.ipca ? (
              <>último mês {num(ind.ipca.valor)}% · {dataBR(ind.ipca.data)}</>
            ) : (
              "sem dados agora"
            )}
          </div>
        </div>
        {/* O Ibovespa entra pela VARIAÇÃO, não pelo nível: "171.032 pontos" não
            informa nada sem referência; "+18% em 12 meses" informa. */}
        <CartaoMacro titulo="Ibovespa" ind={ind.ibovespa} comoVariacao janelas />

        <CartaoMacro titulo="EUR/BRL (PTAX)" ind={ind.eurbrl} casas={4} sufixo="" rodape="" janelas />
        <CartaoMacro titulo="USD/BRL (PTAX)" ind={ind.usdbrl} casas={4} sufixo="" rodape="" janelas />

        <CartaoMacro titulo="CDI" ind={ind.cdi} rodape="a.a. ·" />
        <CartaoMacro titulo="Selic meta" ind={ind.selic} rodape="a.a. ·" />
      </div>
    </>
  );
}

export function Painel({ dados, itens, onOpen, onIrParaTitulos }) {
  if (dados.pendente) return <AguardandoColeta />;
  const destaques = itens || [];
  // O aviso de preço velho segue a ESCOLHA do usuário, não a lista do catálogo
  // que o servidor mandou: avisar sobre um vencimento que a pessoa não
  // acompanha é ruído, e calar sobre um que ela acompanha é pior.
  const desatualizados = destaques.filter((t) => t.desatualizado).map((t) => t.nome);

  return (
    <div>
      {desatualizados.length > 0 && (
        <div className="stale-banner" role="status">
          <span aria-hidden="true">⚠</span>
          <span>
            <b>Cotações desatualizadas:</b> {desatualizados.join(", ")}. O arquivo do
            Tesouro é diário e só sai em dia útil — se persistir, confira o job de coleta.
          </span>
        </div>
      )}

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
        <div className="grid grid-2" style={{ marginTop: 0 }}>
          {destaques.map((t) => (
            <CartaoTitulo key={t.slug} t={t} onOpen={onOpen} />
          ))}
        </div>
      )}

      <Macro macro={dados.macro} />
    </div>
  );
}
