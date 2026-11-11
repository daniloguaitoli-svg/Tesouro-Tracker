// components/Alertas.jsx — alertas de taxa, por dispositivo.
//
// A lista e a regra do disparo moram em src/alertas.js, e o estado no App:
// esta tela cria e remove, mas quem avisa que um alerta foi atingido é o
// Painel e a navegação, que precisam da mesma lista. Continua tudo só neste
// aparelho (localStorage) — o repositório é público, e uma meta de taxa diz o
// que a pessoa pretende comprar.
//
// Não há notificação push: o app é um painel que se consulta, não um serviço
// que avisa — e prometer aviso que não chega seria pior que não prometer. O
// que existe é o aviso DENTRO do app: abrir em qualquer tela já mostra.
import { useMemo, useState } from "react";
import { taxa, dataBR, anos, unidadeTaxa } from "../format.js";
import { alertaAtingido } from "../alertas.js";
import { AguardandoColeta, Vazio } from "./States.jsx";
import { Explica } from "./Explica.jsx";

export function Alertas({ dados, alertas, onMudar }) {
  const todos = useMemo(() => (dados.categorias || []).flatMap((c) => c.itens), [dados]);
  const [slug, setSlug] = useState(() => (dados.destaques?.[0] || todos[0])?.slug || "");
  const [direcao, setDirecao] = useState("acima");
  const [alvo, setAlvo] = useState("7");

  const adicionar = () => {
    const n = Number(String(alvo).replace(",", "."));
    if (!slug || !Number.isFinite(n)) return;
    onMudar((a) => [...a, { id: `${Date.now()}`, slug, direcao, alvo: n }]);
  };

  const remover = (id) => onMudar((a) => a.filter((x) => x.id !== id));

  if (dados.pendente) return <AguardandoColeta />;

  // A unidade do alvo segue o vencimento escolhido. A tela dizia "taxa real"
  // para todos — e a lista tem Prefixado (taxa nominal) e Selic (ágio sobre a
  // Selic), o mesmo erro que a Calculadora já cometeu e corrigiu.
  const escolhido = todos.find((t) => t.slug === slug) || null;

  // Duas colunas em tela larga, como na Calculadora: o formulário com a
  // largura de um formulário, a lista ao lado.
  return (
    <div className="duas-colunas">
      <div className="coluna-form">
      <h2 className="section-title">
        Novo alerta
        <Explica titulo="Como os alertas funcionam">
          <p>
            O alerta marca quando a taxa de um vencimento cruza o alvo. Ele é conferido quando
            o app abre, contra a última taxa coletada, e um alerta atingido aparece no Painel e
            na navegação. Não há notificação em segundo plano: o app é um painel que se
            consulta, e prometer um aviso que não chega seria pior que não prometer.
          </p>
          <p>
            A taxa coletada tem ao menos um dia útil de defasagem: o alerta compara com o que o
            Tesouro publicou, não com o preço deste momento.
          </p>
          <p>
            O alvo está na unidade do vencimento escolhido: acima do IPCA no IPCA+, nominal no
            Prefixado, e ágio ou deságio sobre a Selic no Tesouro Selic.
          </p>
          <p>
            A lista fica guardada só neste aparelho — nada sai do celular. Trocar de aparelho ou
            limpar os dados do navegador apaga os alertas.
          </p>
        </Explica>
      </h2>
      {/* "Sem notificação" fica NA TELA: é o que muda o uso. Quem cria um
          alerta espera ser avisado, e descobrir o contrário no ⓘ é tarde. */}
      <p className="section-sub">
        Sem notificação: o aviso aparece quando você abre o app. Fica só neste aparelho.
      </p>

      <div className="card">
        <label className="campo">
          <span>Vencimento</span>
          <select className="select" value={slug} onChange={(e) => setSlug(e.target.value)}>
            {todos.map((t) => (
              <option key={t.slug} value={t.slug}>
                {t.nome} — {taxa(t.taxa)}
              </option>
            ))}
          </select>
        </label>
        <div className="calc-grid">
          <label className="campo">
            <span>Quando a taxa estiver</span>
            <select className="select" value={direcao} onChange={(e) => setDirecao(e.target.value)}>
              <option value="acima">acima de</option>
              <option value="abaixo">abaixo de</option>
            </select>
          </label>
          <label className="campo">
            <span>Alvo, % {unidadeTaxa(escolhido?.tipo)}</span>
            <input className="input" inputMode="decimal" value={alvo} onChange={(e) => setAlvo(e.target.value)} />
          </label>
        </div>
        <button className="btn btn-primary" onClick={adicionar}>
          Criar alerta
        </button>
      </div>
      </div>

      <div className="coluna-conteudo">
      <h2 className="section-title">Alertas ({alertas.length})</h2>
      {alertas.length === 0 && <Vazio texto="Nenhum alerta ainda." />}
      {alertas.map((a) => {
        const t = todos.find((x) => x.slug === a.slug);
        const atual = t?.taxa ?? null;
        const disparou = alertaAtingido(a, atual);
        return (
          <div className="row" key={a.id} style={{ cursor: "default" }}>
            <div className="rowmain">
              <div className="rowname">{t?.nome || a.slug}</div>
              <div className="rowsub">
                {a.direcao === "acima" ? "acima de" : "abaixo de"} {taxa(a.alvo)}
                {t?.duration?.macaulay != null && <> · duration {anos(t.duration.macaulay)}</>}
              </div>
            </div>
            <div className="rowprice">
              <div className={`p ${disparou ? "up" : ""}`}>{taxa(atual)}</div>
              <div className="sub">{disparou ? "atingido" : "aguardando"}</div>
              {t?.data && <div className="sub">{dataBR(t.data)}</div>}
            </div>
            <button className="btn btn-ghost" onClick={() => remover(a.id)} aria-label="Remover alerta">
              ✕
            </button>
          </div>
        );
      })}
      </div>
    </div>
  );
}
