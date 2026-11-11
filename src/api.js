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
// UMA ENTRADA POR ENDEREÇO servido do aparelho, e não um estado só para o app.
//
// Até 11/2026 era uma variável: a última resposta decidia. Só que a aba Curva
// faz DUAS buscas ao mesmo tempo (/api/curva e /api/futuros), e com uma delas
// fora do ar a outra, ao chegar bem, apagava o aviso — o gráfico seguia com o
// dado guardado e a tela dizia que estava tudo em dia. Pior: o App lia o
// aviso se apagando como "a rede voltou", remontava a tela, as duas buscas
// saíam de novo e o ciclo recomeçava enquanto a ordem de chegada se repetisse.
//
// Com uma entrada por endereço, uma resposta boa só responde por si mesma.
const servidosDoAparelho = new Map(); // url -> { salvoEm, motivo }
// O resumo que a faixa de aviso lê: null = tudo da rede.
let conexao = null;
const ouvintes = new Set();
const ouvintesDaVolta = new Set();

export function estadoDaConexao() {
  return conexao;
}
export function assinarConexao(aoMudar) {
  ouvintes.add(aoMudar);
  return () => ouvintes.delete(aoMudar);
}
// "A rede voltou": uma busca deu certo enquanto OUTRAS telas ainda mostravam
// dado guardado por falta de conexão. É o sinal para buscá-las de novo.
export function assinarVolta(aoVoltar) {
  ouvintesDaVolta.add(aoVoltar);
  return () => ouvintesDaVolta.delete(aoVoltar);
}
export function veioDoAparelho(url) {
  return servidosDoAparelho.has(url);
}

function resumir() {
  let nova = null;
  for (const e of servidosDoAparelho.values()) {
    if (!nova) {
      nova = { ...e };
      continue;
    }
    // A hora MAIS ANTIGA: é a que diz o pior caso do que está na tela.
    if ((e.salvoEm || "") < (nova.salvoEm || "")) nova.salvoEm = e.salvoEm;
    // Faltando rede para uma delas, é isso que a faixa diz: o servidor
    // "não ter respondido" às outras deixa de ser a notícia.
    if (e.motivo === "conexao") nova.motivo = "conexao";
  }
  // O objeto só troca quando o conteúdo troca: useSyncExternalStore compara
  // por identidade, e um objeto novo a cada chamada renderizaria sem parar.
  if (conexao?.salvoEm === nova?.salvoEm && conexao?.motivo === nova?.motivo) return;
  conexao = nova;
  for (const f of ouvintes) f();
}

function marcarDoAparelho(url, entrada) {
  servidosDoAparelho.set(url, entrada);
  resumir();
}

// A rede respondeu a `url`. Isso limpa a entrada DELA — e as de falta de
// conexão das outras, porque a conexão evidentemente existe (quem avisa o App
// para buscá-las de novo é assinarVolta). As de erro do servidor ficam: outro
// endereço ter respondido não diz nada sobre aquele.
function chegouDaRede(url) {
  let voltou = false;
  for (const [u, e] of servidosDoAparelho) {
    if (u === url) servidosDoAparelho.delete(u);
    else if (e.motivo === "conexao") {
      servidosDoAparelho.delete(u);
      voltou = true;
    }
  }
  resumir();
  if (voltou) for (const f of ouvintesDaVolta) f();
}

// A tela mudou: o que as telas anteriores mostravam do aparelho já não está
// à vista, e o aviso não pode continuar falando delas. `manter` diz o que
// segue valendo através da troca (recebe o endereço e a entrada): os títulos,
// que o App carrega uma vez só, e a falta de conexão enquanto ela durar.
export function soltarGuardados(manter = () => false) {
  for (const [u, e] of servidosDoAparelho) if (!manter(u, e)) servidosDoAparelho.delete(u);
  resumir();
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
      marcarDoAparelho(url, { salvoEm: guardado.salvoEm, motivo: "conexao" });
      return guardado.dados;
    }
    soltarGuardados((u) => u !== url);
    throw new Error("Sem conexão, e este aparelho ainda não guardou estes dados.");
  }

  if (r.ok) {
    // .json(), e o texto refeito para guardar — não .text() + JSON.parse. As
    // duas formas dão no mesmo num navegador, mas esta só pede da resposta o
    // que o app sempre pediu, e é o que o fetch do teste de fumaça oferece.
    const j = await r.json();
    guardar(url, JSON.stringify(j)); // sem await: guardar não pode atrasar a tela
    chegouDaRede(url);
    return j;
  }

  const j = await r.json().catch(() => ({}));
  // 5xx é o servidor (ou a fonte dele) fora do ar: o guardado vale mais que
  // um erro. 4xx é pedido errado — título que não existe, por exemplo — e
  // mostrar um dado guardado ali esconderia o erro de verdade.
  if (r.status >= 500) {
    const guardado = await doAparelho(url);
    if (guardado) {
      marcarDoAparelho(url, { salvoEm: guardado.salvoEm, motivo: "servidor" });
      return guardado.dados;
    }
  }
  // Virou erro na tela: se este endereço vinha sendo servido do aparelho, já
  // não é — quem está à vista agora é a mensagem de erro.
  soltarGuardados((u) => u !== url);
  throw new Error(j.error || `Erro ${r.status}`);
}

// Exportado porque o App precisa saber se OS TÍTULOS vieram do aparelho: é o
// único dado que ele carrega uma vez e mantém através de todas as telas.
export const URL_TITULOS = "/api/titulos";
export const getTitulos = () => getJSON(URL_TITULOS);
export const getCurva = () => getJSON("/api/curva");
// Endpoint próprio, e não um campo do /api/curva: a fonte é a B3, não o
// Tesouro, e um dia sem coleta lá não pode esvaziar a curva dos títulos.
export const getFuturos = () => getJSON("/api/futuros");
export const getMacro = () => getJSON("/api/macro");
export const getMercado = () => getJSON("/api/mercado");
export const getNoticias = () => getJSON("/api/noticias");
// O CDI acumulado como índice, sem parâmetro nenhum: a Carteira o compara com
// cada compra NO APARELHO. A data da compra não entra no endereço — e não
// pode entrar: é dado da pessoa, e um endereço fica em log de servidor.
export const getCdi = () => getJSON("/api/cdi");
export const getDetalhe = (slug, tf = "1A") =>
  getJSON(`/api/detalhe?slug=${encodeURIComponent(slug)}&tf=${encodeURIComponent(tf)}`);
