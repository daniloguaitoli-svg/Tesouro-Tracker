// server/providers/focus.js — a pesquisa Focus do Banco Central: o que os
// economistas esperam para a Selic e para o IPCA.
//
// PARA QUE: o app já mostra o que os PREÇOS embutem — a Selic implícita no DI,
// a inflação implícita entre as curvas. Preço carrega prêmio de risco; a
// pesquisa, não. Lado a lado, a distância entre os dois é a leitura: quanto do
// que a curva embute é expectativa e quanto é o mercado cobrando para correr o
// risco.
//
// FONTE: a API pública de Expectativas de Mercado do BCB (serviço Olinda,
// OData), sem chave. Dois recursos:
//   ExpectativasMercadoSelic  — a Selic esperada reunião a reunião do Copom
//                               (campo Reuniao, no formato "R8/2026");
//   ExpectativasMercadoAnuais — o IPCA esperado por ano-calendário
//                               (campo DataReferencia, "2027").
// Em ambos usa-se a MEDIANA, que é o número que o relatório Focus publica.
//
// QUEM CHAMA É O COLETOR, não a função serverless — a pesquisa sai uma vez por
// semana, e o resultado fica versionado em dados/focus.json com o mesmo
// contrato do Fed e do BCE: fonte que falha mantém o valor anterior.
//
// DE ONDE ISTO FOI ESCRITO NÃO SE ALCANÇA olinda.bcb.gov.br. Os nomes dos
// campos vieram da página de dados abertos do BCB e de bibliotecas públicas
// que consomem a mesma API, não de uma resposta vista. Por isso o parser acha
// os campos pelo NOME, sem depender de caixa nem de ordem, e devolve erro com
// amostra em vez de número — e o coletor loga o que veio, em dry-run
// inclusive. CONFERIDO NO RUNNER em 13/11/2026: as duas consultas responderam
// na primeira tentativa, com os campos como estão aqui (16 reuniões da Selic,
// IPCA de 2026 a 2030).
//
// `baseCalculo` separa duas janelas de respostas (0 e 1). A documentação que
// se alcançou não diz qual é qual; usa-se a 0, que é a que as bibliotecas
// tratam como padrão, e o coletor loga as duas para a diferença ficar à
// vista. Naquela rodada a base 1 já trazia a R2/2027 em 13,75% contra 13,5%
// da base 0 — o que combina com a 1 ser uma janela mais curta e recente, mas
// é a leitura de um dia, não uma confirmação.

const BASE = "https://olinda.bcb.gov.br/olinda/servico/Expectativas/versao/v1/odata";
const UA = { "User-Agent": "tesouro-tracker (github actions)", Accept: "application/json" };

// As linhas vêm da mais nova para a mais velha; `top` só precisa cobrir a
// data mais recente inteira (uma linha por reunião ou por ano, vezes as duas
// bases de cálculo).
const consulta = (recurso, indicador, top) =>
  `${BASE}/${recurso}?$filter=${encodeURIComponent(`Indicador eq '${indicador}'`)}&$orderby=${encodeURIComponent("Data desc")}&$top=${top}&$format=json`;

export const URL_FOCUS_SELIC = consulta("ExpectativasMercadoSelic", "Selic", 120);
export const URL_FOCUS_IPCA = consulta("ExpectativasMercadoAnuais", "IPCA", 60);

// Acha o valor de um campo pelo nome, sem depender de caixa.
function campo(linha, nome) {
  const alvo = nome.toLowerCase();
  for (const k of Object.keys(linha || {})) if (k.toLowerCase() === alvo) return linha[k];
  return undefined;
}

// O corpo da resposta -> as linhas da DATA MAIS RECENTE, na base de cálculo
// pedida. Devolve { ok, motivo, amostra, data, linhas }.
export function lerRespostaFocus(texto, { baseCalculo = 0 } = {}) {
  let json;
  try {
    json = typeof texto === "string" ? JSON.parse(texto) : texto;
  } catch {
    return { ok: false, motivo: "resposta não é JSON", amostra: String(texto ?? "").slice(0, 200), linhas: [] };
  }
  const valor = json?.value;
  if (!Array.isArray(valor) || !valor.length) {
    return { ok: false, motivo: "resposta sem linhas", amostra: JSON.stringify(json ?? null).slice(0, 200), linhas: [] };
  }
  const comData = valor.filter((l) => /^\d{4}-\d{2}-\d{2}/.test(String(campo(l, "Data") ?? "")));
  if (!comData.length || campo(comData[0], "Mediana") === undefined) {
    return { ok: false, motivo: "campos Data/Mediana não encontrados", amostra: JSON.stringify(valor[0]).slice(0, 300), linhas: [] };
  }
  // Se o campo da base não existir, todas as linhas servem (não há o que
  // separar); se existir, só as da base pedida.
  const daBase = comData.filter((l) => {
    const b = campo(l, "baseCalculo");
    return b === undefined || b === null || Number(b) === baseCalculo;
  });
  if (!daBase.length) return { ok: false, motivo: `nenhuma linha na base de cálculo ${baseCalculo}`, amostra: JSON.stringify(valor[0]).slice(0, 300), linhas: [] };
  const data = daBase.reduce((m, l) => (String(campo(l, "Data")).slice(0, 10) > m ? String(campo(l, "Data")).slice(0, 10) : m), "");
  const linhas = daBase.filter((l) => String(campo(l, "Data")).slice(0, 10) === data);
  return { ok: true, motivo: null, data, linhas };
}

const numero = (v) => (v == null || v === "" || !Number.isFinite(Number(v)) ? null : Number(v));

// "R8/2026" -> { ano: 2026, ordem: 8 }: a oitava reunião ordinária do ano.
export function partesDaReuniao(txt) {
  const m = String(txt ?? "").trim().match(/^R(\d{1,2})\/(\d{4})$/i);
  return m ? { ordem: Number(m[1]), ano: Number(m[2]) } : null;
}

// As linhas da Selic -> [{ reuniao, ano, ordem, mediana, respondentes }].
export function selicPorReuniao(linhas) {
  return (linhas || [])
    .map((l) => {
      const partes = partesDaReuniao(campo(l, "Reuniao"));
      const mediana = numero(campo(l, "Mediana"));
      if (!partes || mediana == null) return null;
      return { reuniao: `R${partes.ordem}/${partes.ano}`, ...partes, mediana, respondentes: numero(campo(l, "numeroRespondentes")) };
    })
    .filter(Boolean)
    .sort((a, b) => a.ano - b.ano || a.ordem - b.ordem);
}

// As linhas do IPCA anual -> [{ ano, mediana, respondentes }].
export function ipcaPorAno(linhas) {
  const porAno = new Map();
  for (const l of linhas || []) {
    const ano = Number(String(campo(l, "DataReferencia") ?? "").slice(0, 4));
    const mediana = numero(campo(l, "Mediana"));
    if (!Number.isInteger(ano) || ano < 2000 || mediana == null) continue;
    // "IPCA" tem detalhamentos em algumas séries; fica a linha sem detalhe.
    const detalhe = campo(l, "IndicadorDetalhe");
    if (detalhe != null && String(detalhe).trim() !== "") continue;
    if (!porAno.has(ano)) porAno.set(ano, { ano, mediana, respondentes: numero(campo(l, "numeroRespondentes")) });
  }
  return [...porAno.values()].sort((a, b) => a.ano - b.ano);
}

async function baixar(url) {
  const r = await fetch(url, { headers: UA, signal: AbortSignal.timeout(30000) });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.text();
}

// Lê as duas séries. Nunca lança: o que falhar vem null, com o erro anotado, e
// o coletor mantém o valor anterior do arquivo. `bruto` vai junto para o
// coletor logar o que a outra base de cálculo diria.
export async function lerFocus() {
  const saida = { selic: null, ipca: null, erros: [], bruto: {} };
  try {
    const texto = await baixar(URL_FOCUS_SELIC);
    saida.bruto.selic = texto;
    const r = lerRespostaFocus(texto);
    if (!r.ok) throw new Error(`${r.motivo} — amostra: ${r.amostra}`);
    const reunioes = selicPorReuniao(r.linhas);
    if (!reunioes.length) throw new Error(`nenhuma reunião legível — amostra: ${JSON.stringify(r.linhas[0]).slice(0, 300)}`);
    saida.selic = { data: r.data, reunioes };
  } catch (e) {
    saida.erros.push(`selic: ${e.message}`);
  }
  try {
    const texto = await baixar(URL_FOCUS_IPCA);
    saida.bruto.ipca = texto;
    const r = lerRespostaFocus(texto);
    if (!r.ok) throw new Error(`${r.motivo} — amostra: ${r.amostra}`);
    const anos = ipcaPorAno(r.linhas);
    if (!anos.length) throw new Error(`nenhum ano legível — amostra: ${JSON.stringify(r.linhas[0]).slice(0, 300)}`);
    saida.ipca = { data: r.data, anos };
  } catch (e) {
    saida.erros.push(`ipca: ${e.message}`);
  }
  return saida;
}

// ---------- o que a tela compara (puro) ----------

// A inflação média que o Focus espera entre duas datas, em % a.a.: a média
// GEOMÉTRICA das medianas anuais, cada ano pesado pela fração dele que cai
// dentro do período.
//
// Devolve null se algum ano do período não está na pesquisa — ela vai uns
// quatro anos à frente, e completar o resto com a última mediana seria
// inventar a expectativa de longo prazo.
//
// A aproximação que existe, e o ⓘ da tela diz: no ano corrente usa-se a
// mediana do ano INTEIRO como se fosse o ritmo dos meses que faltam. Num
// período de anos, o pedaço do ano corrente pesa pouco.
export function focusNoPeriodo(anos, deISO, ateISO) {
  if (!Array.isArray(anos) || !anos.length || !deISO || !ateISO || !(ateISO > deISO)) return null;
  const porAno = new Map(anos.map((a) => [a.ano, a.mediana]));
  const de = Date.parse(`${deISO}T00:00:00Z`);
  const ate = Date.parse(`${ateISO}T00:00:00Z`);
  let logSoma = 0;
  let pesoTotal = 0;
  for (let ano = Number(deISO.slice(0, 4)); ano <= Number(ateISO.slice(0, 4)); ano++) {
    const inicio = Math.max(de, Date.UTC(ano, 0, 1));
    const fim = Math.min(ate, Date.UTC(ano + 1, 0, 1));
    const peso = (fim - inicio) / (Date.UTC(ano + 1, 0, 1) - Date.UTC(ano, 0, 1));
    if (!(peso > 0)) continue;
    const mediana = porAno.get(ano);
    if (mediana == null) return null;
    logSoma += peso * Math.log(1 + mediana / 100);
    pesoTotal += peso;
  }
  if (!(pesoTotal > 0)) return null;
  return (Math.exp(logSoma / pesoTotal) - 1) * 100;
}
