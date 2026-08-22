// server/cache.js — leitura dos arquivos versionados em dados/.
//
// É DAQUI que o app lê em produção. O CSV do Tesouro tem dezenas de MB e não
// pode ser varrido a cada request; quem faz isso é o job agendado, que destila
// tudo em dois arquivos commitados no próprio repositório:
//
//   dados/historico.json  série diária por vencimento (o app)
//   dados/ntnb.json       retrato do dia dos vencimentos em destaque (a ponte)
//
// Como eles vivem no repositório, o histórico SOBREVIVE a cold start — ao
// contrário do /tmp efêmero da Vercel. E, como o repositório é público, a ponte
// fica legível por raw.githubusercontent.com sem token nenhum.
//
// O `createRequire` é DE PROPÓSITO, não modernice para readFile: um require
// estático faz o rastreador de arquivos da Vercel enxergar o JSON e empacotá-lo
// junto da função. Com readFile + caminho montado em tempo de execução, o
// arquivo não é incluído no bundle e a função quebra em produção.

import { createRequire } from "node:module";

const require = createRequire(import.meta.url);

function carregar(caminho, vazio) {
  try {
    return require(caminho);
  } catch {
    // Antes da primeira coleta os arquivos podem não existir. O app tem de
    // subir mesmo assim, mostrando "sem dados ainda" em vez de estourar.
    return vazio;
  }
}

const HISTORICO = carregar("../dados/historico.json", { atualizadoEm: null, desde: null, titulos: {} });
const PONTE = carregar("../dados/ntnb.json", { atualizadoEm: null, titulos: [] });
const GLOBAL = carregar("../dados/global.json", { atualizadoEm: null, fed: null, bce: null });

export function historico() {
  return HISTORICO;
}

export function ponte() {
  return PONTE;
}

// Fed e BCE, coletados duas vezes ao dia pelo job (dados/global.json).
export function globais() {
  return GLOBAL;
}

// Todos os vencimentos conhecidos, com metadados e o último ponto da série.
export function titulos() {
  const t = HISTORICO.titulos || {};
  return Object.entries(t).map(([slug, dados]) => {
    const datas = Object.keys(dados.serie || {}).sort();
    const ultima = datas[datas.length - 1] || null;
    const par = ultima ? dados.serie[ultima] : null;
    return {
      slug,
      tipo: dados.tipo,
      vencimento: dados.vencimento,
      comCupom: dados.comCupom === true,
      cupomAnual: dados.cupomAnual ?? null,
      data: ultima,
      // A série guarda [taxa, pu] por dia — taxa em % a.a., PU em reais.
      taxa: par ? par[0] : null,
      pu: par ? par[1] : null,
      pontos: datas.length,
    };
  });
}

// Série [{ date, taxa, pu }] de um vencimento, em ordem cronológica.
export function serieDe(slug) {
  const dados = (HISTORICO.titulos || {})[slug];
  if (!dados?.serie) return [];
  return Object.entries(dados.serie)
    .map(([date, par]) => ({ date, taxa: par[0], pu: par[1] }))
    .sort((a, b) => (a.date < b.date ? -1 : 1));
}

export function metaDe(slug) {
  return (HISTORICO.titulos || {})[slug] || null;
}
