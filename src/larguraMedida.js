// larguraMedida.js — a largura real, em pixels, de onde um gráfico é desenhado.
//
// POR QUE EXISTE: os gráficos eram desenhados num quadro fixo de 366 unidades
// e ESTICADOS até a largura da tela. Tudo dentro deles esticava junto — texto
// e traço. Medido em 09/11/2026 no gráfico do Detalhe: a 1280px de tela o
// rótulo do eixo saía com ~29px e a linha com 6px de espessura, num quadro de
// 600px de altura; a 390px o mesmo rótulo, declarado com 9, saía com ~8px. O
// número escrito no código não era o tamanho de nada.
//
// Com a largura medida, o viewBox passa a ter o tamanho do próprio desenho:
// uma unidade é um pixel, em qualquer tela. Um rótulo de 12 tem 12px no
// celular e no monitor, e o traço de 2px tem 2px.
//
// O valor padrão cobre dois casos em que não há o que medir: a primeira
// pintura (o elemento ainda não existe) e o teste de fumaça — o jsdom não
// calcula layout nem implementa ResizeObserver, e é exatamente ele que pega
// componente que quebra ao montar. Sem os guardas, os gráficos quebrariam lá.
import { useLayoutEffect, useRef, useState } from "react";

export function useLarguraMedida(padrao) {
  const ref = useRef(null);
  const [largura, setLargura] = useState(padrao);

  // useLayoutEffect, não useEffect: mede antes de o navegador pintar, então o
  // gráfico já aparece na largura certa em vez de piscar do padrão para ela.
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const medir = () => {
      const w = Math.round(el.getBoundingClientRect().width);
      // Zero é "sem layout" (jsdom, ou elemento escondido), não uma largura.
      if (w > 0) setLargura(w);
    };
    medir();
    if (typeof ResizeObserver !== "function") return undefined;
    const observador = new ResizeObserver(medir);
    observador.observe(el);
    return () => observador.disconnect();
  }, []);

  return [ref, largura];
}
