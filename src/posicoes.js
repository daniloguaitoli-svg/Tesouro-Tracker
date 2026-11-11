// src/posicoes.js — as compras que a pessoa registrou, e o que elas valem.
//
// SÓ NESTE APARELHO, e isto não é detalhe: o repositório é público e o app
// não tem conta nem servidor próprio de dados. Quanto alguém tem em cada
// título é a informação mais sensível que passa por aqui — então ela fica no
// localStorage e NUNCA entra numa chamada de /api. É por isso que toda a
// conta está neste arquivo, no navegador: o servidor manda o que é do TÍTULO
// (preço, valor de face, cupons pagos por unidade) e a multiplicação pela
// quantidade acontece aqui. O verificar.mjs confere que nada em src/ manda
// uma posição para a rede.
//
// O QUE SE GUARDA de cada compra (um "lote") é o que está no extrato do
// Tesouro Direto: o título, a data, a quantidade e o valor pago. A quantidade
// não é deduzida do valor — o preço de compra tem um spread sobre o preço que
// o app acompanha (o de recompra), e dividir um pelo outro daria uma
// quantidade errada com cara de certa.
//
// Arquivo puro, sem importar nada de React — o verificar.mjs exercita as
// contas em node. A tabela do imposto vem de impostos.js, que também é puro.

import { aliquotaIR, diasCorridosEntre, PRAZO_IOF_DIAS } from "./impostos.js";

export const CHAVE = "tesouro-tracker-posicoes";

// ---------- Guardar ----------

const ehLote = (l) =>
  l &&
  typeof l.id === "string" &&
  typeof l.slug === "string" &&
  /^\d{4}-\d{2}-\d{2}$/.test(l.data || "") &&
  Number.isFinite(l.quantidade) &&
  l.quantidade > 0 &&
  Number.isFinite(l.valor) &&
  l.valor > 0;

export function carregarPosicoes() {
  if (typeof window === "undefined") return [];
  try {
    const bruto = JSON.parse(window.localStorage.getItem(CHAVE) || "[]");
    // Um registro estragado sai sozinho; os outros ficam. Derrubar a lista
    // inteira por causa de um item seria perder o que a pessoa digitou.
    return Array.isArray(bruto) ? bruto.filter(ehLote) : [];
  } catch {
    return []; // storage corrompido não pode derrubar o app
  }
}

export function salvarPosicoes(lista) {
  try {
    window.localStorage.setItem(CHAVE, JSON.stringify(lista));
    return true;
  } catch {
    // Modo privativo ou cota cheia. Aqui o retorno importa: a tela avisa,
    // porque uma compra que "sumiu" ao reabrir o app é pior que um erro.
    return false;
  }
}

// ---------- Registrar ----------

// "1.234,56" ou "1,25" -> número; vazio ou texto -> null.
export function numeroBR(texto) {
  const limpo = String(texto ?? "").trim().replace(/\./g, "").replace(",", ".");
  if (!limpo) return null;
  const n = Number(limpo);
  return Number.isFinite(n) ? n : null;
}

// Confere o que foi digitado e devolve { lote } ou { erro } — nunca um lote
// "consertado". `titulo` é o item de /api/titulos escolhido no formulário.
export function montarLote({ slug, data, quantidade, valor }, titulo, hoje) {
  if (!titulo || titulo.slug !== slug) return { erro: "Escolha o título." };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(data || "")) return { erro: "Informe a data da compra." };
  if (data > hoje) return { erro: "A data da compra está no futuro." };
  if (data >= titulo.vencimento) return { erro: "A data é posterior ao vencimento deste título." };
  const q = numeroBR(quantidade);
  if (q == null || !(q > 0)) return { erro: "Informe a quantidade de títulos (pode ser fração, como 0,25)." };
  const v = numeroBR(valor);
  if (v == null || !(v > 0)) return { erro: "Informe o valor investido, em reais." };
  return {
    lote: {
      // Basta ser único neste aparelho: a hora e um pedaço ao acaso.
      id: `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`,
      slug,
      data,
      quantidade: q,
      valor: v,
    },
  };
}

// ---------- Avaliar ----------

// O que UM lote vale. `titulo` é o item de /api/titulos (ou null, se o título
// saiu da lista — venceu). `desde` é a primeira data do histórico do app.
//
// TRÊS RESPOSTAS, que não são a mesma pergunta:
//   valorHoje     vender hoje: quantidade × o preço de recompra do Tesouro,
//                 que é exatamente o preço que o app acompanha.
//   seVender      a mesma venda depois do imposto de renda — só para título
//                 sem cupom, em que o custo é um e o ganho é um.
//   noVencimento  não vender: o que os títulos ainda pagam até o fim. Em
//                 reais nominais num prefixado, em reais de hoje num IPCA+,
//                 e inexistente numa LFT (rende a Selic que houver).
//
// Tudo que não dá para saber sai null, com o motivo ao lado — nunca zero.
export function avaliarLote(lote, titulo, { desde = null } = {}) {
  if (!titulo) return { lote, semTitulo: true };

  const q = lote.quantidade;
  const valorHoje = titulo.pu != null ? q * titulo.pu : null;

  // Cupons recebidos desde a compra: recebeu quem comprou ANTES da data-ex.
  let cupons = 0;
  let cuponsDesconhecidos = null;
  if (titulo.comCupom) {
    const devidos = (titulo.cuponsPagos || []).filter((c) => lote.data < c.ex);
    if (desde && lote.data < desde) cuponsDesconhecidos = "compra anterior ao histórico do app";
    else if (devidos.some((c) => c.valor == null)) cuponsDesconhecidos = "sem preço perto da data de um dos cupons";
    else cupons = devidos.reduce((s, c) => s + c.valor * q, 0);
  }

  const resultado = valorHoje == null ? null : valorHoje + cupons - lote.valor;
  const dias = diasCorridosEntre(lote.data, titulo.data);

  // Depois do imposto, se vendesse hoje. Com cupom, cada pagamento já teve o
  // seu imposto e a conta do líquido é outra — fica de fora, como na
  // Calculadora. Em menos de 30 dias há IOF, que o app não calcula.
  let seVender = null;
  if (!titulo.comCupom && valorHoje != null && dias != null && dias >= PRAZO_IOF_DIAS) {
    const aliquota = aliquotaIR(dias);
    const imposto = aliquota * Math.max(0, valorHoje - lote.valor);
    seVender = { aliquota, imposto, liquido: valorHoje - imposto };
  }

  let noVencimento = null;
  if (titulo.recebimentos) {
    const r = titulo.recebimentos;
    noVencimento = { valor: q * r.total, unidade: r.unidade, principal: q * r.principal, cupom: q * r.cupom, pagamentos: r.pagamentos };
    // No prefixado sem cupom tudo é nominal e conhecido — o que se recebe e o
    // que se pagou —, então o imposto do vencimento também sai exato.
    if (!titulo.comCupom && r.unidade === "nominal") {
      const prazo = diasCorridosEntre(lote.data, titulo.vencimento);
      const aliquota = aliquotaIR(prazo);
      if (aliquota != null) {
        const imposto = aliquota * Math.max(0, noVencimento.valor - lote.valor);
        noVencimento.liquido = { aliquota, imposto, valor: noVencimento.valor - imposto };
      }
    }
  }

  return {
    lote,
    valorHoje,
    cupons,
    cuponsDesconhecidos,
    resultado,
    resultadoPct: resultado == null ? null : (resultado / lote.valor) * 100,
    dias,
    iof: dias != null && dias < PRAZO_IOF_DIAS,
    seVender,
    noVencimento,
  };
}

// A soma de vários lotes do MESMO título. Somar "no vencimento" aqui é
// seguro: é um título só, uma unidade só.
function somarLotes(avaliados) {
  const soma = (campo) => avaliados.reduce((s, a) => s + (campo(a) ?? 0), 0);
  const todos = (campo) => avaliados.every((a) => campo(a) != null);
  const algumDesconhecido = avaliados.find((a) => a.cuponsDesconhecidos);
  return {
    quantidade: soma((a) => a.lote.quantidade),
    investido: soma((a) => a.lote.valor),
    valorHoje: todos((a) => a.valorHoje) ? soma((a) => a.valorHoje) : null,
    cupons: soma((a) => a.cupons),
    cuponsDesconhecidos: algumDesconhecido?.cuponsDesconhecidos ?? null,
    resultado: todos((a) => a.resultado) ? soma((a) => a.resultado) : null,
    // "Se vender" só vale para o grupo quando vale para TODOS os lotes: um
    // lote com menos de 30 dias (IOF) deixaria o total sem um pedaço.
    seVender: todos((a) => a.seVender)
      ? { imposto: soma((a) => a.seVender.imposto), liquido: soma((a) => a.seVender.liquido) }
      : null,
    noVencimento: todos((a) => a.noVencimento)
      ? {
          valor: soma((a) => a.noVencimento.valor),
          unidade: avaliados[0].noVencimento.unidade,
          cupom: soma((a) => a.noVencimento.cupom),
          pagamentos: avaliados[0].noVencimento.pagamentos,
          liquido: todos((a) => a.noVencimento.liquido)
            ? { imposto: soma((a) => a.noVencimento.liquido.imposto), valor: soma((a) => a.noVencimento.liquido.valor) }
            : null,
        }
      : null,
    algumComIOF: avaliados.some((a) => a.iof),
  };
}

// A carteira inteira: um grupo por título (na ordem em que os títulos chegam
// do servidor — família, depois vencimento) e o total.
//
// O TOTAL SOMA SÓ O QUE É DA MESMA MOEDA: investido, valor de hoje e
// resultado são todos reais de agora. O "no vencimento" NÃO entra no total —
// num prefixado ele é em reais de 2029 e num IPCA+ em reais de hoje, e somar
// os dois daria um número sem unidade.
export function resumirCarteira(lotes, titulos, opcoes = {}) {
  const porSlug = new Map((titulos || []).map((t) => [t.slug, t]));
  const ordem = new Map((titulos || []).map((t, i) => [t.slug, i]));
  const grupos = new Map();
  for (const lote of lotes || []) {
    const titulo = porSlug.get(lote.slug) || null;
    if (!grupos.has(lote.slug)) grupos.set(lote.slug, { slug: lote.slug, titulo, lotes: [] });
    grupos.get(lote.slug).lotes.push(avaliarLote(lote, titulo, opcoes));
  }
  const lista = [...grupos.values()]
    .map((g) => {
      g.lotes.sort((a, b) => (a.lote.data < b.lote.data ? -1 : a.lote.data > b.lote.data ? 1 : 0));
      return { ...g, ...(g.titulo ? somarLotes(g.lotes) : { semTitulo: true, investido: g.lotes.reduce((s, a) => s + a.lote.valor, 0) }) };
    })
    // Títulos que saíram da lista (vencidos) vão para o fim.
    .sort((a, b) => (ordem.get(a.slug) ?? Infinity) - (ordem.get(b.slug) ?? Infinity));

  const comValor = lista.filter((g) => !g.semTitulo && g.valorHoje != null);
  const investido = comValor.reduce((s, g) => s + g.investido, 0);
  const valorHoje = comValor.reduce((s, g) => s + g.valorHoje, 0);
  const resultado = comValor.reduce((s, g) => s + g.resultado, 0);
  return {
    grupos: lista,
    total: comValor.length
      ? {
          investido,
          valorHoje,
          resultado,
          resultadoPct: investido > 0 ? (resultado / investido) * 100 : null,
          cupons: comValor.reduce((s, g) => s + g.cupons, 0),
          cuponsDesconhecidos: comValor.some((g) => g.cuponsDesconhecidos),
          // Quantos grupos ficaram de fora da soma, para a tela dizer.
          foraDoTotal: lista.length - comValor.length,
        }
      : null,
  };
}
