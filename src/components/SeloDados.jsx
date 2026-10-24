// components/SeloDados.jsx — o selo de "de quando são estes preços", no topo.
//
// Substitui o banner vermelho do Painel e as etiquetas "desatualizado" de cada
// cartão: o mesmo problema aparecia até cinco vezes na mesma tela. Agora ele
// aparece uma vez, sempre no mesmo lugar, e o detalhe fica a um toque.
//
// O selo existe SEMPRE que há preço, não só quando há atraso — saber a data do
// preço é útil mesmo com tudo em dia (o arquivo do Tesouro tem defasagem de ao
// menos um dia útil). Em dia, é neutro; com atraso, fica âmbar.
//
// Segue a mesma regra do antigo banner: olha os vencimentos ACOMPANHADOS (a
// escolha do usuário), não o catálogo inteiro — avisar sobre um vencimento que
// a pessoa não acompanha é ruído.
import { useEffect, useRef, useState } from "react";
import { dataBR, horaBR } from "../format.js";

const diaMes = (iso) => dataBR(iso).slice(0, 5);

// Engole o próximo clique da página inteira. O toque que fecha o balão é um
// pointerdown seguido de um click — e esse click, sem isto, chega ao cartão que
// estava por baixo e abre o Detalhe: a pessoa queria só fechar o balão.
// Escuta na CAPTURA do document, que roda antes da raiz onde o React registra
// os seus ouvintes, então o onClick do cartão nunca dispara. Se o gesto virar
// rolagem (pointercancel) ou não produzir click, o ouvinte sai sozinho — senão
// engoliria um toque legítimo minutos depois.
function engolirProximoClique() {
  const engolir = (e) => {
    e.preventDefault();
    e.stopPropagation();
    sair();
  };
  const sair = () => {
    document.removeEventListener("click", engolir, true);
    document.removeEventListener("pointercancel", sair, true);
    clearTimeout(prazo);
  };
  const prazo = setTimeout(sair, 1000);
  document.addEventListener("click", engolir, true);
  document.addEventListener("pointercancel", sair, true);
}

export function SeloDados({ itens, atualizadoEm }) {
  const [aberto, setAberto] = useState(false);
  const raiz = useRef(null);

  // Fecha ao tocar fora ou com Esc — e o toque de fora SÓ fecha (ver
  // engolirProximoClique). Ouvintes só enquanto o balão está aberto.
  useEffect(() => {
    if (!aberto) return;
    const fora = (e) => {
      if (!raiz.current || raiz.current.contains(e.target)) return;
      engolirProximoClique();
      setAberto(false);
    };
    const esc = (e) => e.key === "Escape" && setAberto(false);
    document.addEventListener("pointerdown", fora);
    window.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("pointerdown", fora);
      window.removeEventListener("keydown", esc);
    };
  }, [aberto]);

  const comData = (itens || []).filter((t) => t.data);
  if (!comData.length) return null;

  const atrasados = comData.filter((t) => t.desatualizado);
  // Com atraso, mostra a data MAIS VELHA entre os atrasados (é ela que importa);
  // em dia, a mais recente entre os acompanhados.
  const datas = (atrasados.length ? atrasados : comData).map((t) => t.data).sort();
  const data = atrasados.length ? datas[0] : datas[datas.length - 1];

  return (
    <div className="selo-dados" ref={raiz}>
      <button
        type="button"
        className={`selo-botao${atrasados.length ? " atrasado" : ""}`}
        aria-expanded={aberto}
        onClick={() => setAberto((a) => !a)}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v5l3 2" />
        </svg>
        Preços de {diaMes(data)}
      </button>

      {aberto && (
        <div className="selo-balao" role="status">
          {atrasados.length ? (
            <>
              <b>Cotações desatualizadas</b>
              <ul>
                {atrasados.map((t) => (
                  <li key={t.slug}>
                    {t.nome} <span className="mono">· {dataBR(t.data)}</span>
                  </li>
                ))}
              </ul>
              <p>O arquivo do Tesouro é diário e só sai em dia útil — se persistir, confira o job de coleta.</p>
            </>
          ) : (
            <p>
              Preços do arquivo oficial do Tesouro de <span className="mono">{dataBR(data)}</span>. Ele sai uma vez por
              dia útil, com defasagem de ao menos um dia.
            </p>
          )}
          {atualizadoEm && (
            <p className="muted">
              Última coleta: {dataBR(atualizadoEm)} às {horaBR(atualizadoEm)}.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
