// src/api.js — cliente das rotas /api (mesma origem, dev e produção).
//
// SEM REDE, O APP MOSTRA O ÚLTIMO DADO QUE VIU. Antes, abrir o app instalado
// sem sinal dava uma tela de erro — e o dado daqui muda uma vez por dia: o de
// ontem à noite ainda é o dado. Cada resposta boa fica guardada neste
// aparelho; quando a rede falha, a guardada é devolvida no lugar, e o app
// passa a dizer isso em todas as telas, com a hora em que guardou.
//
// DUAS COISAS QUE ISTO NÃO FAZ, de propósito:
//   - Não esconde a falta de rede. Dado guardado apresentado como dado de
//     agora seria o app mentindo sobre a própria defasagem — e ele existe
//     para dizê-la. `estadoDaConexao()` é o que a faixa de aviso lê.
//   - Não troca a rede pelo guardado quando há rede. A ordem é sempre rede
//     primeiro; o guardado só entra quando ela falha.
//
// POR QUE AQUI E NÃO NO SERVICE WORKER: o worker só existe em produção e não
// tem como contar à tela que a resposta veio do aparelho. Aqui a mesma função
// que busca é a que sabe de onde veio.
//
// Fica na Cache Storage do navegador, não no localStorage: são respostas de
// dezenas de KB (uma por título aberto), e o localStorage é síncrono e
// pequeno. O nome do cache está duplicado em public/sw.js, que apaga todo
// cache que não reconhece — o verificar.mjs confere que os dois batem.

export const CACHE_DADOS = "tesouro-dados-v1";
const GUARDADO_EM = "x-guardado-em";
// Cada título aberto, em cada período, é uma resposta. Sem teto, o cache só
// cresceria. Quarenta cobre os títulos em oferta nos períodos mais usados.
const MAX_DETALHES = 40;

const temCache = () => typeof caches !== "undefined";

// ---------- De onde veio o que está na tela ----------
// null = da rede. { salvoEm, motivo } = do aparelho, e por quê.
let conexao = null;
const ouvintes = new Set();

export function estadoDaConexao() {
  return conexao;
}
export function assinarConexao(aoMudar) {
  ouvintes.add(aoMudar);
  return () => ouvintes.delete(aoMudar);
}
function mudarConexao(nova) {
  // Várias telas podem cair no guardado na mesma sessão. O aviso mostra a
  // hora MAIS ANTIGA: é a que diz o pior caso do que está na tela.
  if (nova && conexao && conexao.salvoEm <= nova.salvoEm) nova = { ...nova, salvoEm: conexao.salvoEm };
  if (conexao?.salvoEm === nova?.salvoEm && conexao?.motivo === nova?.motivo) return;
  conexao = nova;
  for (const f of ouvintes) f();
}

// ---------- Guardar e reaver ----------
async function guardar(url, texto) {
  if (!temCache()) return;
  try {
    const cache = await caches.open(CACHE_DADOS);
    await cache.put(
      url,
      new Response(texto, {
        headers: { "content-type": "application/json", [GUARDADO_EM]: new Date().toISOString() },
      })
    );
    // put() tira a entrada antiga e põe a nova no fim, então as chaves ficam
    // da mais antiga para a mais nova — as primeiras são as que saem.
    const detalhes = (await cache.keys()).filter((r) => new URL(r.url).pathname === "/api/detalhe");
    for (const velho of detalhes.slice(0, Math.max(0, detalhes.length - MAX_DETALHES))) await cache.delete(velho);
  } catch {
    /* modo privativo ou cota cheia — o app segue, só não guarda */
  }
}

async function doAparelho(url) {
  if (!temCache()) return null;
  try {
    const hit = await (await caches.open(CACHE_DADOS)).match(url);
    if (!hit) return null;
    return { dados: await hit.json(), salvoEm: hit.headers.get(GUARDADO_EM) };
  } catch {
    return null;
  }
}

async function getJSON(url) {
  let r;
  try {
    r = await fetch(url);
  } catch {
    // fetch só rejeita quando não houve resposta nenhuma: sem rede.
    const guardado = await doAparelho(url);
    if (guardado) {
      mudarConexao({ salvoEm: guardado.salvoEm, motivo: "conexao" });
      return guardado.dados;
    }
    throw new Error("Sem conexão, e este aparelho ainda não guardou estes dados.");
  }

  if (r.ok) {
    // .json(), e o texto refeito para guardar — não .text() + JSON.parse. As
    // duas formas dão no mesmo num navegador, mas esta só pede da resposta o
    // que o app sempre pediu, e é o que o fetch do teste de fumaça oferece.
    const j = await r.json();
    guardar(url, JSON.stringify(j)); // sem await: guardar não pode atrasar a tela
    mudarConexao(null);
    return j;
  }

  const j = await r.json().catch(() => ({}));
  // 5xx é o servidor (ou a fonte dele) fora do ar: o guardado vale mais que
  // um erro. 4xx é pedido errado — título que não existe, por exemplo — e
  // mostrar um dado guardado ali esconderia o erro de verdade.
  if (r.status >= 500) {
    const guardado = await doAparelho(url);
    if (guardado) {
      mudarConexao({ salvoEm: guardado.salvoEm, motivo: "servidor" });
      return guardado.dados;
    }
  }
  throw new Error(j.error || `Erro ${r.status}`);
}

export const getTitulos = () => getJSON("/api/titulos");
export const getCurva = () => getJSON("/api/curva");
// Endpoint próprio, e não um campo do /api/curva: a fonte é a B3, não o
// Tesouro, e um dia sem coleta lá não pode esvaziar a curva dos títulos.
export const getFuturos = () => getJSON("/api/futuros");
export const getMacro = () => getJSON("/api/macro");
export const getMercado = () => getJSON("/api/mercado");
export const getNoticias = () => getJSON("/api/noticias");
export const getDetalhe = (slug, tf = "1A") =>
  getJSON(`/api/detalhe?slug=${encodeURIComponent(slug)}&tf=${encodeURIComponent(tf)}`);
