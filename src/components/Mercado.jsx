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
import { Explica } from "./Explica.jsx";

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
function Cel({ j, base, casas }) {
  if (!j || j.pct == null || !Number.isFinite(j.pct)) return <td className="rt mono muted">—</td>;
  return (
    <td className={`rt mono ${sinal(j.pct)}`} title={`${dataBR(j.de)} → ${dataBR(j.ate)}`}>
      {pct(j.pct)}
      {/* A cotação que entrou na conta, embaixo. "-6,27% no ano" sozinho não
          deixa ninguém conferir: este é o ponto de partida, e o de chegada é a
          coluna "Último" da mesma linha. Sem rótulo de propósito — a posição
          (menor, embaixo de um percentual, numa grade de cotações) já diz o que
          é, e um "de" repetido dez vezes na tela só ocupa espaço. */}
      {base && j.valorDe != null && (
        <>
          <br />
          <span className="cel-base">{num(j.valorDe, casas ?? 2)}</span>
        </>
      )}
    </td>
  );
}

// O QUE CADA GRUPO DIZ, e onde. Isto era uma nota única de 2.067 caracteres
// no fim da aba, explicando quatro tabelas longe de todas elas — e repetindo o
// aviso que o rodapé já mostra. Agora cada pedaço mora junto da sua tabela:
//
//   - `linha`: a ressalva que muda a leitura de um número. Fica NA TELA,
//     porque escondida num ⓘ ela some, e a regra da casa é dizer na interface
//     o que a conta não sabe.
//   - `explica`: método e definição. Vai para o ⓘ na linha do título.
//
// As chaves são os ids dos grupos que o servidor manda (datalayer.js). Grupo
// sem entrada aqui simplesmente não ganha linha nem ⓘ — nada quebra.
const TEXTO_DO_GRUPO = {
  cambio: {
    explica: (
      <>
        <p>XXX/YYY é o preço de XXX em YYY: reais por dólar, reais por euro, dólares por euro.</p>
        <p>
          O EUR/USD sai da divisão do EUR/BRL pelo USD/BRL. As duas cotações vêm da PTAX, o
          fixing do Banco Central por volta das 13h, então ele é o euro-dólar implícito nessa
          cotação, não o par negociado no mercado. Pode diferir um pouco.
        </p>
        <p>O número menor sob cada percentual é a cotação de partida da janela.</p>
      </>
    ),
  },
  juros: {
    linha: "As janelas mostram retorno acumulado, não a variação da taxa.",
    explica: (
      <>
        <p>
          O valor é a taxa anualizada, como ela é cotada. As janelas mostram quanto R$ 1
          aplicado a essa taxa rendeu no período, composto dia a dia.
        </p>
        <p>
          Não é a variação do nível da taxa: o CDI ir de 13,65% para 13,90% é +0,25 p.p., e
          isso não se compara com "Ibovespa +12%". O retorno se compara, por isso é ele que
          está aqui.
        </p>
        <p>
          Na Selic, o valor é a meta definida pelo Copom, mas o retorno é o da Selic efetiva
          — a taxa que de fato corre a cada dia, um pouco abaixo da meta. É por isso que o
          retorno da Selic sai praticamente igual ao do CDI, e não o de quem rendeu a meta
          cheia.
        </p>
      </>
    ),
  },
  bolsas: {
    linha: "Índices estrangeiros em moeda local, sem conversão para reais.",
    explica: (
      <p>
        Cada bolsa fecha no seu horário, então as datas não coincidem entre as linhas. Cada
        uma mostra a sua.
      </p>
    ),
  },
  inflacao: {
    linha: "Para comparar países, use 12 meses: fora do Brasil, o mês tem sazonalidade.",
    explica: (
      <>
        <p>
          Sai uma vez por mês, com atraso, e cada instituto publica no seu tempo. Por isso cada
          linha mostra o mês de referência, que não é o mês corrente e nem sempre é o mesmo
          entre países.
        </p>
        <p>
          Europa, Holanda e Itália usam o HICP, harmonizado para comparar países. Os EUA usam o
          CPI-U sem ajuste sazonal, o índice que corrige os TIPS, como o IPCA corrige a NTN-B.
        </p>
        <p>
          Exemplo da sazonalidade: em julho de 2026 a Holanda marcou +1,61% e a Itália −0,97%
          no mês. Foi efeito de verão e energia, não divergência: em 12 meses as três europeias
          ficaram entre 2,91% e 2,95%.
        </p>
      </>
    ),
  },
};

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
  const texto = TEXTO_DO_GRUPO[grupo.id];
  return (
    <>
      <h2 className="section-title">
        {grupo.nome}
        {texto?.explica && <Explica titulo={grupo.nome}>{texto.explica}</Explica>}
      </h2>
      {texto?.linha && <p className="section-sub">{texto.linha}</p>}
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
                  <span className="linha-menor">
                    {l.sub}
                    {l.mesReferencia ? ` · ref. ${mesBR(l.mesReferencia)}` : l.data ? ` · ${dataBR(l.data)}` : ""}
                    {l.desatualizado && (
                      <span className="down"> · {l.mesesAtras} meses atrás</span>
                    )}
                  </span>
                </td>
                {grupo.comValor && (
                  <td className="rt mono">
                    {/* A unidade só acompanha um número. Com a fonte fora
                        do ar a célula mostrava "—%": um símbolo de unidade
                        medindo nada. */}
                    {l.valor == null ? "—" : `${num(l.valor, l.casas ?? 2)}${l.unidade === "%_ANO" ? "%" : ""}`}
                  </td>
                )}
                {colunas.map((c) => (
                  <Cel key={c.id} j={l[c.id]} base={grupo.mostrarBase} casas={l.casas} />
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

// O que o DI futuro embute para as próximas reuniões do Copom (a conta está
// em server/selic.js). Fica logo abaixo dos cartões de política monetária: é
// a continuação natural de "a Selic está em X" — "e o mercado põe quanto na
// próxima reunião?".
//
// "NÃO É PREVISÃO" FICA NA TELA, pela mesma regra da inflação implícita: é a
// ressalva que muda a leitura do número. Quem lê "+0,29 p.p. em abril" sem
// ela sai achando que o Copom vai subir o juro.
function SelicImplicita({ s }) {
  if (!s?.reunioes?.length) return null;
  // TRÊS COLUNAS, não quatro: o acumulado e a meta implícita dizem a mesma
  // coisa (a meta é a de hoje mais o acumulado), e as quatro não cabem em
  // 360px sem rolar. Mostra-se a meta, que é o número que se lê de cabeça;
  // sem a meta de hoje (Banco Central fora do ar) a coluna vira o acumulado,
  // em vez de uma fileira de travessões.
  const comMeta = s.metaHoje != null;
  return (
    <>
      <h2 className="section-title">
        O que o mercado embute para a Selic
        <Explica titulo="O que o mercado embute para a Selic">
          <p>
            O preço de cada contrato de DI futuro é o CDI acumulado até o vencimento dele, e o CDI
            anda colado na Selic — que só muda em reunião do Copom. Comparando dois vencimentos
            vizinhos, sobra quanto de alta ou de corte os preços põem na reunião que fica entre
            eles.
          </p>
          <p>
            <strong>Não é previsão.</strong> Quem trava juro por mais tempo cobra um prêmio por
            isso, então a curva costuma embutir mais alta (ou menos corte) do que acaba
            acontecendo. É o que está no preço hoje, não o que o Copom vai decidir.
          </p>
          <p>
            A conta supõe que o juro só muda em reunião, e do tamanho da decisão. A tabela para em{" "}
            {s.reunioes.length} reuniões: mais adiante os contratos mensais quase não negociam, e
            o resultado passa a refletir a interpolação da bolsa, não o mercado.
          </p>
          <p>
            A meta implícita é a meta de hoje mais a soma do que os preços põem em cada reunião até
            ali. Datas das reuniões pelo calendário
            do Banco Central, que vai até {dataBR(s.calendarioAte)} e pode mudar (conferido em{" "}
            {dataBR(s.calendarioConferidoEm)}).
          </p>
          <p className="explica-fonte">
            {s.fonte}. Preços de ajuste de {dataBR(s.dataRef)}, em dias úteis/252.
          </p>
        </Explica>
      </h2>
      <p className="section-sub">
        Pelos preços do DI futuro de {dataBR(s.dataRef)}
        {comMeta && <>, com a meta hoje em <span className="mono">{num(s.metaHoje)}%</span></>}.{" "}
        <strong>Não é previsão</strong>: inclui prêmio de risco.
      </p>
      <div className="rolagem">
        <table className="tbl selic-implicita">
          <thead>
            <tr>
              <th>Reunião</th>
              <th className="rt">Na reunião</th>
              <th className="rt">{comMeta ? "Meta implícita" : "Acumulado"}</th>
            </tr>
          </thead>
          <tbody>
            {s.reunioes.map((r) => (
              <tr key={r.data}>
                <td className="mono">{dataBR(r.data)}</td>
                {/* Juro que sobe não é "bom" nem "ruim" aqui: sem cor de alta
                    ou baixa, que neste app querem dizer ganho e perda. */}
                <td className="mono rt">{pp(r.variacaoPP)}</td>
                <td className="mono rt">{comMeta ? `${num(r.metaImplicita)}%` : pp(r.acumuladoPP)}</td>
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
      <h2 className="section-title">Política monetária</h2>
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

      <SelicImplicita s={dados.selicImplicita} />

      {(dados.grupos || []).map((g) => (
        <Grade key={g.id} grupo={g} />
      ))}

      {!!(dados.indisponiveis || []).length && (
        <p className="section-sub" style={{ marginTop: 8 }}>
          Sem resposta agora: {dados.indisponiveis.join(", ")}. As demais linhas seguem inteiras.
        </p>
      )}
    </div>
  );
}
