// components/Carteira.jsx — as compras que a pessoa registrou e o que valem.
//
// Responde a duas perguntas que o resto do app deixa para a pessoa fazer de
// cabeça: "quanto vale hoje o que eu tenho?" e "e se eu não vender?". As duas
// ficam lado a lado em cada título porque são a decisão: o preço de hoje sobe
// e desce com a taxa, o que se recebe no vencimento não.
//
// As contas moram em src/posicoes.js, não aqui — e ficam no NAVEGADOR de
// propósito: o servidor nunca recebe o que a pessoa tem. Esta tela só
// formata. O estado (a lista de lotes) mora no App, porque o Painel também
// mostra o resumo.
import { useMemo, useState } from "react";
import { reais, pct, num, anos, dataBR, sinal, hojeSP } from "../format.js";
import { resumirCarteira, montarLote } from "../posicoes.js";
import { CUSTODIA_B3_AA, CONFERIDO_EM } from "../impostos.js";
import { AguardandoColeta } from "./States.jsx";
import { Explica } from "./Explica.jsx";

// A unidade em que o "no vencimento" de cada família sai. Escrita por
// extenso ao lado do número, sempre: R$ 10.000 em reais de 2029 e R$ 10.000
// em reais de hoje são quantias diferentes com a mesma cara.
const UNIDADE = { nominal: "em reais nominais", hoje: "a preços de hoje" };

// 15% e não 15,0% — mesma regra da Calculadora.
const aliquotaBR = (a) => `${num(a * 100, Math.round(a * 1000) % 10 === 0 ? 0 : 1)}%`;
// Quantidade: até 4 casas, sem zeros à direita (1,25 e não 1,2500).
const quantidadeBR = (q) => String(Math.round(q * 1e4) / 1e4).replace(".", ",");

function Posicao({ g, onOpen, onRemover }) {
  if (g.semTitulo) {
    return (
      <div className="card posicao">
        <div className="posicao-topo">
          <b className="posicao-nome">{g.slug}</b>
        </div>
        <p className="section-sub">
          Este título saiu da lista — venceu. O que ele pagou no vencimento caiu na conta da
          corretora; o app não acompanha mais o preço dele.
        </p>
        <Lotes g={g} onRemover={onRemover} />
      </div>
    );
  }

  const t = g.titulo;
  const nv = g.noVencimento;
  return (
    <div className="card posicao">
      <div className="posicao-topo">
        <button className="posicao-nome" onClick={() => onOpen(t.slug)}>
          {t.nome}
        </button>
        <span className="posicao-qtd">
          <span className="mono">{quantidadeBR(g.quantidade)}</span> {g.quantidade === 1 ? "título" : "títulos"}
        </span>
      </div>

      <div className="posicao-numeros">
        <div>
          <div className="label">Vale hoje</div>
          <div className="posicao-valor mono">{reais(g.valorHoje)}</div>
          <div className="label">
            investido <span className="mono">{reais(g.investido)}</span>
          </div>
        </div>
        <div>
          <div className="label">Resultado</div>
          <div className={`posicao-valor mono ${sinal(g.resultado)}`}>{reais(g.resultado)}</div>
          <div className={`label ${sinal(g.resultado)}`}>
            <span className="mono">{pct(g.resultado == null ? null : (g.resultado / g.investido) * 100)}</span>
            {g.cupons > 0 && <span className="muted"> · com cupons</span>}
          </div>
        </div>
      </div>

      {g.cupons > 0 && (
        <p className="posicao-linha">
          Inclui <span className="mono">{reais(g.cupons)}</span> de cupons já recebidos, brutos de imposto.
        </p>
      )}
      {g.cuponsDesconhecidos && (
        <p className="posicao-linha aviso">
          O resultado não inclui os cupons recebidos ({g.cuponsDesconhecidos}): o ganho real é maior
          que o mostrado.
        </p>
      )}

      {/* AS DUAS SAÍDAS, uma por linha e na mesma ordem em todo cartão:
          vender hoje, ou não vender. */}
      <dl className="posicao-saidas">
        <div>
          <dt>Se vender hoje</dt>
          <dd>
            {g.seVender ? (
              <>
                <b className="mono">{reais(g.seVender.liquido)}</b> depois de{" "}
                <span className="mono">{reais(g.seVender.imposto)}</span> de imposto de renda
              </>
            ) : t.comCupom ? (
              <>
                <b className="mono">{reais(g.valorHoje)}</b> brutos — com cupom, o imposto da venda não é
                calculado aqui
              </>
            ) : g.algumComIOF ? (
              <>
                <b className="mono">{reais(g.valorHoje)}</b> brutos — há compra com menos de 30 dias, que
                paga também IOF
              </>
            ) : (
              "—"
            )}
          </dd>
        </div>
        <div>
          <dt>Se levar ao vencimento</dt>
          <dd>
            {nv ? (
              <>
                <b className="mono">{reais(nv.valor)}</b> {UNIDADE[nv.unidade]}, em {anos(t.anosAteVencer)}
                {nv.pagamentos > 0 && (
                  <>
                    {" "}
                    — <span className="mono">{reais(nv.cupom)}</span> por semestre em {nv.pagamentos} pagamentos,
                    mais o principal
                  </>
                )}
                {nv.liquido && (
                  <>
                    {" "}
                    · <span className="mono">{reais(nv.liquido.valor)}</span> depois do imposto de renda
                  </>
                )}
              </>
            ) : t.tipo === "selic" ? (
              "rende a Selic de cada dia até o vencimento — quanto isso dará, ninguém sabe hoje"
            ) : (
              // Sem taxa ou sem preço no arquivo não há valor de face para
              // multiplicar: um traço, e não a frase da Selic num título que
              // não é pós-fixado.
              "— sem taxa ou preço no arquivo para calcular"
            )}
          </dd>
        </div>
      </dl>

      <Lotes g={g} onRemover={onRemover} />
    </div>
  );
}

// As compras de um título, dobradas: o cartão responde pelo conjunto, e a
// lista serve para conferir e para apagar um registro errado.
function Lotes({ g, onRemover }) {
  return (
    <details className="dobra posicao-lotes">
      <summary>
        {g.lotes.length} {g.lotes.length === 1 ? "compra" : "compras"}
      </summary>
      <ul>
        {g.lotes.map((a) => (
          <li key={a.lote.id}>
            <span>
              <span className="mono">{dataBR(a.lote.data)}</span> ·{" "}
              <span className="mono">{quantidadeBR(a.lote.quantidade)}</span> por{" "}
              <span className="mono">{reais(a.lote.valor)}</span>
              {a.resultado != null && (
                <>
                  {" "}
                  · <span className={`mono ${sinal(a.resultado)}`}>{pct(a.resultadoPct)}</span>
                </>
              )}
            </span>
            <button
              className="btn btn-ghost"
              onClick={() => onRemover(a.lote.id)}
              aria-label={`Apagar a compra de ${dataBR(a.lote.data)}`}
            >
              Apagar
            </button>
          </li>
        ))}
      </ul>
    </details>
  );
}

function NovaCompra({ titulos, onAdicionar, falhouAoGuardar }) {
  const hoje = hojeSP();
  const [slug, setSlug] = useState(titulos[0]?.slug || "");
  const [data, setData] = useState(hoje);
  const [quantidade, setQuantidade] = useState("");
  const [valor, setValor] = useState("");
  const [erro, setErro] = useState(null);

  const adicionar = (e) => {
    e.preventDefault();
    const titulo = titulos.find((t) => t.slug === slug) || null;
    const r = montarLote({ slug, data, quantidade, valor }, titulo, hoje);
    if (r.erro) {
      setErro(r.erro);
      return;
    }
    setErro(null);
    onAdicionar(r.lote);
    setQuantidade("");
    setValor("");
  };

  return (
    <form className="card" onSubmit={adicionar} noValidate>
      <label className="campo">
        <span>Título</span>
        <select className="select" value={slug} onChange={(e) => setSlug(e.target.value)}>
          {titulos.map((t) => (
            <option key={t.slug} value={t.slug}>
              {t.nome}
            </option>
          ))}
        </select>
      </label>
      <label className="campo">
        <span>Data da compra</span>
        <input className="input" type="date" value={data} max={hoje} onChange={(e) => setData(e.target.value)} />
      </label>
      <div className="calc-grid">
        <label className="campo">
          <span>Quantidade de títulos</span>
          <input
            className="input"
            inputMode="decimal"
            placeholder="0,25"
            value={quantidade}
            onChange={(e) => setQuantidade(e.target.value)}
          />
        </label>
        <label className="campo">
          <span>Valor investido (R$)</span>
          <input
            className="input"
            inputMode="decimal"
            placeholder="1.000,00"
            value={valor}
            onChange={(e) => setValor(e.target.value)}
          />
        </label>
      </div>
      {erro && (
        <p className="form-erro" role="alert">
          {erro}
        </p>
      )}
      {falhouAoGuardar && (
        <p className="form-erro" role="alert">
          Este navegador não deixou guardar (modo privativo ou espaço cheio): a compra aparece agora,
          mas some ao fechar o app.
        </p>
      )}
      <button className="btn btn-primary" type="submit">
        Registrar compra
      </button>
    </form>
  );
}

export function Carteira({ dados, posicoes, onMudar, onOpen, falhouAoGuardar }) {
  const titulos = useMemo(() => (dados.categorias || []).flatMap((c) => c.itens), [dados]);
  const carteira = useMemo(
    () => resumirCarteira(posicoes, titulos, { desde: dados.historicoDesde }),
    [posicoes, titulos, dados.historicoDesde]
  );
  if (dados.pendente) return <AguardandoColeta />;

  const total = carteira.total;
  const dataDoPreco = titulos.reduce((m, t) => (t.data && t.data > m ? t.data : m), "");
  // Os números do ⓘ vêm do payload, não do texto: o valor de face de um
  // prefixado e o de um IPCA+ na data do preço.
  const facePrefixado = titulos.find((t) => t.face?.unidade === "nominal")?.face.valor ?? null;
  const faceIpca = titulos.find((t) => t.face?.unidade === "hoje")?.face.valor ?? null;

  const lista = (
    <div className="carteira-lista">
      {total && (
        <div className="card carteira-total">
          <div className="label carteira-total-titulo">
            Vale hoje
            <Explica titulo="Como a carteira é calculada">
              <p>
                <strong>Vale hoje</strong> é a quantidade que você registrou vezes o preço de recompra
                do Tesouro — o que ele paga a quem vende antes do vencimento, e o preço que este app
                acompanha. É o de {dataBR(dataDoPreco)}: há sempre ao menos um dia útil de atraso.
              </p>
              <p>
                <strong>Resultado</strong> é o valor de hoje, mais os cupons já recebidos, menos o que
                você investiu. Bruto: sem imposto de renda e sem a taxa de custódia da B3, de{" "}
                {num(CUSTODIA_B3_AA * 100, 2)}% ao ano.
              </p>
              <p>
                <strong>Se vender hoje</strong> desconta o imposto de renda sobre o ganho, pela
                alíquota do tempo desde cada compra (tabela conferida em {dataBR(CONFERIDO_EM)}; está
                no ⓘ da Calculadora). Só para título sem cupom, e sem a taxa de custódia.
              </p>
              <p>
                <strong>Se levar ao vencimento</strong> é o que os títulos ainda pagam:{" "}
                {facePrefixado != null ? reais(facePrefixado) : "o valor de face"} por título num
                prefixado, em reais da data do vencimento; e o valor nominal atualizado num IPCA+
                {faceIpca != null && <> (hoje, {reais(faceIpca)} por título)</>}, a preços de hoje — a
                inflação daqui até lá vem por cima. Esse valor do IPCA+ não vem pronto do Tesouro:
                sai do preço e da taxa do dia, e a mesma conta dá o mesmo valor em todos os
                vencimentos.
              </p>
              <p>
                O total soma só o que está na mesma moeda. O valor no vencimento não entra nele:
                reais de 2029 e reais de hoje não se somam.
              </p>
            </Explica>
          </div>
          <div className="big">{reais(total.valorHoje)}</div>
          <div className="label">
            investido <span className="mono">{reais(total.investido)}</span> · resultado{" "}
            <span className={`mono ${sinal(total.resultado)}`}>
              {reais(total.resultado)} ({pct(total.resultadoPct)})
            </span>
          </div>
          {/* Fica NA TELA: é o que muda a leitura do número de cima. */}
          <p className="section-sub carteira-ressalva">
            Preços de {dataBR(dataDoPreco)} · bruto de imposto de renda e de taxa de custódia.
            {total.foraDoTotal > 0 && <> {total.foraDoTotal} título(s) sem preço ficaram fora da soma.</>}
          </p>
        </div>
      )}

      {carteira.grupos.map((g) => (
        <Posicao key={g.slug} g={g} onOpen={onOpen} onRemover={(id) => onMudar((l) => l.filter((x) => x.id !== id))} />
      ))}
    </div>
  );

  const formulario = (
    <div className="carteira-form coluna-form">
      <h2 className="section-title">
        Registrar compra
        <Explica titulo="O que registrar, e onde isso fica">
          <p>
            Cada compra tem quatro números, e os quatro estão no extrato do Tesouro Direto ou da
            corretora: o título, a data, a quantidade de títulos (quase sempre uma fração, como
            0,25) e o valor investido.
          </p>
          <p>
            A quantidade é pedida, e não calculada do valor, porque o preço de compra é um pouco
            maior que o preço de recompra que o app acompanha. Dividir um pelo outro daria uma
            quantidade errada.
          </p>
          <p>
            <strong>Fica só neste aparelho.</strong> O app não tem conta nem servidor para isso, e o
            código dele é público: o que você tem não é enviado a lugar nenhum. A outra face disso
            é que trocar de aparelho ou limpar os dados do navegador apaga a lista — o extrato da
            corretora continua sendo o registro oficial.
          </p>
        </Explica>
      </h2>
      <p className="section-sub">Guardado só neste aparelho. Nada do que você registra sai dele.</p>
      <NovaCompra titulos={titulos} onAdicionar={(lote) => onMudar((l) => [...l, lote])} falhouAoGuardar={falhouAoGuardar} />
    </div>
  );

  if (!carteira.grupos.length) {
    return (
      <div className="carteira vazia">
        <div className="note">
          Registre aqui o que você comprou para ver quanto vale hoje e quanto renderá se levado ao
          vencimento.
        </div>
        {formulario}
      </div>
    );
  }

  // Em tela larga as posições ficam à esquerda, com a largura que os números
  // pedem, e o formulário à direita, estreito — é o inverso da Calculadora
  // porque aqui o que se lê todo dia são as posições; registrar uma compra é
  // o que se faz de vez em quando.
  return (
    <div className="carteira duas-colunas form-a-direita">
      <div className="coluna-conteudo">
        <h2 className="section-title">Minhas posições</h2>
        {lista}
      </div>
      {formulario}
    </div>
  );
}
