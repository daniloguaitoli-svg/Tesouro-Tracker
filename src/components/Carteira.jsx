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
import { useMemo, useRef, useState } from "react";
import { reais, pct, pp, num, anos, dataBR, dataCurtaBR, sinal, hojeSP } from "../format.js";
import { resumirCarteira, montarLote, riscoDaCarteira, pioresMomentos, calendarioDeRecebimentos, compararComCdi, exportarPosicoes, lerBackup } from "../posicoes.js";
import { lerPlanilha } from "../planilha.js";
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

function Posicao({ g, onOpen, onRemover, cdi }) {
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
      {cdi && (
        <p className="posicao-linha">
          No mesmo período o CDI rendeu <span className="mono">{reais(cdi.rendimento)}</span> (
          <span className="mono">{pct(cdi.pct)}</span>) sobre o que você investiu.
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

// O RISCO DA CARTEIRA: como ela está repartida e o que um ponto de juro faz
// com ela. As contas são de posicoes.js; aqui é só a tela.
// OS PIORES MOMENTOS DO HISTÓRICO, repetidos no que a pessoa tem hoje.
//
// Mora no cartão de risco, logo abaixo do cenário de 1 ponto, porque é a
// resposta ao que aquele cenário não diz: "1 ponto em tudo" nunca aconteceu;
// isto aconteceu. A escolha das janelas e a conta são de posicoes.js e do
// servidor; aqui é a tela.
const ROTULO_DO_MOMENTO = { dia: "Pior dia", semana: "Pior semana", mes: "Pior mês" };

function Momentos({ piores, desde }) {
  if (!piores) return null;
  const quando = (m) => (m.horizonte === "dia" ? dataBR(m.ate) : `${dataCurtaBR(m.de)} a ${dataBR(m.ate)}`);
  // Só as famílias que a carteira tem: a alta do Prefixado não interessa a
  // quem só tem IPCA+, e mostrá-la sugeriria que entrou na conta.
  const altas = (m) =>
    [piores.temReal && `IPCA+ ${pp(m.realPP)}`, piores.temNominal && `Prefixado ${pp(m.nominalPP)}`].filter(Boolean).join(" · ");
  return (
    <div className="momentos">
      <div className="label momentos-titulo">
        <span>Se os piores momentos se repetissem</span>
        <Explica titulo="Os piores momentos do histórico">
          <p>
            O app procura, em todo o histórico de preços{desde ? <> (desde {dataBR(desde)})</> : null}, o dia,
            a semana e o mês em que as taxas mais subiram — e mostra, de cada um, o que mais
            tiraria da sua carteira.
          </p>
          <p>
            O que se repete é a <strong>alta de taxa</strong> daquele período, não o preço: o
            IPCA+ e o Prefixado não sobem do mesmo tamanho, e o curto não mexe como o longo.
            Cada título seu é recalculado com a taxa de hoje mais a alta que títulos do mesmo
            tipo e de prazo parecido tiveram naqueles dias. As altas mostradas em cada linha
            são a média da família.
          </p>
          <p>
            O Tesouro Selic entra como se não mexesse. Numa crise de verdade ele também pode
            cair um pouco, e esta conta não vê isso.
          </p>
          <p>
            Não é o pior possível — é o pior que o histórico do app contém — e não é previsão.
            É o valor de hoje, bruto: levado ao vencimento, cada título paga o que foi
            contratado, qualquer que seja o caminho do preço até lá.
          </p>
        </Explica>
      </div>
      {piores.momentos.map((m) => (
        <div className="momento" key={m.id}>
          <div className="momento-topo">
            <div>
              <div className="momento-nome">{ROTULO_DO_MOMENTO[m.horizonte]}</div>
              <div className="linha-menor mono">{quando(m)}</div>
            </div>
            <div className="momento-valor">
              <div className={`mono ${sinal(m.valor)}`}>{reais(m.valor)}</div>
              <div className="linha-menor mono">{pct(m.pct)}</div>
            </div>
          </div>
          {/* As altas numa linha própria, da largura do cartão: ao lado do
              valor elas quebravam em três linhas num telefone. */}
          <div className="linha-menor mono momento-altas">{altas(m)}</div>
        </div>
      ))}
      {/* Fica NA TELA: sem isto a linha lê como "o máximo que dá para perder". */}
      <p className="posicao-linha">
        As altas de taxa daqueles períodos, aplicadas ao que você tem hoje. Não é o pior
        possível, nem previsão.
      </p>
    </div>
  );
}

function Risco({ risco, piores, desde }) {
  if (!risco) return null;
  return (
    <>
      <h2 className="section-title">
        Risco de juros
        <Explica titulo="Risco de juros da carteira">
          <p>
            <strong>Duration</strong> é o prazo médio em que o dinheiro volta, pesado pelo valor de
            hoje de cada título — e a régua de quanto a carteira reage a juros. O Tesouro Selic
            entra como zero: pós-fixado, o preço dele quase não se move com o juro de mercado.
          </p>
          <p>
            <strong>O cenário de 1 ponto</strong> soma o efeito em cada título se todas as taxas
            subissem (ou caíssem) 1 ponto percentual ao mesmo tempo, com a mesma conta da tela de
            cada título. É um cenário, não uma previsão: na prática o juro real (IPCA+) e o
            nominal (Prefixado) não andam juntos nem do mesmo tamanho.
          </p>
          <p>
            Isso é o valor de hoje. Levado ao vencimento, cada título paga o que foi contratado,
            qualquer que seja o caminho do preço até lá.
          </p>
        </Explica>
      </h2>
      <div className="card">
        <div className="risco-numeros">
          <div>
            <div className="label">Duration</div>
            <div className="posicao-valor mono">{anos(risco.duration)}</div>
          </div>
          <div>
            <div className="label">Se as taxas subirem 1 p.p.</div>
            <div className={`posicao-valor mono ${sinal(risco.mais1pp?.valor)}`}>{reais(risco.mais1pp?.valor ?? null)}</div>
            <div className="label mono">{pct(risco.mais1pp?.pct ?? null)}</div>
          </div>
          <div>
            <div className="label">Se caírem 1 p.p.</div>
            <div className={`posicao-valor mono ${sinal(risco.menos1pp?.valor)}`}>{reais(risco.menos1pp?.valor ?? null)}</div>
            <div className="label mono">{pct(risco.menos1pp?.pct ?? null)}</div>
          </div>
        </div>

        <Momentos piores={piores} desde={desde} />

        <Reparticao titulo="Por indexador" linhas={risco.porFamilia.map((f) => ({ chave: f.id, rotulo: f.rotulo, valor: f.valor, pct: f.pct }))} />
        <Reparticao titulo="Por ano de vencimento" linhas={risco.porAno.map((a) => ({ chave: a.ano, rotulo: a.ano, valor: a.valor, pct: a.pct }))} />
      </div>
    </>
  );
}

// Uma repartição em barras: rótulo, barra proporcional, percentual e valor.
// A barra é sobre 100% da carteira, não sobre a maior fatia — duas barras de
// tamanhos diferentes têm de dizer fatias diferentes.
function Reparticao({ titulo, linhas }) {
  return (
    <div className="reparticao">
      <div className="label">{titulo}</div>
      {linhas.map((l) => (
        <div className="reparticao-linha" key={l.chave}>
          <span>{l.rotulo}</span>
          <span className="reparticao-trilho" aria-hidden="true">
            <i style={{ width: `${Math.min(100, l.pct)}%` }} />
          </span>
          <span className="mono">{num(l.pct, 0)}%</span>
          <span className="mono muted">{reais(l.valor)}</span>
        </div>
      ))}
    </div>
  );
}

// O que ainda entra, ano a ano. Dobrado: é uma tabela de conferência, e numa
// carteira com cupons ela tem uma linha por ano até 2060.
function Calendario({ calendario }) {
  if (!calendario.linhas.length && !calendario.semValor.length) return null;
  const temNominal = calendario.linhas.some((l) => l.nominal > 0);
  const temHoje = calendario.linhas.some((l) => l.hoje > 0);
  return (
    <details className="dobra">
      <summary>
        O que ainda entra, ano a ano <span className="quantos">· {calendario.linhas.length} {calendario.linhas.length === 1 ? "ano" : "anos"}</span>
      </summary>
      <p className="section-sub">
        Cupons e vencimentos se nada for vendido, brutos de imposto.
        {temNominal && temHoje && " As duas colunas não se somam: uma está em reais da data do pagamento, a outra em reais de hoje."}
      </p>
      {calendario.linhas.length > 0 && (
        <div className="rolagem">
          <table className="tbl">
            <thead>
              <tr>
                <th>Ano</th>
                {temNominal && <th className="rt">Prefixado · reais nominais</th>}
                {temHoje && <th className="rt">IPCA+ · a preços de hoje</th>}
              </tr>
            </thead>
            <tbody>
              {calendario.linhas.map((l) => (
                <tr key={l.ano}>
                  <td className="mono">{l.ano}</td>
                  {temNominal && <td className="mono rt">{l.nominal > 0 ? reais(l.nominal) : "—"}</td>}
                  {temHoje && <td className="mono rt">{l.hoje > 0 ? reais(l.hoje) : "—"}</td>}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {calendario.semValor.length > 0 && (
        <p className="section-sub" style={{ marginTop: "var(--s2)" }}>
          Fora da tabela: {calendario.semValor.map((s) => `${s.nome} (vence em ${dataBR(s.vencimento)})`).join(", ")} — paga no
          vencimento, mas o valor depende da Selic até lá.
        </p>
      )}
    </details>
  );
}

// Cópia de segurança e importação. Tudo acontece no aparelho: o arquivo é
// gerado e lido pelo navegador, e o texto colado não é enviado a lugar nenhum.
function CopiaEImportacao({ posicoes, titulos, onMudar }) {
  const hoje = hojeSP();
  const arquivo = useRef(null);
  const [aviso, setAviso] = useState(null);
  const [colado, setColado] = useState("");
  const [previa, setPrevia] = useState(null);

  const exportar = () => {
    const blob = new Blob([exportarPosicoes(posicoes)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `tesouro-tracker-carteira-${hoje}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    setAviso(`Cópia com ${posicoes.length} ${posicoes.length === 1 ? "compra" : "compras"} gerada. Guarde o arquivo onde só você alcança: ele diz o que você tem.`);
  };

  const restaurar = async (e) => {
    const f = e.target.files?.[0];
    e.target.value = ""; // permite escolher o mesmo arquivo de novo
    if (!f) return;
    const r = lerBackup(await f.text(), posicoes);
    if (r.erro) return setAviso(r.erro);
    if (r.novas.length) onMudar((l) => [...l, ...r.novas]);
    setAviso(
      `${r.novas.length} ${r.novas.length === 1 ? "compra acrescentada" : "compras acrescentadas"}` +
        (r.repetidas ? `, ${r.repetidas} já ${r.repetidas === 1 ? "estava" : "estavam"} na lista` : "") +
        (r.invalidas ? `, ${r.invalidas} ilegível(is) no arquivo` : "") +
        "."
    );
  };

  const ler = () => {
    const r = lerPlanilha(colado, titulos, hoje);
    if (r.erro) return setPrevia({ erro: r.erro });
    // Tira da prévia o que já está registrado, para colar a mesma planilha
    // duas vezes não dobrar a carteira.
    const iguais = (a, b) => a.slug === b.slug && a.data === b.data && a.quantidade === b.quantidade && a.valor === b.valor;
    const novas = r.lotes.filter((l) => !posicoes.some((p) => iguais(p, l)));
    setPrevia({ ...r, lotes: novas, repetidas: r.lotes.length - novas.length });
  };

  const confirmar = () => {
    onMudar((l) => [...l, ...previa.lotes.map(({ nome, ...lote }) => lote)]);
    setAviso(`${previa.lotes.length} ${previa.lotes.length === 1 ? "compra acrescentada" : "compras acrescentadas"} da planilha.`);
    setPrevia(null);
    setColado("");
  };

  return (
    <div className="copia">
      <h2 className="section-title">
        Cópia e importação
        <Explica titulo="Cópia de segurança e importação">
          <p>
            <strong>Exportar</strong> gera um arquivo com as compras registradas. É a única cópia
            que existe fora deste aparelho — o app não guarda nada em servidor. O arquivo diz o
            que você tem: guarde-o como guardaria um extrato.
          </p>
          <p>
            <strong>Restaurar</strong> lê um arquivo desses e acrescenta as compras que ainda não
            estão na lista. Nunca apaga o que já está registrado.
          </p>
          <p>
            <strong>Importar de planilha</strong> lê linhas copiadas do extrato da B3 (Área do
            Investidor) ou da corretora. As colunas são achadas pelo nome — produto, data,
            quantidade e valor da operação —, e só entram as linhas de compra. Você vê a lista
            antes de gravar, com o que foi deixado de fora e por quê.
          </p>
          <p>
            Vendas e resgates não são registrados: se você vendeu parte de uma posição, apague a
            compra correspondente na lista de compras do título.
          </p>
          <p>O arquivo e o texto colado são lidos no próprio aparelho. Nada é enviado.</p>
        </Explica>
      </h2>
      <div className="copia-botoes">
        <button className="btn" onClick={exportar} disabled={!posicoes.length}>
          Exportar cópia
        </button>
        <button className="btn" onClick={() => arquivo.current?.click()}>
          Restaurar de arquivo
        </button>
        <input ref={arquivo} type="file" accept="application/json,.json" onChange={restaurar} hidden />
      </div>
      {aviso && (
        <p className="section-sub copia-aviso" role="status">
          {aviso}
        </p>
      )}

      <details className="dobra">
        <summary>Importar de planilha</summary>
        <p className="section-sub">
          Copie as linhas do extrato (com a linha dos nomes das colunas) e cole aqui. Nada é gravado antes de
          você conferir.
        </p>
        <textarea
          className="input copia-texto"
          rows={5}
          value={colado}
          onChange={(e) => {
            setColado(e.target.value);
            setPrevia(null);
          }}
          placeholder={"Data\tMovimentação\tProduto\tQuantidade\tValor da Operação"}
          aria-label="Linhas copiadas da planilha"
        />
        <button className="btn" onClick={ler} disabled={!colado.trim()}>
          Ler planilha
        </button>

        {previa?.erro && (
          <p className="form-erro" role="alert">
            {previa.erro}
          </p>
        )}
        {previa && !previa.erro && (
          <div className="copia-previa" role="status">
            <p className="section-sub">
              Colunas lidas: {Object.values(previa.colunas).join(" · ")}.
              {previa.repetidas > 0 && <> {previa.repetidas} compra(s) já estavam registradas e ficaram de fora.</>}
            </p>
            {previa.lotes.length > 0 ? (
              <>
                <ul className="copia-lista">
                  {previa.lotes.map((l) => (
                    <li key={l.id}>
                      <span className="mono">{dataBR(l.data)}</span> · {l.nome} · <span className="mono">{quantidadeBR(l.quantidade)}</span> por{" "}
                      <span className="mono">{reais(l.valor)}</span>
                    </li>
                  ))}
                </ul>
                <button className="btn btn-primary" onClick={confirmar}>
                  Acrescentar {previa.lotes.length} {previa.lotes.length === 1 ? "compra" : "compras"}
                </button>
              </>
            ) : (
              <p className="form-erro">Nenhuma compra nova reconhecida nessas linhas.</p>
            )}
            {previa.ignoradas.length > 0 && (
              <details className="dobra">
                <summary>
                  {previa.ignoradas.length} {previa.ignoradas.length === 1 ? "linha deixada" : "linhas deixadas"} de fora
                </summary>
                <ul className="copia-lista">
                  {previa.ignoradas.map((i) => (
                    <li key={i.linha}>
                      linha {i.linha}: {i.motivo}
                    </li>
                  ))}
                </ul>
              </details>
            )}
          </div>
        )}
      </details>
    </div>
  );
}

export function Carteira({ dados, posicoes, onMudar, onOpen, falhouAoGuardar, cdi }) {
  const titulos = useMemo(() => (dados.categorias || []).flatMap((c) => c.itens), [dados]);
  const carteira = useMemo(
    () => resumirCarteira(posicoes, titulos, { desde: dados.historicoDesde }),
    [posicoes, titulos, dados.historicoDesde]
  );
  if (dados.pendente) return <AguardandoColeta />;

  const total = carteira.total;
  const risco = useMemo(() => riscoDaCarteira(carteira.grupos), [carteira]);
  const piores = useMemo(() => pioresMomentos(carteira.grupos, dados.episodios), [carteira, dados.episodios]);
  const calendario = useMemo(() => calendarioDeRecebimentos(carteira.grupos, hojeSP()), [carteira]);
  // A comparação com o CDI, por título e no total. `cdi` chega do App (que é
  // quem fala com a rede): { pontos } quando há série, { erro } quando o
  // Banco Central não respondeu, null enquanto carrega.
  const indice = cdi?.pontos || null;
  const cdiDoGrupo = (g) => (indice && !g.semTitulo ? compararComCdi(g.lotes, indice) : null);
  const cdiTotal = useMemo(
    () => (indice ? compararComCdi(carteira.grupos.filter((g) => !g.semTitulo && g.valorHoje != null).flatMap((g) => g.lotes), indice) : null),
    [indice, carteira]
  );
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
          {/* CONTRA O CDI: a pergunta que o resultado sozinho não responde —
              "isso é bom?". O CDI é a régua do que o dinheiro faria parado. */}
          {cdiTotal ? (
            <div className="label carteira-cdi">
              No mesmo período o CDI rendeu <span className="mono">{reais(cdiTotal.rendimento)}</span> (
              <span className="mono">{pct(cdiTotal.pct)}</span>)
              {cdiTotal.pctDoCdi != null && (
                <>
                  {" "}
                  — a carteira fez <b className="mono">{num(cdiTotal.pctDoCdi, 0)}%</b> do CDI
                </>
              )}
              .
              <Explica titulo="A carteira contra o CDI">
                <p>
                  Para cada compra, o app calcula quanto o mesmo dinheiro teria rendido no CDI da
                  data da compra até a data do preço, e soma. É a comparação com "deixar parado
                  rendendo o juro do dia".
                </p>
                <p>
                  As duas pontas são brutas: nem o resultado da carteira nem o CDI têm imposto
                  descontado. E o CDI é uma régua, não um produto: um CDB ou um fundo rende uma
                  parte dele.
                </p>
                <p>
                  Ficar abaixo do CDI por um tempo não quer dizer que a compra foi ruim. O preço
                  de um título longo cai quando o juro sobe, e isso aparece aqui; levado ao
                  vencimento, ele paga a taxa contratada do mesmo jeito.
                </p>
                <p className="explica-fonte">
                  {cdi.fonte}, de {dataBR(cdi.desde)} a {dataBR(cdi.ate)}. A série é a mesma para todos: as datas
                  das suas compras não saem do aparelho.
                </p>
              </Explica>
            </div>
          ) : (
            cdi?.erro && <div className="label carteira-cdi">Comparação com o CDI indisponível agora (o Banco Central não respondeu).</div>
          )}
          {/* Fica NA TELA: é o que muda a leitura do número de cima. */}
          <p className="section-sub carteira-ressalva">
            Preços de {dataBR(dataDoPreco)} · bruto de imposto de renda e de taxa de custódia.
            {total.foraDoTotal > 0 && <> {total.foraDoTotal} título(s) sem preço ficaram fora da soma.</>}
          </p>
        </div>
      )}

      {carteira.grupos.map((g) => (
        <Posicao key={g.slug} g={g} onOpen={onOpen} cdi={cdiDoGrupo(g)} onRemover={(id) => onMudar((l) => l.filter((x) => x.id !== id))} />
      ))}

      <Risco risco={risco} piores={piores} desde={dados.historicoDesde} />
      <Calendario calendario={calendario} />
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
      <CopiaEImportacao posicoes={posicoes} titulos={titulos} onMudar={onMudar} />
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
