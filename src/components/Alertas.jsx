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
import { taxa, dataBR, anos } from "../format.js";
import { AguardandoColeta, Vazio } from "./States.jsx";

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

  return (
    <div>
      <div className="section-title">Novo alerta</div>
      <p className="section-sub">
        Avisa quando a taxa real de um vencimento cruzar o alvo. Guardado só neste aparelho.
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
            <span>Taxa real (% a.a.)</span>
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

      <div className="note">
        Os alertas são conferidos quando esta tela abre, contra a última coleta — não há
        notificação em segundo plano. E a taxa coletada tem ao menos um dia útil de defasagem.
      </div>
    </div>
  );
}
