// src/planilha.js — lê compras coladas de uma planilha.
//
// PARA QUE: quem investe há anos tem dezenas de compras, e digitar uma por
// uma é o que faz ninguém usar a Carteira. A Área do Investidor da B3 e as
// corretoras deixam baixar o extrato numa planilha; a pessoa copia as linhas
// (com o cabeçalho) e cola aqui.
//
// É TOLERANTE, E DIZ O QUE NÃO ENTENDEU. Planilhas mudam de coluna, de ordem e
// de nome de uma corretora para outra, então nada aqui lê por posição: as
// colunas são achadas pelo NOME no cabeçalho, o separador é detectado, e os
// números aceitam o formato brasileiro. O que não der para ler com certeza é
// devolvido em `ignoradas`, com o motivo, e a tela mostra — uma linha lida
// errado em silêncio viraria uma posição que a pessoa não tem.
//
// O QUE NÃO SE SABE: este leitor foi escrito a partir dos nomes de coluna
// usuais desses extratos (Produto, Data, Movimentação, Quantidade, Valor da
// Operação), NÃO de um arquivo real da B3 — o ambiente em que foi escrito não
// tinha um. Por isso a tela mostra uma PRÉVIA antes de gravar qualquer coisa,
// e nada entra sem a pessoa conferir e confirmar.
//
// Tudo no aparelho: o texto colado não vai a lugar nenhum. Arquivo puro.

const semAcento = (s) => String(s ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();

// "R$ 1.234,56", "1234.56", "0,25" -> número. Quando há ponto E vírgula, o
// último dos dois é o decimal; só vírgula é decimal (formato brasileiro); só
// ponto é decimal se houver uma ou duas casas depois dele, senão é milhar
// ("1.000" é mil — numa planilha brasileira, quase sempre).
export function numeroDaPlanilha(texto) {
  let s = String(texto ?? "").replace(/[^\d.,-]/g, "");
  if (!s || !/\d/.test(s)) return null;
  const virgula = s.lastIndexOf(",");
  const ponto = s.lastIndexOf(".");
  if (virgula >= 0 && ponto >= 0) {
    s = virgula > ponto ? s.replace(/\./g, "").replace(",", ".") : s.replace(/,/g, "");
  } else if (virgula >= 0) {
    s = s.replace(",", ".");
  } else if (ponto >= 0 && !/\.\d{1,2}$/.test(s)) {
    s = s.replace(/\./g, "");
  }
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

// "03/02/2025", "3/2/25" ou "2025-02-03" -> ISO; o resto -> null.
export function dataDaPlanilha(texto) {
  const s = String(texto ?? "").trim();
  let m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) return `${m[1]}-${m[2]}-${m[3]}`;
  m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2}|\d{4})\b/);
  if (!m) return null;
  const ano = m[3].length === 2 ? `20${m[3]}` : m[3];
  const iso = `${ano}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}`;
  // Confere que a data existe (31/02 não existe).
  const d = new Date(`${iso}T00:00:00Z`);
  return Number.isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== iso ? null : iso;
}

// O nome de um produto ("Tesouro IPCA+ com Juros Semestrais 2035") -> o
// título do app. Devolve { titulo } ou { motivo }.
export function tituloDoNome(nome, titulos) {
  const n = semAcento(nome);
  if (!n) return { motivo: "sem nome de produto" };
  if (/renda\s*\+|educa\s*\+/.test(n)) return { motivo: "Tesouro RendA+ e Educa+ não são acompanhados pelo app" };
  const ano = (n.match(/\b(20\d{2})\b/g) || []).pop();
  if (!ano) return { motivo: "o nome não traz o ano de vencimento" };
  const comJuros = /juros|semestra|ntn-?f\b|ntn-?b(?!\s*princ)/.test(n);
  let familia = null;
  if (/selic|lft\b/.test(n)) familia = "selic";
  else if (/ipca|ntn-?b/.test(n)) familia = comJuros ? "ipca-juros" : "ipca";
  else if (/prefixado|pre-?fixado|ltn\b|ntn-?f\b/.test(n)) familia = comJuros ? "prefixado-juros" : "prefixado";
  if (!familia) return { motivo: "não é IPCA+, Prefixado nem Selic" };
  const candidatos = (titulos || []).filter((t) => t.tipo === familia && t.vencimento.startsWith(ano));
  if (candidatos.length === 1) return { titulo: candidatos[0] };
  if (!candidatos.length) return { motivo: `não há ${familia} ${ano} na lista do app (já venceu?)` };
  return { motivo: `há mais de um ${familia} ${ano} — registre este à mão` };
}

// As colunas, pelo nome. A ordem dos testes importa em `valor`: "Valor da
// Operação" tem de ganhar de "Preço unitário" e de um "Valor" genérico.
const COLUNAS = {
  produto: [/produto|titulo|ativo|papel|descri/],
  data: [/data.*(negoc|opera|compra|liquid|movim)/, /^data\b/, /data/],
  quantidade: [/quant|qtd/],
  valor: [/valor.*(opera|total|invest|brut|financ)|financeiro|total.*(opera|invest)/, /valor.*liq/, /^valor\b/],
  movimento: [/movimenta|tipo.*(opera|movim|negoc)|^opera[cç][aã]o$|^tipo$|^c\/v$|compra.*venda|natureza/],
};
const ehCompra = (texto) => /compra|aplica[cç]|^c$|subscri/.test(semAcento(texto));

function acharColuna(cabecalho, padroes) {
  for (const re of padroes) {
    const i = cabecalho.findIndex((c) => re.test(c));
    if (i >= 0) return i;
  }
  return -1;
}

// `texto`: as linhas coladas, com o cabeçalho. `titulos`: os de /api/titulos.
// Devolve { lotes, ignoradas: [{ linha, motivo }], colunas, erro }.
export function lerPlanilha(texto, titulos, hojeISO) {
  const linhas = String(texto ?? "").split(/\r?\n/).map((l) => l.replace(/\s+$/, "")).filter((l) => l.trim());
  if (linhas.length < 2) return { erro: "Cole as linhas da planilha junto com a linha de cabeçalho (o nome das colunas)." };

  // O separador: tabulação (o que vem de copiar no Excel), senão ponto e
  // vírgula, senão vírgula.
  // Contado nas dez primeiras linhas, não só na primeira: planilhas exportadas
  // costumam abrir com um título solto, que não tem separador nenhum.
  const topo = linhas.slice(0, 10);
  const conta = (sep) => Math.max(...topo.map((l) => l.split(sep).length - 1));
  const sep = conta("\t") ? "\t" : conta(";") >= conta(",") && conta(";") ? ";" : ",";
  const cortar = (l) => l.split(sep).map((c) => c.trim().replace(/^"|"$/g, ""));

  // O cabeçalho é a primeira linha em que se acham produto, quantidade e
  // valor — planilhas exportadas costumam ter um título em cima.
  let iCab = -1;
  let idx = null;
  for (let i = 0; i < Math.min(linhas.length, 10); i++) {
    const cab = cortar(linhas[i]).map(semAcento);
    const achadas = Object.fromEntries(Object.entries(COLUNAS).map(([k, res]) => [k, acharColuna(cab, res)]));
    if (achadas.produto >= 0 && achadas.quantidade >= 0 && achadas.valor >= 0 && achadas.data >= 0) {
      iCab = i;
      idx = achadas;
      break;
    }
  }
  if (iCab < 0) {
    return { erro: "Não encontrei no cabeçalho as colunas de produto, data, quantidade e valor. Cole a planilha com a linha dos nomes das colunas." };
  }
  const cabOriginal = cortar(linhas[iCab]);
  const colunas = Object.fromEntries(Object.entries(idx).filter(([, i]) => i >= 0).map(([k, i]) => [k, cabOriginal[i]]));

  const lotes = [];
  const ignoradas = [];
  for (let i = iCab + 1; i < linhas.length; i++) {
    const c = cortar(linhas[i]);
    const numeroDaLinha = i + 1;
    const recusar = (motivo) => ignoradas.push({ linha: numeroDaLinha, texto: linhas[i].replace(/\t/g, " · ").slice(0, 90), motivo });

    if (idx.movimento >= 0 && c[idx.movimento] && !ehCompra(c[idx.movimento])) {
      recusar(`não é compra ("${c[idx.movimento]}")`);
      continue;
    }
    const achado = tituloDoNome(c[idx.produto], titulos);
    if (!achado.titulo) {
      recusar(achado.motivo);
      continue;
    }
    const data = dataDaPlanilha(c[idx.data]);
    if (!data) {
      recusar("data ilegível");
      continue;
    }
    if (data > hojeISO || data >= achado.titulo.vencimento) {
      recusar("data no futuro ou depois do vencimento");
      continue;
    }
    const quantidade = numeroDaPlanilha(c[idx.quantidade]);
    const valor = numeroDaPlanilha(c[idx.valor]);
    if (!(quantidade > 0) || !(valor > 0)) {
      recusar("quantidade ou valor ilegível");
      continue;
    }
    lotes.push({
      id: `p${Date.now().toString(36)}${i}${Math.random().toString(36).slice(2, 6)}`,
      slug: achado.titulo.slug,
      nome: achado.titulo.nome, // só para a prévia; não é gravado
      data,
      quantidade,
      valor: Math.abs(valor),
    });
  }
  return { lotes, ignoradas, colunas };
}
