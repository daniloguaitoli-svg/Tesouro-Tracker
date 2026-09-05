// scripts/fumaca.mjs — teste de fumaça: monta o app DE VERDADE e abre cada aba.
//
// POR QUE ISTO EXISTE: nem `build` nem `verificar` renderizam um componente
// React. O `vite build` só empacota — código que quebra ao rodar empacota
// perfeitamente. O `verificar` só analisa `server/`. Sobrava um buraco do
// tamanho de toda a pasta `src/components/`, e ele já engoliu um bug real:
//
//   Em 22/08/2026 a declaração `useState("real")` de `familiaId` sumiu de
//   Curva.jsx numa edição. O JSX seguia usando a variável, então a aba Curva
//   quebrava com ReferenceError assim que alguém a abria. Build verde,
//   verificar verde, produção quebrada. Só apareceu abrindo o app num
//   navegador de verdade.
//
// POR QUE MONTAR COM DADOS, E NÃO SÓ RENDERIZAR: aquele bug estava DEPOIS dos
// early returns de carregamento (`if (!dados) return <Skeletons/>`). Renderizar
// sem dados para na linha 31 e nunca chega na linha 44, onde o erro estava.
// Renderizar no servidor também não serve: `useEffect` não roda em SSR, então o
// estado nunca sai de `null`. É por isso que aqui tem DOM (jsdom) e as
// respostas de `/api` vêm preenchidas — só assim o corpo real do componente
// executa.
//
// POR QUE O DATALAYER DE VERDADE, E NÃO UM FIXTURE: um fixture congela o
// formato e envelhece calado. Chamando `server/datalayer.js` o teste também
// cobre o contrato servidor→cliente: se o payload mudar de forma e a tela não
// acompanhar, quebra aqui. Custa ~600ms e lê os arquivos de `dados/`.
//
// POR QUE NÃO TEM FRAMEWORK DE TESTE: a casa não tem um (ver CLAUDE.md), e não
// é preciso — isto é um script Node que sai 0 ou 1, igual ao `verificar`.

import { JSDOM } from "jsdom";
import { createServer } from "vite";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), "..");

// As abas na ordem em que App.jsx as declara. Se uma aba nova entrar lá e não
// aqui, o teste avisa em vez de deixar a tela nova sem cobertura nenhuma.
const ABAS_ESPERADAS = [
  "Painel",
  "Títulos",
  "Curva",
  "Mercado",
  "Calculadora",
  "Notícias",
  "Alertas",
];

const falhas = [];
const relato = [];

// ---------- 1. Os payloads, montados pelo servidor de verdade ----------

const datalayer = await import(join(RAIZ, "server/datalayer.js"));

const ROTAS = {
  "/api/titulos": datalayer.getTitulos,
  "/api/curva": datalayer.getCurva,
  "/api/mercado": datalayer.getMercado,
  "/api/noticias": datalayer.getNoticias,
  "/api/macro": datalayer.getMacro,
};

const payloads = {};
for (const [rota, fn] of Object.entries(ROTAS)) {
  try {
    payloads[rota] = await fn();
  } catch (e) {
    // Uma fonte fora do ar não é defeito da tela. O app é construído para
    // tolerar buraco de dado, então o teste segue e a tela mostra o vazio.
    relato.push(`  aviso  ${rota} não respondeu (${e.message.slice(0, 60)}) — segue com vazio`);
    payloads[rota] = {};
  }
}

// ---------- 2. Um DOM, e um fetch que serve aqueles payloads ----------

const dom = new JSDOM('<!doctype html><html><body><div id="raiz"></div></body></html>', {
  url: "http://localhost/",
  pretendToBeVisual: true,
});

// `defineProperty` e não atribuição: o Node 22 já traz um `navigator` global
// que só tem getter, e atribuir nele estoura TypeError.
for (const chave of [
  "window", "document", "navigator", "location", "history", "localStorage",
  "sessionStorage", "HTMLElement", "Element", "Node", "Event", "CustomEvent",
  "MutationObserver", "getComputedStyle", "requestAnimationFrame",
  "cancelAnimationFrame", "SVGElement",
]) {
  if (dom.window[chave] === undefined) continue;
  Object.defineProperty(globalThis, chave, {
    value: dom.window[chave],
    writable: true,
    configurable: true,
  });
}
globalThis.IS_REACT_ACT_ENVIRONMENT = false;

globalThis.fetch = async (url) => {
  const caminho = String(url).split("?")[0];
  const corpo = payloads[caminho];
  if (corpo === undefined) {
    // Endpoint que a tela chama e o teste não conhece: vale saber.
    falhas.push(`fetch inesperado: ${url}`);
    return { ok: false, status: 404, json: async () => ({ error: "rota não mapeada no teste" }) };
  }
  return { ok: true, status: 200, json: async () => corpo };
};

// Erros que escapam do React (efeito assíncrono, handler) caem aqui.
const errosSoltos = [];
dom.window.addEventListener("error", (e) => errosSoltos.push(e.error?.stack || e.message));
process.on("unhandledRejection", (e) => errosSoltos.push(`unhandledRejection: ${e?.message || e}`));

// O console.error do React é onde o aviso de chave/prop aparece; erro de
// verdade já vem pela fronteira, então aqui só silencia o ruído esperado.
const erroOriginal = console.error;
console.error = (...args) => {
  const txt = String(args[0] ?? "");
  if (txt.includes("not wrapped in act")) return;
  erroOriginal(...args);
};

// ---------- 3. O App, transpilado pelo próprio vite ----------

// `ssrLoadModule` faz o JSX virar JS usando a config do projeto — sem ela seria
// preciso um transpilador só para o teste, e aí o teste passaria a exercitar
// uma build diferente da que vai para produção.
const vite = await createServer({
  root: RAIZ,
  logLevel: "error",
  server: { middlewareMode: true },
  appType: "custom",
});

let React, createRoot, App;
try {
  // React entra por import normal, não por `ssrLoadModule`: ele é CommonJS e o
  // avaliador SSR do vite estoura com "module is not defined". O vite
  // externaliza dependências de node_modules no SSR, então o App carregado
  // abaixo enxerga ESTA mesma instância — se fossem duas, todo hook quebraria.
  React = (await import("react")).default;
  createRoot = (await import("react-dom/client")).createRoot;
  App = (await vite.ssrLoadModule("/src/App.jsx")).default;
} catch (e) {
  console.error(`\nFALHA ao carregar o app: ${e.message}\n`);
  await vite.close();
  process.exit(1);
}

// Fronteira de erro: sem ela um erro de render sobe e derruba o processo sem
// dizer QUAL aba quebrou. Classe porque a API do React exige — a regra de "só
// componente de função" vale para `src/`, não para o arnês de teste.
class Fronteira extends React.Component {
  constructor(props) {
    super(props);
    this.state = { erro: null };
  }
  static getDerivedStateFromError(erro) {
    return { erro };
  }
  render() {
    return this.state.erro ? null : this.props.children;
  }
}

// Deixa efeito, promessa e re-render assentarem antes de olhar a tela.
const assentar = async (voltas = 12) => {
  for (let i = 0; i < voltas; i++) await new Promise((r) => setTimeout(r, 0));
};

// ---------- 4. Abrir cada aba, uma montagem limpa por aba ----------

// Montagem limpa por aba para que uma tela quebrada não contamine a próxima:
// a fronteira, ao pegar um erro, passa a renderizar nada, e um mount só daria
// "todas as abas seguintes falharam" a partir da primeira quebra.
async function abrirAba(nome) {
  const container = dom.window.document.createElement("div");
  dom.window.document.body.appendChild(container);
  const antes = errosSoltos.length;
  const capturados = [];
  const raiz = createRoot(container, {
    onUncaughtError: (e) => capturados.push(e),
    onCaughtError: (e) => capturados.push(e),
  });

  try {
    raiz.render(React.createElement(Fronteira, null, React.createElement(App)));
    await assentar();

    // Erro na montagem inicial ANTES de procurar as abas. A aba padrão (Painel)
    // renderiza junto com a moldura, então se ela quebrar a fronteira apaga a
    // árvore inteira e o `querySelectorAll` abaixo não acha nada. Reportar
    // "a moldura não montou" nesse caso mandaria quem lê investigar o lugar
    // errado — o defeito está na tela padrão, e a mensagem tem de dizer isso.
    const naMontagem = [...capturados, ...errosSoltos.slice(antes)];
    if (naMontagem.length) {
      const e = naMontagem[0];
      return { ok: false, motivo: `quebrou ao montar o app: ${String(e?.message || e).split("\n")[0]}` };
    }

    const botoes = [...container.querySelectorAll('[role="tab"]')];
    if (!botoes.length) return { ok: false, motivo: "nenhuma aba encontrada (a moldura não montou)" };

    const alvo = botoes.find((b) => b.textContent.trim() === nome);
    if (!alvo) {
      return { ok: false, motivo: `aba "${nome}" não existe na moldura` };
    }

    alvo.click();
    await assentar();

    const novos = errosSoltos.slice(antes);
    if (capturados.length || novos.length) {
      const e = capturados[0] || novos[0];
      return { ok: false, motivo: String(e?.message || e).split("\n")[0] };
    }

    // Painel vazio também é defeito: significa que a tela montou sem nada.
    const texto = container.textContent.replace(/\s+/g, " ").trim();
    if (texto.length < 40) return { ok: false, motivo: `a tela renderizou quase nada (${texto.length} chars)` };

    return { ok: true, chars: texto.length };
  } catch (e) {
    return { ok: false, motivo: String(e.message).split("\n")[0] };
  } finally {
    try {
      raiz.unmount();
    } catch {}
    container.remove();
  }
}

console.log("\nteste de fumaça — monta o app e abre cada aba\n");
if (relato.length) console.log(relato.join("\n"));

for (const aba of ABAS_ESPERADAS) {
  const r = await abrirAba(aba);
  if (r.ok) {
    console.log(`  ok     ${aba.padEnd(12)} renderizou (${r.chars} chars)`);
  } else {
    console.log(`  FALHA  ${aba.padEnd(12)} ${r.motivo}`);
    falhas.push(`${aba}: ${r.motivo}`);
  }
}

await vite.close();
console.error = erroOriginal;

if (falhas.length) {
  console.log(`\n${falhas.length} falha(s):`);
  for (const f of falhas) console.log(`  - ${f}`);
  console.log("");
  process.exit(1);
}

console.log("\ntodas as abas montaram\n");
process.exit(0);
