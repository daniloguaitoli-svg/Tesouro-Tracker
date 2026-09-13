// components/Mercado.jsx — o quadro de juros e câmbio: as três decisões de
// política monetária (Copom, Fed, BCE), o câmbio PTAX e o par CDI × Selic.
//
// As datas dizem "vigente desde" DE PROPÓSITO: o que as séries sabem é o dia
// em que a taxa nova passou a valer, não o dia da reunião — e fingir saber a
// data da reunião seria inventar precisão.
//
// Quando essa data ainda não chegou, o rótulo vira "a partir de" (ver
// `vigencia` em format.js). A taxa mostrada continua sendo a nova: é a que o
// mercado já preçou e a que vale para quem for investir. O que muda é só a
// preposição — "vigente desde" uma data futura não quer dizer nada.
import { useEffect, useState } from "react";
import { getMercado } from "../api.js";
import { num, pct, pp, dataBR, mesBR, sinal, vigencia } from "../format.js";
import { ErroBox, Skeletons } from "./States.jsx";

function CartaoDecisao({ d, taxaPrincipal, detalhe }) {
  if (!d) return null;
  return (
    <div className="card">
      <div className="label">{d.nome}</div>
      <div className="big">{taxaPrincipal}</div>
      <div className="label">{detalhe}</div>
      <div className="label" style={{ marginTop: 6 }}>
        {d.variacaoPP != null && (
          <span className={d.variacaoPP > 0 ? "down" : "up"}>{pp(d.variacaoPP)} </span>
        )}
        {d.vigenteDesde && <>· {vigencia(d.vigenteDesde)}</>}
      </div>
      <div className="pricedate" style={{ marginTop: 4 }}>{d.fonte}</div>
    </div>
  );
}

// Uma célula de janela. Guarda o `—` para quando a série não alcança a janela
// (um índice com dois anos de histórico não tem 12 meses em 2 de janeiro), em
// vez de fingir um zero.
function Cel({ j }) {
  if (!j || j.pct == null || !Number.isFinite(j.pct)) return <td className="rt mono muted">—</td>;
  return (
    <td className={`rt mono ${sinal(j.pct)}`} title={`${dataBR(j.de)} → ${dataBR(j.ate)}`}>
      {pct(j.pct)}
    </td>
  );
}

// A grade de um grupo. Tabela e não cartões de propósito: a leitura desta tela
// é comparar a MESMA janela entre indicadores diferentes, e isso é uma coluna.
// Vai dentro de .rolagem porque sete colunas não cabem em 390px — a primeira
// fica grudada, senão rolar para ver "12m" esconde de quem é a linha.
function Grade({ grupo }) {
  // As colunas vêm do GRUPO, não fixas no componente: câmbio, juros e bolsas
  // têm as cinco janelas diárias, inflação tem três mensais. Coluna que o grupo
  // não mede simplesmente não existe, em vez de aparecer vazia fingindo que o
  // dado poderia estar lá.
  const colunas = grupo.colunas || [];
  return (
    <>
      <div className="section-title">{grupo.nome}</div>
      <div className="rolagem">
        <table className="tbl grade" style={{ minWidth: 150 + (grupo.comValor ? 80 : 0) + colunas.length * 66 }}>
          <thead>
            <tr>
              <th className="col-nome">Indicador</th>
              {grupo.comValor && <th className="rt">Último</th>}
              {colunas.map((c) => (
                <th key={c.id} className="rt">{c.rotulo}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {grupo.linhas.map((l) => (
              <tr key={l.id}>
                <td className="col-nome">
                  {l.nome}
                  <br />
                  <span className="muted" style={{ fontSize: 11 }}>
                    {l.sub}
                    {l.mesReferencia ? ` · ref. ${mesBR(l.mesReferencia)}` : l.data ? ` · ${dataBR(l.data)}` : ""}
                    {l.desatualizado && (
                      <span className="down"> · {l.mesesAtras} meses atrás</span>
                    )}
                  </span>
                </td>
                {grupo.comValor && (
                  <td className="rt mono">
                    {l.valor == null ? "—" : num(l.valor, l.casas ?? 2)}
                    {l.unidade === "%_ANO" ? "%" : ""}
                  </td>
                )}
                {colunas.map((c) => (
                  <Cel key={c.id} j={l[c.id]} />
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

export function Mercado() {
  const [dados, setDados] = useState(null);
  const [erro, setErro] = useState(null);
  const [tentativa, setTentativa] = useState(0);

  useEffect(() => {
    let vivo = true;
    setErro(null);
    getMercado()
      .then((d) => vivo && setDados(d))
      .catch((e) => vivo && setErro(e.message));
    return () => {
      vivo = false;
    };
  }, [tentativa]);

  if (erro && !dados) return <ErroBox erro={erro} onRetry={() => setTentativa((n) => n + 1)} />;
  if (!dados) return <Skeletons n={4} />;

  const { copom, fed, bce } = dados.decisoes || {};

  return (
    <div>
      <div className="section-title">Política monetária</div>
      <p className="section-sub">
        As três decisões que emolduram qualquer taxa desta tela.
      </p>
      <div className="grid grid-2" style={{ marginTop: 0 }}>
        <CartaoDecisao d={copom} taxaPrincipal={copom ? `${num(copom.taxa)}%` : "—"} detalhe="meta da Selic, a.a." />
        <CartaoDecisao
          d={fed}
          taxaPrincipal={fed ? `${num(fed.limiteInferior)}–${num(fed.limiteSuperior)}%` : "—"}
          detalhe="meta dos Fed Funds, a.a."
        />
        <CartaoDecisao
          d={bce}
          taxaPrincipal={bce ? `${num(bce.deposito)}%` : "—"}
          detalhe={bce ? `depósito · refi ${num(bce.refi)}%` : "depósito"}
        />
        {!fed && !bce && (
          <div className="card">
            <div className="label">Fed e BCE</div>
            <div className="big">—</div>
            <div className="label">
              chegam na próxima coleta agendada (o job grava dados/global.json duas vezes ao dia)
            </div>
          </div>
        )}
      </div>

      {(dados.grupos || []).map((g) => (
        <Grade key={g.id} grupo={g} />
      ))}

      {!!(dados.indisponiveis || []).length && (
        <p className="section-sub" style={{ marginTop: 8 }}>
          Sem resposta agora: {dados.indisponiveis.join(", ")}. As demais linhas seguem inteiras.
        </p>
      )}

      <div className="note">
        <strong>Câmbio e bolsas variam em preço; Selic e CDI, não.</strong> Nas duas linhas de
        juros a coluna é o <strong>retorno acumulado</strong> — quanto R$ 1 aplicado à taxa
        rendeu na janela, composto dia a dia —, e não a variação do nível da taxa. São coisas
        diferentes: o CDI ir de 13,65% para 13,90% é +0,25 p.p., o que não se compara com
        "Ibovespa +12%". O retorno se compara, e é por isso que ele está aqui. O número na
        coluna do valor continua sendo a taxa anualizada, que é como ela se cota.
        <br />
        Cada praça fecha na sua hora, então as datas legitimamente não batem entre si — cada
        linha carrega a sua. Índices estrangeiros estão na moeda de origem, sem conversão.
        <br />
        <strong>Inflação sai uma vez por mês e com atraso</strong>, e cada instituto publica
        no seu tempo — por isso cada linha diz o <strong>mês de referência</strong> a que o
        número se refere, que não é o mês corrente e nem sempre é o mesmo entre regiões.
        Europa e Holanda e Itália vêm pelo HICP, harmonizado justamente para se comparar
        entre países; os Estados Unidos pelo CPI-U sem ajuste sazonal, que é o índice a que
        os TIPS são indexados — o análogo do IPCA para a NTN-B.
        <br />
        <strong>A coluna do mês carrega sazonalidade</strong> nas séries sem ajuste
        sazonal, que são as de fora do Brasil: em julho de 2026 a Holanda marcou +1,61% e a
        Itália −0,97%, e isso são saldos de verão e energia, não divergência de inflação —
        em 12 meses as três europeias ficam entre 2,91% e 2,95%. Para comparar países, use
        a janela de 12 meses.{" "}
        {dados.aviso}
      </div>
    </div>
  );
}
