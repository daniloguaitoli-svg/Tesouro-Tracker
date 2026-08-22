// src/destaques.js — quais vencimentos aparecem em "Acompanhados de perto".
//
// A escolha é DO USUÁRIO e fica só neste aparelho (localStorage), pelo mesmo
// motivo dos alertas: o repositório é público, e o que uma pessoa acompanha
// diz muito sobre o que ela tem em carteira. Nada disso sobe para o Git.
//
// TRÊS ESTADOS, e a diferença entre os dois últimos importa:
//   null  -> nunca escolheu: usa os `destaque` do catálogo como ponto de
//            partida, para o Painel não nascer vazio numa instalação nova.
//   [...] -> escolheu estes.
//   []    -> escolheu NENHUM (desmarcou todos). É diferente de "nunca
//            escolheu": aqui o Painel mostra o convite para escolher, em vez
//            de ressuscitar os padrões que a pessoa acabou de tirar.
//
// O ⭐ do arquivo-ponte (dados/ntnb.json) continua vindo do catálogo, não
// daqui — aquele arquivo é público e a escolha pessoal não entra nele.

export const CHAVE = "tesouro-tracker-destaques";

// Devolve a lista escolhida, ou null quando o usuário nunca escolheu.
export function carregarDestaques() {
  if (typeof window === "undefined") return null;
  try {
    const bruto = window.localStorage.getItem(CHAVE);
    if (bruto == null) return null;
    const lista = JSON.parse(bruto);
    return Array.isArray(lista) ? lista.filter((s) => typeof s === "string") : null;
  } catch {
    // Storage corrompido cai para os padrões do catálogo em vez de quebrar a
    // tela — mesma postura do resto do app com dado ruim.
    return null;
  }
}

export function salvarDestaques(lista) {
  try {
    window.localStorage.setItem(CHAVE, JSON.stringify(lista));
  } catch {
    /* modo privativo ou cota cheia — o app segue funcionando sem persistir */
  }
}

// Conjunto de slugs a destacar: a escolha do usuário quando existe, senão os
// marcados no catálogo.
export function resolverDestaques(escolha, itens) {
  if (escolha) return new Set(escolha);
  return new Set((itens || []).filter((t) => t.destaque).map((t) => t.slug));
}

// Liga/desliga um vencimento. Na primeira vez PARTE dos padrões do catálogo em
// vez de começar do zero: quem clica a primeira estrela quer acrescentar à
// lista que já via, não zerá-la.
export function alternarDestaque(escolha, itens, slug) {
  const base = escolha ?? [...resolverDestaques(null, itens)];
  return base.includes(slug) ? base.filter((s) => s !== slug) : [...base, slug];
}
