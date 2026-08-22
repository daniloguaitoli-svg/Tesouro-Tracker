// server/providers/anbima.js — taxas do MERCADO SECUNDÁRIO de títulos públicos,
// pela via pública e sem chave.
//
// POR QUE NÃO A API: a API do ANBIMA Feed (mercado-secundario-TPF, OAuth2
// client_credentials) é um produto CONTRATADO — gratuito só para associados da
// ANBIMA. Não há client_id/client_secret self-service para pessoa física. Como
// este repositório é sem segredos por princípio (igual aos irmãos), a fonte aqui
// é o arquivo diário público de taxas médias do mercado secundário, que traz o
// mesmo conteúdo essencial: taxa indicativa, de compra e de venda por título.
// Se um dia houver credencial, o lugar de plugar é aqui — a interface para o
// datalayer não muda.
//
// O QUE ISTO ACRESCENTA sobre o Tesouro Direto: a TAXA INDICATIVA do mercado
// secundário, que é a referência de mercado (o Tesouro Direto publica preços de
// balcão do varejo, com spread próprio), e vencimentos que não estão à venda no
// Tesouro Direto.
//
// ESTADO ATUAL (conferido em 21/08/2026, na coleta real): o caminho histórico
// /informacoes/merc-sec/arqs/ms{ddmmyy}.txt responde **404**. As ferramentas de
// títulos públicos da ANBIMA migraram para a plataforma ANBIMA Data
// (data.anbima.com.br), e o arquivo diário antigo saiu do ar nesse formato.
//
// NÃO SE CHUTOU UMA URL NOVA no lugar. Inventar um caminho que "parece certo" é
// como se erra em dado financeiro. Em vez disso: a URL é configurável por
// ANBIMA_MS_URL (com o marcador {ddmmyy}), então, no dia em que o endereço
// correto for conhecido, basta setar a variável no workflow — sem tocar em
// código. Enquanto isso o provider falha limpo e o app segue inteiro: esta
// fonte é ENRIQUECIMENTO, nunca requisito.
//
// PARSING DEFENSIVO — LEIA ANTES DE MEXER: o parser não assume posição de
// coluna nem separador: detecta o separador, acha as colunas por regex no
// cabeçalho e, se não reconhecer nada, devolve `{ ok: false, amostra }` com o
// começo do arquivo em vez de inventar número. O coletor registra essa amostra
// no log — uma execução basta para confirmar o formato de qualquer URL nova.

import { parseNumBR, isoDeBR, classificarTitulo, normalizar, slugDe } from "../util.js";

const TTL_MS = 30 * 60 * 1000;
let cache = null; // { ts, resultado }

const CABECALHOS = {
  titulo: /titulo/,
  vencimento: /vencimento/,
  taxaIndicativa: /indicativ/,
  taxaCompra: /compra/,
  taxaVenda: /venda/,
  pu: /^pu\b|preco unitario|\bpu\b/,
};

function ddmmyy(d) {
  const p = (n) => String(n).padStart(2, "0");
  return `${p(d.getUTCDate())}${p(d.getUTCMonth() + 1)}${String(d.getUTCFullYear()).slice(-2)}`;
}

// Molde da URL. ANBIMA_MS_URL permite apontar para o endereço novo sem mexer no
// código; {ddmmyy} é substituído pela data do arquivo.
const MOLDE_URL =
  process.env.ANBIMA_MS_URL || "https://www.anbima.com.br/informacoes/merc-sec/arqs/ms{ddmmyy}.txt";

export function urlDoDia(d) {
  return MOLDE_URL.replace("{ddmmyy}", ddmmyy(d));
}

// Aceita "15/05/2035" e "20350515" — as duas grafias aparecem em arquivos
// públicos brasileiros.
function isoFlexivel(txt) {
  const s = String(txt ?? "").trim();
  const compacto = s.match(/^(\d{4})(\d{2})(\d{2})$/);
  if (compacto) return `${compacto[1]}-${compacto[2]}-${compacto[3]}`;
  return isoDeBR(s);
}

function detectarSeparador(linha) {
  let melhor = "@";
  let max = -1;
  for (const c of ["@", ";", "\t", "|"]) {
    const n = linha.split(c).length;
    if (n > max) {
      max = n;
      melhor = c;
    }
  }
  return melhor;
}

// Extrai os títulos reconhecidos (todas as famílias) de um arquivo já baixado. Exportada para poder ser testada
// sem rede.
export function extrairTitulos(texto) {
  const linhas = String(texto ?? "").split(/\r?\n/);
  const iCab = linhas.findIndex((l) => /vencimento/.test(normalizar(l)));
  if (iCab < 0) {
    return { ok: false, motivo: "cabeçalho não reconhecido", amostra: String(texto ?? "").slice(0, 400), titulos: [] };
  }

  const sep = detectarSeparador(linhas[iCab]);
  const cabecalhos = linhas[iCab].split(sep).map((h) => normalizar(h));
  const idx = {};
  for (const [campo, re] of Object.entries(CABECALHOS)) {
    const i = cabecalhos.findIndex((h) => re.test(h));
    if (i >= 0) idx[campo] = i;
  }
  if (idx.vencimento == null || idx.titulo == null) {
    return { ok: false, motivo: "colunas titulo/vencimento não localizadas", amostra: linhas[iCab].slice(0, 400), titulos: [] };
  }

  const titulos = [];
  for (const linha of linhas.slice(iCab + 1)) {
    if (!linha.trim()) continue;
    const cels = linha.split(sep);
    const classe = classificarTitulo(cels[idx.titulo]);
    if (!classe) continue;
    const vencimento = isoFlexivel(cels[idx.vencimento]);
    if (!vencimento) continue;
    const n = (campo) => (idx[campo] == null ? null : parseNumBR(cels[idx[campo]]));
    titulos.push({
      slug: slugDe(classe.tipo, vencimento),
      tipo: classe.tipo,
      vencimento,
      taxaIndicativa: n("taxaIndicativa"),
      taxaCompra: n("taxaCompra"),
      taxaVenda: n("taxaVenda"),
      pu: n("pu"),
    });
  }
  return { ok: titulos.length > 0, motivo: titulos.length ? null : "nenhuma NTN-B na tabela", separador: sep, colunas: idx, titulos };
}

// Busca o arquivo mais recente, andando para trás até `tentativas` dias.
// Nunca lança: uma fonte de enriquecimento indisponível não pode derrubar o app.
export async function getSecundario({ tentativas = 3 } = {}) {
  if (cache && Date.now() - cache.ts < TTL_MS) return cache.resultado;

  const erros = [];
  for (let i = 0; i < tentativas; i++) {
    const d = new Date(Date.now() - i * 864e5);
    const dow = d.getUTCDay();
    if (dow === 0 || dow === 6) continue; // não há divulgação em fim de semana
    const url = urlDoDia(d);
    try {
      const r = await fetch(url, { headers: { "User-Agent": "tesouro-tracker (github actions)" } });
      if (!r.ok) {
        erros.push(`${url} -> HTTP ${r.status}`);
        continue;
      }
      const texto = await r.text();
      const extraido = extrairTitulos(texto);
      if (!extraido.ok) {
        erros.push(`${url} -> ${extraido.motivo}`);
        // Guarda a amostra do primeiro arquivo que baixou mas não deu para ler:
        // é ela que o log do coletor mostra para confirmar o formato.
        const resultado = { ok: false, fonte: "ANBIMA — mercado secundário", url, erros, amostra: extraido.amostra, titulos: [] };
        cache = { ts: Date.now(), resultado };
        return resultado;
      }
      const resultado = {
        ok: true,
        fonte: "ANBIMA — mercado secundário (taxas médias)",
        url,
        data: d.toISOString().slice(0, 10),
        separador: extraido.separador,
        titulos: extraido.titulos,
      };
      cache = { ts: Date.now(), resultado };
      return resultado;
    } catch (e) {
      erros.push(`${url} -> ${e.name}: ${e.message}`);
    }
  }
  const resultado = { ok: false, fonte: "ANBIMA — mercado secundário", erros, titulos: [] };
  cache = { ts: Date.now(), resultado };
  return resultado;
}
