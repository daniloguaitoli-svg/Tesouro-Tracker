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
import { reais, pct, num, taxa, anos, pp } from "../format.js";
import { AguardandoColeta } from "./States.jsx";

// DUPLICADOS DE PROPÓSITO: espelham CUPOM_SEMESTRAL_NTNB e _NTNF em
// server/util.js. server/ e src/ nunca se importam, então estes valores são
// copiados à mão e scripts/verificar.mjs confere que os lados continuam iguais.
const CUPOM_SEMESTRAL_NTNB = 0.029563;
const CUPOM_SEMESTRAL_NTNF = 0.048809;

const DELTAS = [-2, -1, -0.5, 0.5, 1, 2];

export function Calculadora({ dados }) {
  // A LFT fica fora da calculadora: pós-fixada, sem duration — a pergunta
  // "e se a taxa mexer?" não se aplica a ela nesta régua.
  const todos = useMemo(
    () => (dados.categorias || []).flatMap((c) => c.itens).filter((t) => t.tipo !== "selic"),
    [dados]
  );
  const [slug, setSlug] = useState(() => (dados.destaques?.[0] || todos[0])?.slug || "");
  const [valor, setValor] = useState("10000");
  const [delta, setDelta] = useState(1);

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

  return (
    <div>
      <div className="section-title">Sensibilidade a juros</div>
      <p className="section-sub">
        Quanto uma mudança na taxa real mexe na posição hoje, e o que ela entrega até o
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

        <span className="label">Se a taxa real variar</span>
        <div className="chips" style={{ marginTop: 6 }}>
          {DELTAS.map((d) => (
            <button key={d} className="chip" aria-pressed={delta === d} onClick={() => setDelta(d)}>
              {pp(d, 1)}
            </button>
          ))}
        </div>
      </div>

      {!conta ? (
        <div className="note">Este vencimento está sem taxa no arquivo — escolha outro.</div>
      ) : (
        <>
          <div className="section-title">Impacto hoje</div>
          <div className="grid grid-2" style={{ marginTop: 0 }}>
            <div className="card">
              <div className="label">Variação do preço</div>
              <div className={`big ${conta.variacaoPct >= 0 ? "up" : "down"}`}>{pct(conta.variacaoPct)}</div>
              <div className="label">com {pp(delta, 1)} na taxa real</div>
            </div>
            <div className="card">
              <div className="label">Em reais</div>
              <div className={`big ${conta.impacto >= 0 ? "up" : "down"}`}>{reais(conta.impacto)}</div>
              <div className="label">posição passa a {reais(conta.depois)}</div>
            </div>
          </div>

          <div className="section-title">Até o vencimento</div>
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

          <div className="note">
            <strong>O que esta conta não sabe.</strong>{" "}
            {ehPrefixado ? (
              <>O valor no vencimento está em <em>reais nominais</em>: a taxa prefixada é cheia,
              e quanto dela a inflação vai comer ninguém sabe hoje — esse é exatamente o risco
              do prefixado.</>
            ) : (
              <>O valor no vencimento está em poder de compra de hoje: a correção pelo IPCA vem{" "}
              <em>por cima</em> disso, e projetar em reais nominais exigiria adivinhar a
              inflação futura.</>
            )} Os números são brutos de
            imposto de renda e de taxa de custódia. Para os títulos com cupom, o valor final
            supõe que os cupons sejam reinvestidos à mesma taxa real — na prática eles caem na
            conta e podem render outra coisa. E a sensibilidade é uma aproximação de segunda
            ordem (duration + convexidade), não uma reprecificação exata.
          </div>
        </>
      )}
    </div>
  );
}
