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
// reproduzível: para cada horizonte (1, 5 e 21 pregões), a janela em que a
// taxa média mais subiu. São três réguas — só IPCA+, só Prefixado, e a média
// das duas — porque a pior janela de quem só tem IPCA+ não é a de quem só tem
// Prefixado. O aparelho escolhe, entre as candidatas, a que mais dói NA
// carteira que está nele.
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

const MS_ANO = 365.25 * 86400000;

export function familiaDoChoque(tipo) {
  if (String(tipo).startsWith("ipca")) return "real";
  if (String(tipo).startsWith("prefixado")) return "nominal";
  return null; // LFT: sem choque de taxa
}

// `titulos`: [{ tipo, vencimento, serie: { "AAAA-MM-DD": [taxa, pu] } }], o
// formato de dados/historico.json (vencidos inclusive: em 2020 eram eles que
// estavam vivos). `prazoMinimo` é o piso da curva — abaixo dele a taxa
// anualizada de um título perto de vencer é ruído, não mercado.
//
// Devolve [{ id, horizonte, de, ate, realPP, nominalPP, real, nominal }],
// onde `real` e `nominal` são [{ anos, deltaPP }] em ordem de prazo.
export function acharEpisodios(titulos, { prazoMinimo = 1.5 } = {}) {
  const lista = (titulos || [])
    .map((t) => ({ ...t, familia: familiaDoChoque(t.tipo), venceEm: Date.parse(`${t.vencimento}T00:00:00Z`) }))
    .filter((t) => t.familia && t.serie);
  const datas = [...new Set(lista.flatMap((t) => Object.keys(t.serie)))].sort();
  const ms = datas.map((d) => Date.parse(`${d}T00:00:00Z`));

  // A alta média de cada família numa janela. O prazo aqui é contado em dias
  // corridos de propósito: só decide quem passa do piso, e esta função roda
  // por todo o histórico — a conta em dias úteis fica para os vencedores.
  const medir = (i, k) => {
    const d0 = datas[i - k];
    const d1 = datas[i];
    const soma = { real: 0, nominal: 0 };
    const n = { real: 0, nominal: 0 };
    for (const t of lista) {
      if ((t.venceEm - ms[i]) / MS_ANO < prazoMinimo) continue;
      const a = t.serie[d0]?.[0];
      const b = t.serie[d1]?.[0];
      if (a == null || b == null) continue;
      soma[t.familia] += b - a;
      n[t.familia]++;
    }
    if (n.real < MIN_TITULOS || n.nominal < MIN_TITULOS) return null;
    return { i, k, real: soma.real / n.real, nominal: soma.nominal / n.nominal };
  };

  const reguas = [
    (j) => j.real,
    (j) => j.nominal,
    (j) => (j.real + j.nominal) / 2,
  ];

  const episodios = [];
  for (const h of HORIZONTES) {
    const melhores = reguas.map(() => null);
    for (let i = h.pregoes; i < datas.length; i++) {
      if ((ms[i] - ms[i - h.pregoes]) / 86400000 > h.maxDiasCorridos) continue;
      const j = medir(i, h.pregoes);
      if (!j) continue;
      reguas.forEach((r, q) => {
        if (!melhores[q] || r(j) > r(melhores[q])) melhores[q] = j;
      });
    }
    const vistos = new Set();
    for (const j of melhores) {
      // Uma janela em que a taxa média CAIU não é um momento ruim: histórico
      // curto demais para ter um, e aí não há episódio a mostrar.
      if (!j || vistos.has(j.i) || !((j.real + j.nominal) / 2 > 0)) continue;
      vistos.add(j.i);
      episodios.push(montar(lista, datas[j.i - j.k], datas[j.i], h, j, prazoMinimo));
    }
  }
  return episodios;
}

// O formato do choque na janela vencedora: Δ taxa por prazo, por família.
// Aqui o prazo é em dias úteis/252, a régua do resto do app, porque é nele
// que o título de hoje vai ser interpolado.
function montar(lista, de, ate, horizonte, j, prazoMinimo) {
  const porFamilia = { real: new Map(), nominal: new Map() };
  for (const t of lista) {
    const a = t.serie[de]?.[0];
    const b = t.serie[ate]?.[0];
    if (a == null || b == null || !(t.vencimento > ate)) continue;
    const anos = anosUteisEntre(ate, t.vencimento);
    if (anos < prazoMinimo) continue;
    // Com e sem cupom do mesmo vencimento caem no mesmo prazo: entram como
    // média, senão a curva do choque teria dois valores no mesmo x.
    const chave = anos.toFixed(3);
    const g = porFamilia[t.familia].get(chave) || { anos, soma: 0, n: 0 };
    g.soma += b - a;
    g.n++;
    porFamilia[t.familia].set(chave, g);
  }
  const pontos = (m) => [...m.values()].map((g) => ({ anos: g.anos, deltaPP: g.soma / g.n })).sort((x, y) => x.anos - y.anos);
  return {
    id: `${horizonte.id}-${ate}`,
    horizonte: horizonte.id,
    de,
    ate,
    realPP: j.real,
    nominalPP: j.nominal,
    real: pontos(porFamilia.real),
    nominal: pontos(porFamilia.nominal),
  };
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
