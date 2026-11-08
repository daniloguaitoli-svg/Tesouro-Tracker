// components/Alertas.jsx — alertas de taxa, por dispositivo.
//
// Guardados em localStorage (chave `tesouro-tracker-alertas`), lidos e escritos
// aqui mesmo: não há backend de usuário neste app e nada sai do aparelho — o
// repositório é público, então preferir o armazenamento local não é só
// simplicidade, é o que mantém posições e metas fora do que é publicado.
//
// O disparo é conferido na abertura da tela, contra a última taxa coletada. Não
// há notificação push: o app é um painel que se consulta, não um serviço que
// avisa — e prometer aviso que não chega seria pior que não prometer.
import { useEffect, useMemo, useState } from "react";
import { taxa, dataBR, anos, unidadeTaxa } from "../format.js";
import { AguardandoColeta, Vazio } from "./States.jsx";
import { Explica } from "./Explica.jsx";

const CHAVE = "tesouro-tracker-alertas";

function carregar() {
  if (typeof window === "undefined") return [];
  try {
    const bruto = JSON.parse(window.localStorage.getItem(CHAVE) || "[]");
    return Array.isArray(bruto) ? bruto : [];
  } catch {
    return []; // storage corrompido não pode derrubar a tela
  }
}

function salvar(lista) {
  try {
    window.localStorage.setItem(CHAVE, JSON.stringify(lista));
  } catch {
    /* modo privativo / cota cheia — o app segue funcionando sem persistir */
  }
}

export function Alertas({ dados }) {
  const todos = useMemo(() => (dados.categorias || []).flatMap((c) => c.itens), [dados]);
  const [alertas, setAlertas] = useState(carregar);
  const [slug, setSlug] = useState(() => (dados.destaques?.[0] || todos[0])?.slug || "");
  const [direcao, setDirecao] = useState("acima");
  const [alvo, setAlvo] = useState("7");

  useEffect(() => salvar(alertas), [alertas]);

  const adicionar = () => {
    const n = Number(String(alvo).replace(",", "."));
    if (!slug || !Number.isFinite(n)) return;
    setAlertas((a) => [...a, { id: `${Date.now()}`, slug, direcao, alvo: n }]);
  };

  const remover = (id) => setAlertas((a) => a.filter((x) => x.id !== id));

  if (dados.pendente) return <AguardandoColeta />;

  // A unidade do alvo segue o vencimento escolhido. A tela dizia "taxa real"
  // para todos — e a lista tem Prefixado (taxa nominal) e Selic (ágio sobre a
  // Selic), o mesmo erro que a Calculadora já cometeu e corrigiu.
  const escolhido = todos.find((t) => t.slug === slug) || null;

  return (
    <div>
      <div className="section-title">
        Novo alerta
        <Explica titulo="Como os alertas funcionam">
          <p>
            O alerta marca quando a taxa de um vencimento cruza o alvo. Ele é conferido quando
            esta tela abre, contra a última taxa coletada: não há notificação em segundo plano —
            o app é um painel que se consulta, e prometer um aviso que não chega seria pior que
            não prometer.
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
      </div>
      {/* "Sem notificação" fica NA TELA: é o que muda o uso. Quem cria um
          alerta espera ser avisado, e descobrir o contrário no ⓘ é tarde. */}
      <p className="section-sub">
        Sem notificação: o alerta é conferido quando esta tela abre. Fica só neste aparelho.
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

      <div className="section-title">Alertas ({alertas.length})</div>
      {alertas.length === 0 && <Vazio texto="Nenhum alerta ainda." />}
      {alertas.map((a) => {
        const t = todos.find((x) => x.slug === a.slug);
        const atual = t?.taxa ?? null;
        const disparou =
          atual != null && (a.direcao === "acima" ? atual >= a.alvo : atual <= a.alvo);
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
  );
}
