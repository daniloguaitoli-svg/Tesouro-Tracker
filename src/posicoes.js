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
    // A data do preço usado: é até ela que o resultado vale, e até ela que a
    // comparação com o CDI tem de ir.
    dataDoPreco: titulo.data ?? null,
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

// ---------- O risco da carteira ----------

const FAMILIAS = [
  { id: "ipca", rotulo: "IPCA+" },
  { id: "prefixado", rotulo: "Prefixado" },
  { id: "selic", rotulo: "Selic" },
];
const familiaDe = (tipo) => (String(tipo).startsWith("ipca") ? "ipca" : String(tipo).startsWith("prefixado") ? "prefixado" : "selic");

// Como a carteira está repartida e o que um movimento de juros faz com ela.
// `grupos` é o de resumirCarteira(); só entram os que têm título e preço.
//
// O CHOQUE É "TODAS AS TAXAS, 1 PONTO, AO MESMO TEMPO": cada título reage pela
// própria sensibilidade (a mesma duration + convexidade que o Detalhe mostra,
// vinda do servidor) e os efeitos se somam. É um cenário, não uma previsão —
// juro real e juro nominal não andam juntos nem do mesmo tamanho, e a tela
// diz isso. A LFT entra com efeito ZERO: pós-fixada, o preço dela quase não
// reage a juro de mercado. Não é dado faltando; é o que ela é.
//
// A DURATION DA CARTEIRA é a média das durations pesada pelo valor de hoje,
// com a LFT contando zero pelo mesmo motivo.
export function riscoDaCarteira(grupos) {
  const validos = (grupos || []).filter((g) => !g.semTitulo && g.valorHoje != null && g.valorHoje > 0);
  const total = validos.reduce((s, g) => s + g.valorHoje, 0);
  if (!(total > 0)) return null;

  const porFamilia = FAMILIAS.map((f) => {
    const valor = validos.filter((g) => familiaDe(g.titulo.tipo) === f.id).reduce((s, g) => s + g.valorHoje, 0);
    return { ...f, valor, pct: (valor / total) * 100 };
  }).filter((f) => f.valor > 0);

  const anos = new Map();
  for (const g of validos) {
    const ano = g.titulo.vencimento.slice(0, 4);
    anos.set(ano, (anos.get(ano) || 0) + g.valorHoje);
  }
  const porAno = [...anos.entries()].sort().map(([ano, valor]) => ({ ano, valor, pct: (valor / total) * 100 }));

  // Um título com duration mas sem o cenário calculado (taxa ausente) deixa
  // a soma sem um pedaço: aí o choque inteiro sai null, em vez de menor.
  const efeito = (campo) => {
    let soma = 0;
    for (const g of validos) {
      if (familiaDe(g.titulo.tipo) === "selic") continue;
      const pct = g.titulo.duration?.[campo];
      if (pct == null) return null;
      soma += g.valorHoje * (pct / 100);
    }
    return { valor: soma, pct: (soma / total) * 100 };
  };
  let duration = 0;
  for (const g of validos) {
    if (familiaDe(g.titulo.tipo) === "selic") continue;
    const mac = g.titulo.duration?.macaulay;
    if (mac == null) {
      duration = null;
      break;
    }
    duration += (g.valorHoje / total) * mac;
  }

  return { total, porFamilia, porAno, duration, mais1pp: efeito("variacaoPor1pp"), menos1pp: efeito("variacaoMenos1pp") };
}

// ---------- O calendário do que ainda entra ----------

// As datas de pagamento que faltam de um título: o vencimento e, com cupom,
// de seis em seis meses para trás até passar de hoje — a mesma caminhada que
// o servidor faz em fluxosNTNB.
function datasDePagamento(vencimentoISO, comCupom, hojeISO) {
  if (!comCupom) return vencimentoISO > hojeISO ? [vencimentoISO] : [];
  const datas = [];
  const [a, m, d] = vencimentoISO.split("-").map(Number);
  for (let k = 0; ; k++) {
    const data = new Date(Date.UTC(a, m - 1 - 6 * k, d)).toISOString().slice(0, 10);
    if (data <= hojeISO) break;
    datas.push(data);
  }
  return datas.reverse();
}

// O que a carteira ainda recebe, ano a ano, se nada for vendido.
//
// DUAS COLUNAS QUE NÃO SE SOMAM: `nominal` (prefixados, em reais da data do
// pagamento) e `hoje` (IPCA+, a preços de hoje — a inflação vem por cima). É
// a mesma regra do total da carteira. A LFT fica fora do calendário e é
// devolvida em `semValor`: ela paga no vencimento, mas quanto, depende da
// Selic até lá.
export function calendarioDeRecebimentos(grupos, hojeISO) {
  const anos = new Map();
  const semValor = [];
  for (const g of grupos || []) {
    if (g.semTitulo) continue;
    const t = g.titulo;
    const r = t.recebimentos;
    if (!r) {
      if (t.vencimento > hojeISO) semValor.push({ nome: t.nome, vencimento: t.vencimento });
      continue;
    }
    for (const data of datasDePagamento(t.vencimento, t.comCupom, hojeISO)) {
      const noVencimento = data === t.vencimento;
      const valor = g.quantidade * ((t.comCupom ? r.cupom : 0) + (noVencimento ? r.principal : 0));
      const ano = data.slice(0, 4);
      if (!anos.has(ano)) anos.set(ano, { ano, nominal: 0, hoje: 0, pagamentos: [] });
      const linha = anos.get(ano);
      linha[r.unidade === "nominal" ? "nominal" : "hoje"] += valor;
      linha.pagamentos.push({ data, nome: t.nome, valor, unidade: r.unidade, principal: noVencimento });
    }
  }
  const linhas = [...anos.values()].sort((a, b) => (a.ano < b.ano ? -1 : 1));
  for (const l of linhas) l.pagamentos.sort((a, b) => (a.data < b.data ? -1 : a.data > b.data ? 1 : 0));
  return { linhas, semValor };
}

// ---------- Contra o CDI ----------

// Quanto o CDI rendeu entre duas datas, como fator (1,10 = 10%).
// `indice` é a série de /api/cdi: [[data, índice acumulado]], crescente.
//
// O dinheiro aplicado no dia D rende o CDI de D em diante e, até o dia A, o
// de A−1: por isso as duas pontas usam o índice do último dia ANTES de cada
// data. Fora do alcance da série devolve null — nunca o período que der.
export function fatorDoCdi(indice, deISO, ateISO) {
  if (!Array.isArray(indice) || indice.length < 2 || !deISO || !ateISO || ateISO <= deISO) return null;
  const antesDe = (iso) => {
    // Busca binária pelo último ponto com data < iso.
    let lo = 0;
    let hi = indice.length - 1;
    let achado = -1;
    while (lo <= hi) {
      const meio = (lo + hi) >> 1;
      if (indice[meio][0] < iso) {
        achado = meio;
        lo = meio + 1;
      } else hi = meio - 1;
    }
    return achado;
  };
  const primeiro = indice[0][0];
  if (deISO < primeiro) return null; // compra anterior à série
  const iDe = antesDe(deISO);
  const iAte = antesDe(ateISO);
  if (iAte < 0) return null;
  // Compra exatamente no primeiro dia da série: nada rendeu antes dela.
  const base = iDe < 0 ? 1 : indice[iDe][1];
  return indice[iAte][1] / base;
}

// O que o MESMO dinheiro, nas MESMAS datas, teria rendido no CDI — lote a
// lote, porque cada compra começou a render num dia diferente.
//
// Devolve { rendimento, pct, pctDoCdi } ou null se algum lote ficar fora do
// alcance da série (um total com um lote a menos compararia a carteira
// inteira com o CDI de parte dela).
//
// É bruto contra bruto: nem o resultado da carteira nem o CDI têm imposto
// descontado. E o CDI é a régua, não um investimento que se compre — um CDB
// ou um fundo rende uma fração dele.
export function compararComCdi(lotesAvaliados, indice) {
  let investido = 0;
  let rendimento = 0;
  let resultado = 0;
  for (const a of lotesAvaliados || []) {
    if (a.semTitulo || a.resultado == null) return null;
    const ate = a.dataDoPreco;
    const fator = fatorDoCdi(indice, a.lote.data, ate);
    if (fator == null) return null;
    investido += a.lote.valor;
    rendimento += a.lote.valor * (fator - 1);
    resultado += a.resultado;
  }
  if (!(investido > 0)) return null;
  return {
    rendimento,
    pct: (rendimento / investido) * 100,
    // "x% do CDI" só faz sentido com o CDI positivo e algum tempo decorrido.
    pctDoCdi: rendimento > 0 ? (resultado / rendimento) * 100 : null,
  };
}

// ---------- Cópia de segurança ----------

export const VERSAO_DO_BACKUP = 1;
const mesmaCompra = (a, b) => a.slug === b.slug && a.data === b.data && a.quantidade === b.quantidade && a.valor === b.valor;

// O texto do arquivo de cópia. Só as compras — nada de preço nem de conta,
// que o app refaz. `app` e `versao` deixam o arquivo dizer o que é.
export function exportarPosicoes(lista, agora = new Date().toISOString()) {
  return JSON.stringify({ app: "tesouro-tracker", versao: VERSAO_DO_BACKUP, exportadoEm: agora, posicoes: lista }, null, 2);
}

// Lê um arquivo de cópia e devolve o que ACRESCENTAR à lista atual.
//
// RESTAURAR SOMA, NÃO SUBSTITUI: quem restaura num aparelho que já tem
// compras registradas não espera perdê-las, e uma cópia antiga apagaria as
// mais novas. Compra igual a uma que já existe (mesmo título, data,
// quantidade e valor) é contada em `repetidas` e não entra duas vezes.
export function lerBackup(texto, atuais = []) {
  let bruto;
  try {
    bruto = JSON.parse(texto);
  } catch {
    return { erro: "Este arquivo não é uma cópia do Tesouro Tracker (não é JSON)." };
  }
  const lista = Array.isArray(bruto) ? bruto : bruto?.posicoes;
  if (!Array.isArray(lista)) return { erro: "Este arquivo não traz uma lista de compras." };
  const novas = [];
  let repetidas = 0;
  let invalidas = 0;
  for (const l of lista) {
    if (!ehLote(l)) {
      invalidas++;
      continue;
    }
    if ([...atuais, ...novas].some((x) => mesmaCompra(x, l))) {
      repetidas++;
      continue;
    }
    // Id novo se o do arquivo já estiver em uso: dois lotes com o mesmo id
    // fariam "Apagar" tirar os dois.
    const emUso = [...atuais, ...novas].some((x) => x.id === l.id);
    novas.push({ id: emUso ? `${l.id}-${novas.length}` : l.id, slug: l.slug, data: l.data, quantidade: l.quantidade, valor: l.valor });
  }
  return { novas, repetidas, invalidas };
}
