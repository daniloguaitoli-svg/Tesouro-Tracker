// components/Calculadora.jsx — "e se a taxa mexer?".
//
// É a tela que justifica a duration existir no app. A pergunta prática de quem
// carrega NTN-B longa não é "qual a taxa hoje", é: se a taxa real subir 1 ponto,
// quanto isso tira da minha posição HOJE — e quanto muda o que eu recebo lá na
// frente. Duration e convexidade respondem a primeira; a taxa composta responde
// a segunda.
//
// A conta pesada (descontar o fluxo inteiro) é do servidor: cada título já chega
// com duration modificada, convexidade e renda de cupom. Aqui só se multiplica,
// para o número mexer enquanto o usuário digita — mesmo padrão do Conversor do
// Cana-Tracker.
import { useMemo, useState } from "react";
import { reais, pct, num, taxa, anos, pp, dataBR, hojeSP } from "../format.js";
import { liquidoNoVencimento, diasCorridosEntre, FAIXAS_IR, CUSTODIA_B3_AA, PRAZO_IOF_DIAS, CONFERIDO_EM } from "../impostos.js";
import { AguardandoColeta } from "./States.jsx";
import { Explica } from "./Explica.jsx";

// DUPLICADOS DE PROPÓSITO: espelham CUPOM_SEMESTRAL_NTNB e _NTNF em
// server/util.js. server/ e src/ nunca se importam, então estes valores são
// copiados à mão e scripts/verificar.mjs confere que os lados continuam iguais.
const CUPOM_SEMESTRAL_NTNB = 0.029563;
const CUPOM_SEMESTRAL_NTNF = 0.048809;

const DELTAS = [-2, -1, -0.5, 0.5, 1, 2];

// "10.000,50" ou "4,5" -> número. Vazio ou texto que não é número -> null,
// para a conta dizer que falta o dado em vez de tratar o campo como zero.
function numeroBR(texto) {
  const limpo = String(texto ?? "").trim().replace(/\./g, "").replace(",", ".");
  if (!limpo) return null;
  const n = Number(limpo);
  return Number.isFinite(n) ? n : null;
}

// A tabela do imposto por extenso, lida das mesmas faixas que fazem a conta:
// uma alíquota digitada num parágrafo continuaria lá depois de a lei mudar.
// 15% e não 15,0%: a casa decimal só aparece na alíquota que tem uma. A
// conta é em milésimos porque
// 0,15 × 100 dá 15,000000000000002 em ponto flutuante.
const aliquotaBR = (a) => `${num(a * 100, Math.round(a * 1000) % 10 === 0 ? 0 : 1)}%`;

function TabelaIR() {
  let de = 0;
  return (
    <ul>
      {FAIXAS_IR.map((f) => {
        const prazo = !Number.isFinite(f.ateDias) ? `acima de ${de} dias` : de === 0 ? `até ${f.ateDias} dias` : `de ${de + 1} a ${f.ateDias} dias`;
        de = f.ateDias;
        return (
          <li key={f.aliquota}>
            {prazo}: <span className="mono">{aliquotaBR(f.aliquota)}</span>
          </li>
        );
      })}
    </ul>
  );
}

export function Calculadora({ dados }) {
  // A LFT fica fora da calculadora: pós-fixada, sem duration — a pergunta
  // "e se a taxa mexer?" não se aplica a ela nesta escala.
  const todos = useMemo(
    () => (dados.categorias || []).flatMap((c) => c.itens).filter((t) => t.tipo !== "selic"),
    [dados]
  );
  const [slug, setSlug] = useState(() => (dados.destaques?.[0] || todos[0])?.slug || "");
  const [valor, setValor] = useState("10000");
  const [delta, setDelta] = useState(1);
  // A inflação suposta do líquido de um IPCA+ (ver src/impostos.js). Começa
  // no IPCA dos últimos 12 meses — o único número de inflação que o app já
  // mostra — e é um campo porque é uma suposição de quem usa, não um dado.
  const ipca12m = dados.macro?.indicadores?.ipca?.acumulado12m ?? null;
  const [inflacao, setInflacao] = useState(() => (ipca12m == null ? "" : num(ipca12m, 1)));

  const t = todos.find((x) => x.slug === slug) || null;
  const eurbrl = dados.macro?.indicadores?.eurbrl?.valor ?? null;

  const conta = useMemo(() => {
    if (!t || t.taxa == null) return null;
    const v = Number(String(valor).replace(/\./g, "").replace(",", ".")) || 0;
    const dmod = t.duration?.modificada;
    const conv = t.duration?.convexidade;
    if (dmod == null) return null;

    // ΔP/P ≈ −D_mod·Δy + ½·C·Δy² — a mesma fórmula do servidor, aplicada ao
    // Δ que o usuário escolheu.
    const dy = delta / 100;
    const variacaoPct = (-dmod * dy + 0.5 * (conv ?? 0) * dy * dy) * 100;
    const impacto = v * (variacaoPct / 100);

    // Para os IPCA+ o valor no vencimento sai em PODER DE COMPRA DE HOJE (a
    // correção pelo IPCA vem por cima). Para os prefixados a taxa é NOMINAL:
    // o valor projetado é em reais correntes do futuro, e a inflação do
    // período corre por conta do investidor — o rótulo na tela muda junto.
    const y = t.taxa / 100;
    const futuroReal = v * Math.pow(1 + y, t.anosAteVencer);

    return {
      v,
      variacaoPct,
      impacto,
      depois: v + impacto,
      futuroReal,
      ganhoReal: futuroReal - v,
      rendaCupomAno: t.rendaCupomAnualPct != null ? v * (t.rendaCupomAnualPct / 100) : null,
    };
  }, [t, valor, delta]);

  if (dados.pendente) return <AguardandoColeta />;
  if (!todos.length) return <AguardandoColeta />;

  const ehPrefixado = t?.tipo === "prefixado" || t?.tipo === "prefixado-juros";

  // DEPOIS DO IMPOSTO — só para título sem cupom, que tem um pagamento e uma
  // alíquota. Com cupom o imposto é cobrado a cada pagamento e a conta é
  // outra; a tela diz isso em vez de aproximar.
  const diasAteVencer = t ? diasCorridosEntre(hojeSP(), t.vencimento) : null;
  const inflacaoAA = ehPrefixado ? null : numeroBR(inflacao);
  const faltaInflacao = !ehPrefixado && inflacaoAA == null;
  const liquido =
    conta && t && !t.comCupom && !faltaInflacao
      ? liquidoNoVencimento({
          investido: conta.v,
          taxaAA: t.taxa / 100,
          anosUteis: t.anosAteVencer,
          diasCorridos: diasAteVencer,
          inflacaoAA: ehPrefixado ? null : inflacaoAA / 100,
        })
      : null;
  // A taxa de um IPCA+ é REAL (acima da inflação) e a de um prefixado é NOMINAL.
  // Chamar as duas de "taxa real" era o erro que esta tela cometia em quatro
  // lugares — os números sempre estiveram certos, mas o rótulo dizia que um
  // prefixado a 14% rende 14% ACIMA do IPCA, que é a leitura mais cara possível.
  // Um rótulo só, derivado do tipo, para os quatro pontos não voltarem a divergir.
  const rotuloTaxa = ehPrefixado ? "taxa nominal" : "taxa real";

  // DUAS COLUNAS em tela larga (.duas-colunas): o formulário à esquerda, com
  // a largura de um formulário, e os resultados à direita. Num quadro de
  // 1.200px o campo "Valor investido" ia de uma ponta à outra para receber
  // seis dígitos. No celular as duas colunas voltam a ser uma, nesta ordem.
  return (
    <div className="duas-colunas">
      <div className="coluna-form">
      <h2 className="section-title">Sensibilidade a juros</h2>
      <p className="section-sub">
        Quanto uma mudança na {rotuloTaxa} mexe na posição hoje, e o que ela entrega até o
        vencimento.
      </p>

      <div className="card">
        <label className="campo">
          <span>Vencimento</span>
          <select className="select" value={slug} onChange={(e) => setSlug(e.target.value)}>
            {todos.map((x) => (
              <option key={x.slug} value={x.slug}>
                {x.nome} — {taxa(x.taxa)}
              </option>
            ))}
          </select>
        </label>

        <label className="campo">
          <span>Valor investido (R$)</span>
          <input
            className="input"
            inputMode="decimal"
            value={valor}
            onChange={(e) => setValor(e.target.value)}
            aria-label="Valor investido em reais"
          />
        </label>

        <span className="label">Se a {rotuloTaxa} variar</span>
        <div className="chips" style={{ marginTop: 6 }}>
          {DELTAS.map((d) => (
            <button key={d} className="chip" aria-pressed={delta === d} onClick={() => setDelta(d)}>
              {pp(d, 1)}
            </button>
          ))}
        </div>
      </div>
      </div>

      <div className="coluna-conteudo">
      {!conta ? (
        <div className="note">Este vencimento está sem taxa no arquivo — escolha outro.</div>
      ) : (
        <>
          {/* O MÉTODO MORA NO ⓘ DO "IMPACTO HOJE", não no título da tela: é
              destes dois números que ele fala. */}
          <h2 className="section-title">
            Impacto hoje
            <Explica titulo="Impacto hoje">
              <p>
                A variação do preço sai da duration modificada e da convexidade do título:
                ΔP/P ≈ −D·Δy + ½·C·Δy². É uma aproximação de segunda ordem, não uma
                reprecificação exata — boa para movimentos do tamanho dos desta tela.
              </p>
              <p>
                Por isso 2 p.p. não é o dobro de 1 p.p.: a convexidade entra ao quadrado, então
                a alta tira menos e a queda soma mais do que dobrar diria.
              </p>
              <p>Taxa e preço andam em sentidos opostos: a taxa sobe, o título vale menos hoje.</p>
              <p>
                O Tesouro Selic fica de fora: é pós-fixado, e a pergunta "e se a taxa mexer?"
                não se aplica a ele nesta escala.
              </p>
            </Explica>
          </h2>
          <div className="grid grid-2" style={{ marginTop: 0 }}>
            <div className="card">
              <div className="label">Variação do preço</div>
              <div className={`big ${conta.variacaoPct >= 0 ? "up" : "down"}`}>{pct(conta.variacaoPct)}</div>
              <div className="label">com {pp(delta, 1)} na {rotuloTaxa}</div>
            </div>
            <div className="card">
              <div className="label">Em reais</div>
              <div className={`big ${conta.impacto >= 0 ? "up" : "down"}`}>{reais(conta.impacto)}</div>
              <div className="label">posição passa a {reais(conta.depois)}</div>
            </div>
          </div>

          <h2 className="section-title">
            Até o vencimento
            <Explica titulo="O que esta conta não sabe">
              {ehPrefixado ? (
                <p>
                  O valor no vencimento está em reais nominais: a taxa prefixada é cheia, e quanto
                  dela a inflação vai comer ninguém sabe hoje — esse é exatamente o risco do
                  prefixado.
                </p>
              ) : (
                <p>
                  O valor no vencimento está em poder de compra de hoje: a correção pelo IPCA vem
                  por cima disso, e projetar em reais nominais exigiria adivinhar a inflação
                  futura.
                </p>
              )}
              {t.comCupom && (
                <p>
                  O valor final supõe que os cupons sejam reinvestidos à mesma {rotuloTaxa}. Na
                  prática eles caem na conta e podem render outra coisa.
                </p>
              )}
              <p>
                Supõe também que o título seja levado até o vencimento: vendido antes, o valor
                depende da taxa do dia da venda — que é o que o "Impacto hoje" acima mede.
              </p>
              <p>Prazo em dias úteis/252, a convenção do Tesouro e da ANBIMA.</p>
            </Explica>
          </h2>
          {/* Bruto de imposto fica NA TELA: o imposto leva uma fatia do ganho
              (a tabela mora em src/impostos.js), e é a ressalva que mais muda
              a leitura dos dois números abaixo. Para título sem cupom a frase
              aponta o cartão do líquido, que vem em seguida. */}
          <p className="section-sub">
            Valores brutos de imposto de renda e de taxa de custódia
            {t.comCupom ? "." : " — o que sobra depois do imposto vem logo abaixo."}
          </p>
          <div className="grid grid-2" style={{ marginTop: 0 }}>
            <div className="card">
              <div className="label">
                Valor em {anos(t.anosAteVencer)}, {ehPrefixado ? "em reais nominais" : "a preços de hoje"}
              </div>
              <div className="big">{reais(conta.futuroReal)}</div>
              <div className="label up">
                {pct((conta.ganhoReal / (conta.v || 1)) * 100)} de ganho {ehPrefixado ? "nominal" : "real"}
              </div>
              {eurbrl && (
                <div className="label" style={{ marginTop: 4 }}>
                  ≈ € {num(conta.futuroReal / eurbrl)} ao câmbio de hoje
                </div>
              )}
            </div>
            <div className="card">
              <div className="label">{t.comCupom ? "Renda de cupom por ano" : "Pagamentos até lá"}</div>
              <div className="big">{t.comCupom ? reais(conta.rendaCupomAno) : "1"}</div>
              <div className="label">
                {t.comCupom
                  ? `${num(t.rendaCupomAnualPct)}% sobre o investido · cupom de ${ehPrefixado ? "10" : "6"}% a.a. (${num((ehPrefixado ? CUPOM_SEMESTRAL_NTNF : CUPOM_SEMESTRAL_NTNB) * 100, 4)}% por semestre)`
                  : "pagamento único no vencimento — nada entra antes"}
              </div>
            </div>
          </div>

          {t.comCupom ? (
            <p className="section-sub liquido-nota">
              Com juros semestrais o imposto é cobrado a cada pagamento: o líquido não é calculado
              aqui.
              <Explica titulo="Imposto num título com cupom">
                <p>
                  Num título sem cupom há um pagamento só, no vencimento, e uma alíquota só — é a
                  conta que esta tela faz. Num título com juros semestrais, cada cupom tem
                  imposto retido quando é pago, pela alíquota do prazo desde a compra:
                </p>
                <TabelaIR />
                <p>
                  Os primeiros cupons pagam a alíquota mais alta e os seguintes vão caindo até a
                  mais baixa. {!ehPrefixado && "E o valor de cada cupom depende da inflação até a data dele. "}
                  Dá para aproximar essa soma; não dá para aproximá-la e chamar o resultado de
                  líquido.
                </p>
                <p>
                  A taxa de custódia da B3, de {num(CUSTODIA_B3_AA * 100, 2)}% ao ano sobre o
                  valor do título, é descontada dos próprios cupons.
                </p>
                <p className="explica-fonte">
                  Lei 11.033/2004, art. 1º; tabela “Tributação de 2026” da Receita Federal;
                  tarifas de Tesouro Direto da B3. Conferido em {dataBR(CONFERIDO_EM)}.
                </p>
              </Explica>
            </p>
          ) : (
            <div className="card liquido">
              <div className="label liquido-titulo">
                Depois do imposto de renda, {ehPrefixado ? "em reais nominais" : "a preços de hoje"}
                <Explica titulo="Depois do imposto de renda">
                  <p>
                    O imposto de renda é retido no vencimento, sobre o ganho — nunca sobre o
                    valor investido. A alíquota depende do prazo, em dias corridos, entre a
                    compra e o resgate:
                  </p>
                  <TabelaIR />
                  <p>
                    A conta supõe a compra hoje e o título levado até o vencimento
                    {diasAteVencer != null && <> — {num(diasAteVencer, 0)} dias corridos</>}.
                  </p>
                  {!ehPrefixado && (
                    <p>
                      <strong>Por que a inflação entra.</strong> O imposto incide sobre o ganho
                      nominal: a correção pelo IPCA também é tributada. Quanto mais inflação
                      houver até o vencimento, maior a parte do ganho real que o imposto leva —
                      então não existe líquido “a preços de hoje” sem supor uma inflação. O campo
                      começa no IPCA dos últimos 12 meses; troque pelo número que você espera.
                    </p>
                  )}
                  <p>
                    <strong>Fica de fora a taxa de custódia da B3:</strong>{" "}
                    {num(CUSTODIA_B3_AA * 100, 2)}% ao ano sobre o valor do título, cobrada a
                    cada semestre — cerca de {reais(conta.v * CUSTODIA_B3_AA)} por ano sobre o
                    valor investido, crescendo com o título. Ela é cobrada ao longo do caminho, e
                    o caminho do preço até o vencimento ninguém sabe hoje.
                  </p>
                  <p>
                    Vendido antes do vencimento, o prazo é outro, o preço é o do dia e a alíquota
                    pode ser maior. Resgates em menos de {PRAZO_IOF_DIAS} dias pagam também IOF.
                  </p>
                  <p className="explica-fonte">
                    Lei 11.033/2004, art. 1º; tabela “Tributação de 2026” da Receita Federal;
                    tarifas de Tesouro Direto da B3. Conferido em {dataBR(CONFERIDO_EM)}. Regra
                    de imposto muda por lei.
                  </p>
                </Explica>
              </div>

              {!ehPrefixado && (
                <label className="campo campo-inflacao">
                  <span>Inflação suposta até o vencimento (% ao ano)</span>
                  <input
                    className="input"
                    inputMode="decimal"
                    value={inflacao}
                    onChange={(e) => setInflacao(e.target.value)}
                    aria-label="Inflação suposta até o vencimento, em % ao ano"
                  />
                </label>
              )}

              {liquido ? (
                <>
                  <div className="big">{reais(liquido.liquido)}</div>
                  <div className="label">
                    imposto de {aliquotaBR(liquido.aliquota)} sobre o ganho
                    {ehPrefixado ? "" : " nominal"}: <span className="mono">{reais(liquido.imposto)}</span>
                    {/* A alíquota é sobre o ganho NOMINAL; medida contra o ganho
                        real, a fatia é maior — e é esse o número que diz o
                        tamanho da mordida num IPCA+. */}
                    {!ehPrefixado && conta.ganhoReal > 0 && (
                      <> — {num((liquido.imposto / conta.ganhoReal) * 100, 0)}% do ganho real</>
                    )}
                  </div>
                  <div className="label" style={{ marginTop: 4 }}>
                    {rotuloTaxa} líquida de <span className="mono">{taxa(liquido.taxaLiquidaAA * 100)}</span> a.a.,
                    contra <span className="mono">{taxa(t.taxa)}</span> bruta
                  </div>
                </>
              ) : (
                <div className="label">
                  {faltaInflacao
                    ? "Informe a inflação suposta para ver o valor líquido."
                    : diasAteVencer != null && diasAteVencer < PRAZO_IOF_DIAS
                      ? `Vence em menos de ${PRAZO_IOF_DIAS} dias: o resgate pagaria também IOF, que esta conta não cobre.`
                      : "Informe um valor investido para ver o líquido."}
                </div>
              )}
            </div>
          )}
        </>
      )}
      </div>
    </div>
  );
}
