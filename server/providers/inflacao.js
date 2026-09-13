// server/providers/inflacao.js — inflação por região, de fontes públicas e sem
// chave.
//
// Três caminhos, todos já trilhados neste repositório:
//   Brasil          SGS do Banco Central (o mesmo de IPCA/Selic/CDI/PTAX)
//   Estados Unidos  fredgraph.csv (o mesmo do Fed em globais.js)
//   Europa          csvdata do ECB Data Portal (o mesmo do BCE em globais.js)
//
// A escolha de cada índice está comentada em catalogo.js, em INFLACAO — é lá
// que mora a decisão, aqui mora só a leitura.
//
// DUAS FORMAS DE SÉRIE. O SGS publica a variação de cada mês em %; FRED e BCE
// publicam o nível do índice. Isso não é detalhe de formato, muda a conta: de
// um lado se compõem variações, do outro se dividem níveis. `forma` no
// catálogo diz qual é qual, e util.js tem uma função para cada.
//
// Melhor esforço, como todo provider de contexto: cada região é um pedido
// separado sob allSettled, e uma fonte fora do ar não apaga as outras cinco.
import { INFLACAO } from "../catalogo.js";
import { janelasDeIndiceMensal, janelasDeVariacaoMensal } from "../util.js";
import { parseCsvFred, parseCsvBce } from "./globais.js";
import * as bcb from "./bcb.js";

// Inflação sai uma vez por mês; reler de hora em hora seria só gentileza mal
// empregada com fontes gratuitas.
const TTL_MS = 6 * 60 * 60 * 1000;
const cache = new Map(); // id -> { ts, pontos }

// Três anos: 12 meses precisam do mesmo mês do ano passado, e "no ano" precisa
// de dezembro anterior. Dois anos bastariam na maioria dos dias; três dão folga
// para uma série que atrase a publicação sem a janela longa sumir da tela.
const ANOS = 3;
const desdeISO = () => `${new Date().getUTCFullYear() - ANOS}-01-01`;

async function baixarTexto(url) {
  const r = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.text();
}

async function pontosDe(meta) {
  const hit = cache.get(meta.id);
  if (hit && Date.now() - hit.ts < TTL_MS) return hit.pontos;

  let pontos;
  if (meta.serie) {
    pontos = await bcb.serie(meta.serie, { dias: ANOS * 366 });
  } else if (meta.fred) {
    const r = parseCsvFred(await baixarTexto(`https://fred.stlouisfed.org/graph/fredgraph.csv?id=${meta.fred}&cosd=${desdeISO()}`));
    if (!r.ok) throw new Error(`FRED ${meta.fred}: ${r.motivo}${r.amostra ? ` (${r.amostra.slice(0, 60)})` : ""}`);
    pontos = r.pontos;
  } else if (meta.ecb) {
    // Nenhuma entrada do catálogo usa este caminho hoje: o HICP saiu do ECB
    // Data Portal para o espelho do Eurostat no FRED, que está sete meses à
    // frente (ver o comentário em INFLACAO). Fica aqui porque é uma rota
    // legítima e barata de manter, e porque a decisão foi por FRESCOR do dado,
    // não por defeito do BCE — se um dia a publicação de lá voltar a andar,
    // basta trocar o campo no catálogo.
    const r = parseCsvBce(
      await baixarTexto(`https://data-api.ecb.europa.eu/service/data/ICP/${meta.ecb}?format=csvdata&startPeriod=${desdeISO()}`)
    );
    if (!r.ok) throw new Error(`BCE ${meta.ecb}: ${r.motivo}${r.amostra ? ` (${r.amostra.slice(0, 60)})` : ""}`);
    pontos = r.pontos;
  } else {
    throw new Error(`${meta.id}: sem fonte declarada no catálogo`);
  }
  if (!pontos.length) throw new Error(`${meta.id}: série vazia`);
  cache.set(meta.id, { ts: Date.now(), pontos });
  return pontos;
}

export async function inflacaoDe(meta) {
  const pontos = await pontosDe(meta);
  const janelas = meta.forma === "indice" ? janelasDeIndiceMensal(pontos) : janelasDeVariacaoMensal(pontos);
  const ult = pontos[pontos.length - 1];
  return {
    id: meta.id,
    regiao: meta.regiao,
    nome: meta.nome,
    nota: meta.nota,
    fonte: meta.fonte,
    forma: meta.forma,
    // O mês de referência do dado, que NÃO é o mês corrente: o IPCA de agosto
    // sai em setembro, e as fontes divergem em quantas semanas atrasam. Cada
    // linha carrega o seu — comparar Holanda de agosto com Brasil de julho sem
    // dizer isso seria o tipo de erro silencioso que esta tela evita.
    mesReferencia: String(ult.date).slice(0, 7),
    ...janelas,
  };
}

export async function todasInflacoes() {
  const r = await Promise.allSettled(INFLACAO.map((m) => inflacaoDe(m)));
  return r.map((x, i) =>
    x.status === "fulfilled" ? x.value : { id: INFLACAO[i].id, regiao: INFLACAO[i].regiao, nome: INFLACAO[i].nome, erro: String(x.reason?.message || x.reason) }
  );
}
