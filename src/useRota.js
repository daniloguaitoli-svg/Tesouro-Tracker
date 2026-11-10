// useRota.js — liga a rota (rota.js) ao histórico do navegador.
//
// A REGRA DO HISTÓRICO, que é a de um app de abas:
//   - ABRIR UM TÍTULO empilha uma entrada. Voltar fecha o título e devolve à
//     lista, na altura em que ela estava.
//   - TROCAR DE ABA substitui a entrada atual. Voltar não refaz, uma a uma,
//     todas as abas visitadas: de uma aba, Voltar sai do app — como em
//     qualquer app com barra inferior.
//
// O estado do React é atualizado NA HORA, e não à espera de um evento do
// navegador: pushState e replaceState não disparam popstate. Os eventos só
// cobrem o que vem de fora — o botão Voltar e alguém editando o endereço.
import { useCallback, useEffect, useRef, useState } from "react";
import { lerRota, escreverRota } from "./rota.js";

// O jsdom do teste de fumaça não implementa scrollTo (e reclama no log), e lá
// scrollY é sempre 0 — então só se rola quando há de fato o que mudar.
function rolarPara(y) {
  if (typeof window === "undefined") return;
  if (Math.abs(window.scrollY - y) > 1) window.scrollTo(0, y);
}

// Escrever no histórico pode falhar (página dentro de um quadro restrito, por
// exemplo). O app continua navegando pelo estado; só o endereço fica parado.
function historico(metodo, estado, hash) {
  try {
    window.history[metodo](estado, "", hash);
  } catch {
    /* sem histórico: a navegação segue pelo estado do React */
  }
}

export function useRota(abasValidas, padrao) {
  const ler = () =>
    lerRota(typeof window === "undefined" ? "" : window.location.hash, abasValidas, padrao);
  const [rota, setRota] = useState(ler);
  // A altura da lista no momento em que um título foi aberto, para devolver a
  // pessoa ao mesmo lugar. A aba Títulos tem ~4.400px: voltar ao topo depois
  // de olhar o décimo título obrigava a rolar tudo de novo.
  const alturaDaLista = useRef(0);
  const restaurar = useRef(false);

  useEffect(() => {
    const deFora = () => {
      const nova = ler();
      setRota((atual) => {
        // Fechou um título pelo Voltar do navegador: restaura a altura.
        if (atual.slug && !nova.slug) restaurar.current = true;
        // O endereço de um título não diz de que aba se veio; mantém a atual.
        return nova.slug ? { ...nova, tab: atual.tab } : nova;
      });
    };
    window.addEventListener("popstate", deFora);
    window.addEventListener("hashchange", deFora);
    return () => {
      window.removeEventListener("popstate", deFora);
      window.removeEventListener("hashchange", deFora);
    };
    // Uma vez só: `ler` depende apenas da lista de abas, que não muda.
  }, []);

  // Depois que a lista voltou para a tela, e não antes: rolar com o Detalhe
  // ainda montado rolaria a tela errada.
  useEffect(() => {
    if (!rota.slug && restaurar.current) {
      restaurar.current = false;
      rolarPara(alturaDaLista.current);
    }
  }, [rota.slug]);

  const irParaAba = useCallback((tab) => {
    const nova = { tab, slug: null };
    setRota(nova);
    historico("replaceState", null, escreverRota(nova));
    rolarPara(0);
  }, []);

  const abrirTitulo = useCallback((slug) => {
    alturaDaLista.current = typeof window === "undefined" ? 0 : window.scrollY;
    setRota((atual) => ({ tab: atual.tab, slug }));
    // `interno` marca que há uma tela do app logo atrás desta entrada — é o
    // que diz ao "voltar" se ele pode usar o histórico.
    historico("pushState", { interno: true }, escreverRota({ slug }));
    rolarPara(0);
  }, []);

  const fecharTitulo = useCallback(() => {
    // Aberto por dentro do app: volta pelo histórico, que é o que mantém o
    // botão da tela e o Voltar do aparelho fazendo a MESMA coisa. O popstate
    // cuida do estado e da altura.
    if (typeof window !== "undefined" && window.history.state?.interno) {
      window.history.back();
      return;
    }
    // Chegou por um link direto: não há tela do app atrás, e history.back()
    // sairia para o site de onde a pessoa veio.
    setRota((atual) => {
      const nova = { tab: atual.tab, slug: null };
      historico("replaceState", null, escreverRota(nova));
      return nova;
    });
  }, []);

  return { tab: rota.tab, slug: rota.slug, irParaAba, abrirTitulo, fecharTitulo };
}
