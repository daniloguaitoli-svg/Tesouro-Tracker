// server/providers/b3.js — DI futuro e cupom cambial, do arquivo público da B3.
//
// DUAS CURVAS, DUAS CONVENÇÕES, E ELAS NÃO SE MISTURAM:
//
//   DI1  curva pré-fixada em BRL.  Dias úteis/252, EXPONENCIAL.
//        PU = 100.000 / (1 + i)^(du/252)
//
//   FRC  curva de cupom cambial em USD.  Dias corridos/360, LINEAR.
//        PU do DDI = 100.000 / (1 + c · n/360)
//
// Medido no arquivo da B3 em 23/10/2026: o DI1F27 a 13,468% com 47 dias úteis
// dá 97.671,4 contra 97.671,01 publicado, e o DDIF27 a 9,216% com 73 dias
// corridos dá 98.165,46 contra 98.165,48. As duas fecham no centavo, cada uma
// na sua convenção. Trocá-las produz número plausível e errado — é o mesmo
// risco que fez o repositório inteiro migrar para dias úteis em 10/2026.
//
// POR QUE O FRC E NÃO O DDI, para a curva em USD
//
// O DDI dá o "cupom sujo": o PU é denominado contra a PTAX do dia útil
// ANTERIOR, então a taxa carrega a variação cambial que já aconteceu desde
// aquela PTAX. No vértice curto isso é devastador — medido em 23/10/2026, o
// DDIX26 (11 dias) marcava 29,032% enquanto o FRC do mesmo período marcava
// 5,38%. Vinte e três pontos percentuais de sujeira.
//
// O FRC é a taxa a termo entre o próximo DDI em aberto e cada vencimento, o
// que o mercado local chama de "cupom limpo". Ele NÃO é um ativo: é a forma de
// negociar o DDI — compra-se o curto e vende-se o longo —, e por isso não tem
// preço de ajuste, só taxa. Conferido na identidade do bootstrap, com erro de
// 0,0001% em seis vencimentos:
//
//   (1 + c_longo·n_longo/360) = (1 + c_curto·n_curto/360) · (1 + f·Δn/360)
//
// CONSEQUÊNCIA QUE A TELA TEM DE DIZER: como o FRC é a taxa a partir do
// vértice curto, a curva em USD começa no PRÓXIMO VENCIMENTO EM ABERTO, não
// em D0. Ancorar em hoje exigiria limpar o stub, o que exige a taxa spot, que
// sai de `spot = DOL − casado` — e o casado não está em fonte pública
// gratuita: não aparece no arquivo da B3 (é operação estruturada CSD2, sem
// posição em aberto) e a página de Taxas de Referência está atrás de desafio
// Cloudflare. Melhor uma curva que começa onde começa do que um primeiro
// ponto inventado.
//
// O VÉRTICE CURTO FICA FORA DO GRÁFICO pelo mesmo motivo: 29% ao lado de 5,4%
// não é ponto de curva, é artefato da PTAX de ontem.
//
// POR QUE ISTO É DO COLETOR, NÃO DO REQUEST
//
// São 5 MB de negócios e 19 MB de cadastro. Uma função da Vercel não pode
// baixar isso a cada requisição — é a mesma divisão de trabalho que já vale
// para o CSV do Tesouro: o job agendado lê o arquivo grande e destila, e a
// tela lê o destilado.

import { diasUteis, ehDiaUtil } from "../feriados.js";

const MS_DIA = 86400000;
const BASE = "https://arquivos.b3.com.br/api/download";

// Convenções, nomeadas para o resto do código não as escrever à mão.
export const DIAS_UTEIS_ANO = 252;
export const DIAS_CORRIDOS_ANO = 360;
export const NOCIONAL = 100000;

// Letra do mês no código do contrato. O vencimento vem do cadastro, então
// isto serve só para CONFERIR o casamento entre os dois arquivos: letra que
// não bate com o mês do XprtnDt é junção errada, e junção errada desloca a
// curva inteira sem erro nenhum na tela.
const MES_DA_LETRA = { F: 1, G: 2, H: 3, J: 4, K: 5, M: 6, N: 7, Q: 8, U: 9, V: 10, X: 11, Z: 12 };

const ARQ_NEGOCIOS = "TradeInformationConsolidatedFile";
const ARQ_CADASTRO = "InstrumentsConsolidatedFile";

// ---------- leitura dos arquivos ----------

// Número em pt-BR: "97.671,01" -> 97671.01. Devolve null em vazio e em lixo,
// nunca 0 — zero é preço, ausência não é.
export function numeroB3(txt) {
  const s = String(txt ?? "").trim();
  if (!s) return null;
  const n = Number(s.replace(/\./g, "").replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

// O arquivo abre com uma linha solta "Status do Arquivo: Final" ANTES do
// cabeçalho. Quem tomar a linha 0 como cabeçalho lê tudo deslocado, e o
// deslocamento não levanta erro — só números errados. Por isso o cabeçalho é
// PROCURADO pela coluna RptDt, do mesmo jeito que o parser do Tesouro acha as
// colunas dele por nome e não por posição.
export function lerCsvB3(texto) {
  const linhas = String(texto).split(/\r?\n/);
  const iCab = linhas.findIndex((l) => /(^|;)RptDt(;|$)/.test(l));
  if (iCab < 0) {
    throw new Error(`cabeçalho não encontrado (sem coluna RptDt). Começo do arquivo: ${linhas.slice(0, 2).join(" | ").slice(0, 200)}`);
  }
  const colunas = linhas[iCab].split(";").map((c) => c.trim());
  const indice = (nome) => {
    const i = colunas.indexOf(nome);
    if (i < 0) throw new Error(`coluna "${nome}" sumiu do arquivo da B3. Cabeçalho recebido: ${colunas.join(";")}`);
    return i;
  };
  return { colunas, indice, linhas: linhas.slice(iCab + 1).filter(Boolean) };
}

// ativo + letra do mês + dois dígitos de ano. "DI1F27" -> { ativo, letra, ano }.
export function partesDoTicker(ticker) {
  const m = String(ticker || "").match(/^([A-Z0-9]{3})([FGHJKMNQUVXZ])(\d{2})$/);
  if (!m) return null;
  return { ativo: m[1], letra: m[2], ano: 2000 + Number(m[3]) };
}

// ---------- extração, pura e conferível ----------

// Junta negócios (taxa e ajuste) com cadastro (vencimento) num contrato só.
// É PURA de propósito: recebe texto, devolve dados, e por isso o verificar
// consegue exercitá-la com amostra fixa sem tocar na rede — mesma razão pela
// qual os parsers do Tesouro e do FRED são exportados.
export function extrairContratos(textoNegocios, textoCadastro, ativos = ["DI1", "DDI", "FRC", "DOL", "DAP"]) {
  const alvo = new Set(ativos);
  const porTicker = new Map();

  const neg = lerCsvB3(textoNegocios);
  const nTicker = neg.indice("TckrSymb");
  const nTaxa = neg.indice("AdjstdQtTax");
  const nAjuste = neg.indice("AdjstdQt");
  const nQtd = neg.indice("TradQty");
  const nData = neg.indice("RptDt");

  let dataRef = null;
  for (const linha of neg.linhas) {
    const c = linha.split(";");
    const p = partesDoTicker(c[nTicker]);
    if (!p || !alvo.has(p.ativo)) continue;
    dataRef = dataRef || c[nData] || null;
    porTicker.set(c[nTicker], {
      ticker: c[nTicker],
      ativo: p.ativo,
      letra: p.letra,
      taxa: numeroB3(c[nTaxa]),
      ajuste: numeroB3(c[nAjuste]),
      negocios: numeroB3(c[nQtd]) ?? 0,
      vencimento: null,
    });
  }

  const cad = lerCsvB3(textoCadastro);
  const cTicker = cad.indice("TckrSymb");
  const cVenc = cad.indice("XprtnDt");
  for (const linha of cad.linhas) {
    const c = linha.split(";");
    const item = porTicker.get(c[cTicker]);
    if (item && c[cVenc]) item.vencimento = c[cVenc];
  }

  // Contrato sem vencimento não entra: sem prazo não há ponto de curva, e
  // adivinhar a data pela letra seria inventar o eixo x.
  const contratos = [...porTicker.values()].filter((c) => c.vencimento);

  // A conferência do casamento entre os dois arquivos. Barata, e o defeito que
  // ela pega — junção trocada — é invisível no gráfico.
  const incoerentes = contratos.filter((c) => {
    const mes = Number(c.vencimento.slice(5, 7));
    return MES_DA_LETRA[c.letra] !== mes;
  });

  return { dataRef, contratos, incoerentes };
}

// ---------- as curvas ----------

// Curva pré em BRL. O prazo é em DIAS ÚTEIS porque é assim que o DI1 é
// precificado, e o PU recalculado vai junto: comparar com o ajuste publicado
// é o que prova que a convenção está certa, e é o que o verificar confere.
export function curvaDI(contratos, dataRefISO) {
  return contratos
    .filter((c) => c.ativo === "DI1" && c.taxa != null && c.vencimento > dataRefISO)
    .map((c) => {
      const du = diasUteis(dataRefISO, c.vencimento);
      const puRecalculado = du > 0 ? NOCIONAL / Math.pow(1 + c.taxa / 100, du / DIAS_UTEIS_ANO) : null;
      return {
        ticker: c.ticker,
        vencimento: c.vencimento,
        diasUteis: du,
        anos: du / DIAS_UTEIS_ANO,
        taxa: c.taxa,
        pu: c.ajuste,
        puRecalculado,
        negociado: c.negocios > 0,
      };
    })
    .sort((a, b) => a.vencimento.localeCompare(b.vencimento));
}

// Curva de juro REAL em BRL, a partir da DAP (cupom de IPCA).
//
// MESMA CONVENÇÃO DO DI1, não a do FRC — e isso foi medido, não presumido:
// dias úteis/252, exponencial, face 100.000. Em 30/10/2026, a face implícita
// fechou em 100.000,00 nos 21 vencimentos (dispersão 0,0001%), contra 1,65%
// na exponencial corrida/365 e mais de 200% nas lineares. O teste está em
// scripts/sonda-b3-dap.mjs e o resultado no CLAUDE.md.
//
// A DAP é a contraparte de mercado da NTN-B: negocia nos meses K e Q (maio e
// agosto), que são os meses em que a NTN-B vence, e o vencimento mais longo é
// 2060-08-16 — o primeiro dia útil depois do 15/08/2060 da NTN-B 2060, que
// cai num domingo.
//
// NENHUM PONTO É DESCARTADO AQUI. A ponta curta é distorcida (ver o piso em
// datalayer.js), mas o descarte é de APRESENTAÇÃO e acontece lá: o histórico
// guarda tudo, porque jogar dado fora na coleta é irreversível e a fronteira
// da distorção ainda não está medida.
export function curvaDAP(contratos, dataRefISO) {
  return contratos
    .filter((c) => c.ativo === "DAP" && c.taxa != null && c.vencimento > dataRefISO)
    .map((c) => {
      const du = diasUteis(dataRefISO, c.vencimento);
      const puRecalculado = du > 0 ? NOCIONAL / Math.pow(1 + c.taxa / 100, du / DIAS_UTEIS_ANO) : null;
      return {
        ticker: c.ticker,
        vencimento: c.vencimento,
        diasUteis: du,
        anos: du / DIAS_UTEIS_ANO,
        taxa: c.taxa,
        pu: c.ajuste,
        puRecalculado,
        negociado: c.negocios > 0,
      };
    })
    .sort((a, b) => a.vencimento.localeCompare(b.vencimento));
}

// A FACE IMPLÍCITA, e por que ela é o portão de gravação da DAP.
//
// O FRC tem a identidade do bootstrap para provar que foi entendido; a DAP
// precisa do equivalente, e é este. Para cada vencimento calcula-se a face que
// a convenção devolve (ajuste × fator de desconto) e mede-se a DISPERSÃO entre
// os vencimentos. A face é constante do contrato: se a convenção estiver
// certa, todos devolvem o mesmo número; se a B3 mudar a convenção, ela abre.
//
// Vale mais que comparar com 100.000 fixo, porque não depende de a face ser a
// que achamos que é — detecta tanto convenção trocada quanto face mudada.
export function erroDaFace(pontos) {
  const faces = pontos
    .filter((p) => p.pu != null && p.taxa != null && p.diasUteis > 0)
    .map((p) => p.pu * Math.pow(1 + p.taxa / 100, p.diasUteis / DIAS_UTEIS_ANO));
  if (faces.length < 2) return { dispersao: null, comparados: faces.length, face: faces[0] ?? null };
  const min = Math.min(...faces);
  const max = Math.max(...faces);
  return { dispersao: max / min - 1, comparados: faces.length, face: (min + max) / 2 };
}

// Curva de cupom limpo em USD, a partir do FRC.
//
// O vértice curto é o PRIMEIRO DDI EM ABERTO — derivado da ordenação por data,
// nunca escrito à mão, porque ele muda de mês em mês. Ele sai da lista de
// pontos (é cupom sujo) mas volta no resultado como `vertice`, porque é o que
// a tela precisa dizer para explicar onde a curva começa.
export function curvaCupom(contratos, dataRefISO) {
  const ddi = contratos
    .filter((c) => c.ativo === "DDI" && c.taxa != null && c.vencimento > dataRefISO)
    .sort((a, b) => a.vencimento.localeCompare(b.vencimento));

  const curto = ddi[0] || null;

  const dias = (a, b) => Math.round((Date.parse(b) - Date.parse(a)) / MS_DIA);

  const pontos = contratos
    .filter((c) => c.ativo === "FRC" && c.taxa != null && c.vencimento > dataRefISO)
    .map((c) => ({
      ticker: c.ticker,
      vencimento: c.vencimento,
      dias: dias(dataRefISO, c.vencimento),
      // Prazo A PARTIR DO VÉRTICE CURTO, que é o intervalo a que a taxa do FRC
      // se refere. Usar o prazo desde hoje colocaria a taxa no x errado.
      diasDoVertice: curto ? dias(curto.vencimento, c.vencimento) : null,
      taxa: c.taxa,
      negociado: c.negocios > 0,
    }))
    .filter((p) => p.diasDoVertice == null || p.diasDoVertice > 0)
    .sort((a, b) => a.vencimento.localeCompare(b.vencimento));

  return {
    pontos,
    vertice: curto
      ? {
          ticker: curto.ticker,
          vencimento: curto.vencimento,
          dias: dias(dataRefISO, curto.vencimento),
          // A taxa suja vai junto, marcada como tal. Ela NÃO é ponto de curva;
          // existe para a tela poder mostrar o quanto a PTAX de ontem
          // contamina o curto, que é a razão de a curva não começar em D0.
          taxaSuja: curto.taxa,
        }
      : null,
  };
}

// Confere a identidade que define o FRC. Devolve o pior erro relativo entre o
// DDI observado e o DDI implícito por (vértice curto + FRC). Exportada porque
// é ela que o verificar transforma em invariante — e porque ela é a prova de
// que a curva limpa está montada certa.
export function erroDoBootstrap(contratos, dataRefISO) {
  const dias = (a, b) => Math.round((Date.parse(b) - Date.parse(a)) / MS_DIA);
  const porVenc = new Map();
  for (const c of contratos) {
    if (!c.vencimento || c.taxa == null) continue;
    if (!porVenc.has(c.vencimento)) porVenc.set(c.vencimento, {});
    porVenc.get(c.vencimento)[c.ativo] = c.taxa;
  }

  const vencs = [...porVenc.keys()].filter((v) => v > dataRefISO).sort();
  const curtoVenc = vencs.find((v) => porVenc.get(v).DDI != null);
  if (!curtoVenc) return { pior: null, comparados: 0 };

  const cCurto = porVenc.get(curtoVenc).DDI;
  const nCurto = dias(dataRefISO, curtoVenc);
  let pior = 0;
  let comparados = 0;

  for (const v of vencs) {
    if (v <= curtoVenc) continue;
    const { DDI, FRC } = porVenc.get(v);
    if (DDI == null || FRC == null) continue;
    const n = dias(dataRefISO, v);
    const implicito =
      (1 + (cCurto / 100) * (nCurto / DIAS_CORRIDOS_ANO)) *
      (1 + (FRC / 100) * ((n - nCurto) / DIAS_CORRIDOS_ANO));
    const observado = 1 + (DDI / 100) * (n / DIAS_CORRIDOS_ANO);
    pior = Math.max(pior, Math.abs(implicito / observado - 1));
    comparados++;
  }
  return { pior, comparados };
}

// ---------- rede ----------

// Download em dois passos: o nome do arquivo devolve um token, e só o token
// baixa o conteúdo. Um primeiro passo que responde 200 não prova nada.
async function baixar(nomeArquivo, dataISO, limiteMs) {
  const r1 = await fetch(`${BASE}/requestname?fileName=${encodeURIComponent(nomeArquivo)}&date=${dataISO}&recaptchaToken=`, {
    headers: { Accept: "application/json", "User-Agent": "tesouro-tracker" },
    signal: AbortSignal.timeout(limiteMs),
  });
  if (!r1.ok) throw new Error(`${nomeArquivo}: HTTP ${r1.status} ao pedir o token`);
  const { token } = await r1.json();
  if (!token) throw new Error(`${nomeArquivo}: resposta sem token`);

  const r2 = await fetch(`${BASE}/?token=${encodeURIComponent(token)}`, {
    headers: { "User-Agent": "tesouro-tracker" },
    signal: AbortSignal.timeout(limiteMs),
  });
  if (!r2.ok) throw new Error(`${nomeArquivo}: HTTP ${r2.status} ao baixar`);
  return new TextDecoder("utf-8", { fatal: false }).decode(new Uint8Array(await r2.arrayBuffer()));
}

// Último dia útil anterior a hoje. O arquivo do dia só fica pronto depois do
// fechamento, então pedir hoje devolve vazio na maior parte do horário.
export function ultimoDiaUtilISO(hoje = new Date()) {
  let d = new Date(hoje.getTime() - MS_DIA);
  while (!ehDiaUtil(d)) d = new Date(d.getTime() - MS_DIA);
  return d.toISOString().slice(0, 10);
}

// A leitura completa, para o coletor. Tenta a data pedida e, não achando,
// recua um dia útil: feriado que o calendário nacional não cobre (greve,
// fechamento local) deixaria o job vermelho por nada.
export async function lerFuturos({ dataISO = ultimoDiaUtilISO(), tentativas = 2, limiteMs = 60000 } = {}) {
  let data = dataISO;
  let ultimoErro = null;

  for (let i = 0; i < tentativas; i++) {
    try {
      const [negocios, cadastro] = await Promise.all([
        baixar(ARQ_NEGOCIOS, data, limiteMs),
        baixar(ARQ_CADASTRO, data, limiteMs),
      ]);
      const { dataRef, contratos, incoerentes } = extrairContratos(negocios, cadastro);
      if (!contratos.length) throw new Error(`arquivo de ${data} chegou sem nenhum contrato DI1/DDI/FRC/DOL/DAP`);

      const ref = dataRef || data;
      return {
        data: ref,
        di: curvaDI(contratos, ref),
        cupom: curvaCupom(contratos, ref),
        dap: curvaDAP(contratos, ref),
        bootstrap: erroDoBootstrap(contratos, ref),
        face: erroDaFace(curvaDAP(contratos, ref)),
        incoerentes: incoerentes.map((c) => c.ticker),
        fonte: "B3 (UP2DATA, arquivo público)",
      };
    } catch (e) {
      ultimoErro = e;
      data = ultimoDiaUtilISO(new Date(Date.parse(data)));
    }
  }
  throw ultimoErro;
}
