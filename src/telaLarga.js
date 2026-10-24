// src/telaLarga.js — "a tela é larga o bastante para a coluna lateral?"
//
// É um hook, e não só uma media query no CSS, porque a resposta decide se um
// COMPONENTE monta — não apenas se ele aparece. A coluna lateral do Painel
// busca a curva no /api; escondê-la com `display: none` faria todo celular
// pagar essa requisição para nunca mostrar o resultado.
//
// O guarda em volta do matchMedia não é zelo: o jsdom do teste de fumaça não
// implementa matchMedia, e sem o guarda o Painel quebraria ao montar lá — que
// é exatamente o defeito que a fumaça existe para pegar.
import { useEffect, useState } from "react";

// 960px e não 720: acima de 719 a tira de abas já volta ao topo, mas a coluna
// lateral precisa de ~320px à direita de uma grade de cartões de 280px sem
// espremer nenhum dos dois.
export const LARGURA_LATERAL = 960;

function combina(consulta) {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return false;
  return window.matchMedia(consulta).matches;
}

export function useTelaLarga(minimo = LARGURA_LATERAL) {
  const consulta = `(min-width: ${minimo}px)`;
  const [larga, setLarga] = useState(() => combina(consulta));

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") return undefined;
    const mq = window.matchMedia(consulta);
    const aoMudar = () => setLarga(mq.matches);
    // Roda uma vez na montagem: entre o useState inicial e este efeito a
    // janela pode ter mudado de tamanho (girar o aparelho, abrir o DevTools).
    aoMudar();
    mq.addEventListener("change", aoMudar);
    return () => mq.removeEventListener("change", aoMudar);
  }, [consulta]);

  return larga;
}
