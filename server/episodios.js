// server/episodios.js — os piores momentos do histórico, para repetir na carteira.
//
// A PERGUNTA: "e se acontecer de novo o que já aconteceu?". O cenário de
// "todas as taxas, 1 ponto, ao mesmo tempo" é uma régua, não um dia que
// existiu: na prática o juro real e o nominal não andam juntos nem do mesmo
// tamanho, e a ponta curta não mexe como a longa. Aqui o choque é o que o
// mercado FEZ em janelas reais do histórico — por família e por prazo.
//
// A CONTA, em duas metades:
//   1. (este arquivo, puro) achar as janelas em que as taxas mais subiram e
//      medir, em cada uma, quanto subiu a taxa de cada título vivo — o
//      "formato" do choque: Δ taxa por prazo, uma curva para o IPCA+ e outra
//      para o Prefixado;
//   2. (datalayer) aplicar esse Δ a cada título de HOJE, no prazo que ele tem
//      hoje, e repreçá-lo pelo fluxo — não pela aproximação de duration.
// A multiplicação pela quantidade é do aparelho, como tudo da Carteira.
//
// POR QUE O FORMATO DO CHOQUE, E NÃO O PREÇO DAQUELE DIA: o título que a
// pessoa tem hoje não é o que existia em 2020 — tem outro prazo, outra taxa,
// e muitos nem existiam. O que se repete é o movimento da curva; a
// sensibilidade é a de agora.
//
// AS JANELAS SAEM DO DADO, NÃO DE UMA LISTA DE CRISES COM NOME. Dar nome
// ("a crise de tal ano") seria editorializar e lembrar de cabeça; a regra é
// reproduzível: para cada horizonte (1, 5 e 21 pregões), as janelas em que as
// taxas mais subiram — pela média de cada família e no prazo de cada título
// vivo (ver acharEpisodios). A pior janela de quem só tem IPCA+ não é a de
// quem só tem Prefixado, nem a de quem tem o curto a de quem tem o longo. O
// aparelho escolhe, entre as candidatas, a que mais dói NA carteira que está
// nele.
//
// QUEM FAZ A BUSCA É O COLETOR, que versiona o resultado em
// dados/episodios.json; o servidor só refaz a conta na hora quando o arquivo
// não é do histórico que ele tem (a semente, ou dev sem coleta).
//
// O QUE ISTO NÃO É, e a tela diz: não é o pior possível (o histórico começa
// onde começa), não é previsão, e trata o Tesouro Selic como imune — em
// crise de verdade ele também pode cair um pouco, e esta conta não vê isso.

import { anosUteisEntre } from "./util.js";

// `maxDiasCorridos` impede que um buraco na publicação vire uma "janela de um
// dia" com duas semanas de mercado dentro.
export const HORIZONTES = [
  { id: "dia", rotulo: "Pior dia", pregoes: 1, maxDiasCorridos: 5 },
  { id: "semana", rotulo: "Pior semana", pregoes: 5, maxDiasCorridos: 12 },
  { id: "mes", rotulo: "Pior mês", pregoes: 21, maxDiasCorridos: 40 },
];

// Menos que isto de títulos numa família e a "média" é a opinião de um
// vencimento só.
const MIN_TITULOS = 3;

export function familiaDoChoque(tipo) {
  if (String(tipo).startsWith("ipca")) return "real";
  if (String(tipo).startsWith("prefixado")) return "nominal";
  return null; // LFT: sem choque de taxa
}

// Os títulos vivos numa data, com a família e o prazo de cada um: são os
// ALVOS da busca — para cada um deles, a janela em que a taxa NO PRAZO DELE
// mais subiu vira candidata (ver acharEpisodios).
export function alvosDe(titulos, hojeISO) {
  const vistos = new Map();
  for (const t of titulos || []) {
    const familia = familiaDoChoque(t.tipo);
    if (!familia || !(t.vencimento > hojeISO)) continue;
    const anos = anosUteisEntre(hojeISO, t.vencimento);
    // Com e sem cupom do mesmo vencimento têm o mesmo prazo: um alvo só.
    vistos.set(`${familia}|${anos.toFixed(3)}`, { familia, anos });
  }
  return [...vistos.values()];
}

// Pontos de um mesmo prazo (com e sem cupom do mesmo vencimento) viram um só,
// pela média: senão a curva do choque teria dois valores no mesmo x.
function agrupar(pontos) {
  const porPrazo = new Map();
  for (const p of pontos) {
    const chave = p.anos.toFixed(3);
    const g = porPrazo.get(chave) || { anos: p.anos, soma: 0, n: 0 };
    g.soma += p.deltaPP;
    g.n++;
    porPrazo.set(chave, g);
  }
  return [...porPrazo.values()].map((g) => ({ anos: g.anos, deltaPP: g.soma / g.n })).sort((x, y) => x.anos - y.anos);
}

// `titulos`: [{ tipo, vencimento, serie: { "AAAA-MM-DD": [taxa, pu] } }], o
// formato de dados/historico.json (vencidos inclusive: em 2020 eram eles que
// estavam vivos). `prazoMinimo` é o piso da curva — abaixo dele a taxa
// anualizada de um título perto de vencer é ruído, não mercado. `alvos` é o
// de alvosDe(): os títulos de hoje.
//
// QUAIS JANELAS VIRAM CANDIDATAS, por horizonte:
//   - as três réguas de família: a maior alta média do IPCA+, a do Prefixado
//     e a da média das duas;
//   - para cada alvo, a janela em que a alta NO PRAZO DELE foi maior.
// A segunda lista é o que faz "pior dia" querer dizer o pior dia de quem
// tem aquele título. Só as réguas de família não bastavam: a média mistura o
// curto e o longo, e o dia em que a ponta longa mais subiu — o pior para quem
// tem um IPCA+ 2050 — pode não ser o de maior média. Para um título só, a
// maior alta no prazo dele É a maior perda dele (o preço cai sempre que a
// taxa sobe). Para uma carteira com vários, o pior é uma soma ponderada e não
// precisa coincidir com o pior de nenhum título; mas as candidatas cobrem
// cada título e cada família, e o aparelho fica com a que mais tira dela.
//
// Devolve [{ id, horizonte, de, ate, realPP, nominalPP, real, nominal }],
// onde `real` e `nominal` são [{ anos, deltaPP }] em ordem de prazo.
export function acharEpisodios(titulos, { prazoMinimo = 1.5, alvos = [] } = {}) {
  const lista = (titulos || []).map((t) => ({ ...t, familia: familiaDoChoque(t.tipo) })).filter((t) => t.familia && t.serie);
  const datas = [...new Set(lista.flatMap((t) => Object.keys(t.serie)))].sort();
  const ms = datas.map((d) => Date.parse(`${d}T00:00:00Z`));

  // Os títulos vivos e acima do piso em cada data de fim, com o prazo em dias
  // úteis/252 — a régua em que o título de hoje vai ser interpolado. As três
  // janelas que terminam na mesma data usam a mesma lista, então ela é feita
  // uma vez por data.
  const prazosGuardados = new Map();
  const prazosEm = (i) => {
    if (!prazosGuardados.has(i)) {
      const d1 = datas[i];
      const vivos = [];
      for (const t of lista) {
        if (!(t.vencimento > d1) || t.serie[d1]?.[0] == null) continue;
        const anos = anosUteisEntre(d1, t.vencimento);
        if (anos >= prazoMinimo) vivos.push({ t, anos });
      }
      prazosGuardados.set(i, vivos);
    }
    return prazosGuardados.get(i);
  };

  // A janela que termina em `i` e tem `k` pregões: a alta de cada título vivo,
  // a média de cada família (por título) e, se pedida, a curva do choque.
  const janela = (i, k, { comCurva = false } = {}) => {
    const d0 = datas[i - k];
    const d1 = datas[i];
    const pontos = { real: [], nominal: [] };
    for (const { t, anos } of prazosEm(i)) {
      const a = t.serie[d0]?.[0];
      if (a == null) continue;
      pontos[t.familia].push({ anos, deltaPP: t.serie[d1][0] - a });
    }
    if (pontos.real.length < MIN_TITULOS || pontos.nominal.length < MIN_TITULOS) return null;
    const media = (l) => l.reduce((s, p) => s + p.deltaPP, 0) / l.length;
    const j = { i, k, de: d0, ate: d1, realPP: media(pontos.real), nominalPP: media(pontos.nominal) };
    if (comCurva) {
      j.real = agrupar(pontos.real);
      j.nominal = agrupar(pontos.nominal);
    }
    return j;
  };

  // Cada régua dá um número por janela; ganha a janela com o MAIOR, e só se
  // ele for positivo — uma régua em que nenhuma janela subiu não tem momento
  // ruim a mostrar.
  const reguas = [
    { chave: "real", precisaCurva: false, valor: (j) => j.realPP },
    { chave: "nominal", precisaCurva: false, valor: (j) => j.nominalPP },
    { chave: "media", precisaCurva: false, valor: (j) => (j.realPP + j.nominalPP) / 2 },
    ...alvos.map((a) => ({
      chave: `${a.familia}|${a.anos.toFixed(3)}`,
      precisaCurva: true,
      valor: (j) => choqueNoPrazo(j[a.familia], a.anos),
    })),
  ];
  const precisaCurva = reguas.some((r) => r.precisaCurva);

  const episodios = [];
  for (const h of HORIZONTES) {
    const melhores = new Map(); // chave da régua -> { i, valor }
    for (let i = h.pregoes; i < datas.length; i++) {
      if ((ms[i] - ms[i - h.pregoes]) / 86400000 > h.maxDiasCorridos) continue;
      const j = janela(i, h.pregoes, { comCurva: precisaCurva });
      if (!j) continue;
      for (const r of reguas) {
        const v = r.valor(j);
        if (v == null || !(v > 0)) continue;
        const atual = melhores.get(r.chave);
        if (!atual || v > atual.valor) melhores.set(r.chave, { i, valor: v });
      }
    }
    // Várias réguas costumam eleger a mesma janela: entra uma vez só.
    const fins = [...new Set([...melhores.values()].map((m) => m.i))].sort((a, b) => a - b);
    for (const i of fins) {
      const j = janela(i, h.pregoes, { comCurva: true });
      episodios.push({
        id: `${h.id}-${j.ate}`,
        horizonte: h.id,
        de: j.de,
        ate: j.ate,
        realPP: j.realPP,
        nominalPP: j.nominalPP,
        real: j.real,
        nominal: j.nominal,
      });
    }
  }
  return episodios;
}

// O arquivo que o coletor versiona (dados/episodios.json). A busca varre o
// histórico inteiro — milhares de janelas — e o resultado só muda quando o
// histórico muda; fazê-la a cada partida a frio de uma função da Vercel era
// pagar a conta na hora do request. `base` é o `atualizadoEm` do
// historico.json da MESMA coleta: é por ele que o servidor sabe que os dois
// arquivos falam do mesmo histórico.
export function montarArquivoDeEpisodios({ titulos, hojeISO, prazoMinimo, base, agora }) {
  return {
    geradoEm: agora,
    base,
    hoje: hojeISO,
    prazoMinimo,
    nota:
      "As janelas do histórico em que as taxas mais subiram, por horizonte (1, 5 e 21 pregões): as maiores altas médias de cada família " +
      "e, para cada título vivo em `hoje`, a maior alta no prazo dele. `real` e `nominal` são a alta (p.p.) por prazo (anos úteis/252).",
    episodios: acharEpisodios(titulos, { prazoMinimo, alvos: alvosDe(titulos, hojeISO) }),
  };
}

// Os episódios do arquivo, se ele for do mesmo histórico que o servidor tem
// (mesma `base`) e da mesma régua (mesmo piso); senão null, e quem chama
// calcula na hora. Na semente, ou em dev com um histórico mais novo que o
// arquivo, é o que acontece.
export function episodiosDoArquivo(arquivo, { base, prazoMinimo }) {
  if (!arquivo || !Array.isArray(arquivo.episodios) || !arquivo.episodios.length) return null;
  if (!base || arquivo.base !== base || arquivo.prazoMinimo !== prazoMinimo) return null;
  return arquivo.episodios;
}

// O choque de um episódio num prazo qualquer: interpolação linear entre os
// vencimentos que existiam na janela.
//
// FORA DO INTERVALO, VALE O DA PONTA MAIS PRÓXIMA — ao contrário da curva de
// juros, que devolve null em vez de extrapolar. A diferença é o que se
// extrapola: lá seria um NÍVEL de taxa, o número mais sensível da tela; aqui é
// o tamanho de um movimento, que nas pontas é quase plano (medido nas piores
// janelas: de 13 a 34 anos o choque real varia menos de 0,1 p.p.). E devolver
// null derrubaria a conta da carteira inteira por causa de um título curto,
// que é justamente o que menos pesa nela.
export function choqueNoPrazo(pontos, anos) {
  if (!pontos?.length || anos == null || !Number.isFinite(anos)) return null;
  if (anos <= pontos[0].anos) return pontos[0].deltaPP;
  const ultimo = pontos[pontos.length - 1];
  if (anos >= ultimo.anos) return ultimo.deltaPP;
  for (let i = 1; i < pontos.length; i++) {
    if (pontos[i].anos >= anos) {
      const a = pontos[i - 1];
      const b = pontos[i];
      const vao = b.anos - a.anos;
      return vao <= 0 ? b.deltaPP : a.deltaPP + ((anos - a.anos) / vao) * (b.deltaPP - a.deltaPP);
    }
  }
  return ultimo.deltaPP;
}
