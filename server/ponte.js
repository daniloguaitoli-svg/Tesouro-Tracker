// server/ponte.js — a construção dos arquivos-ponte (dados/ntnb.json e
// dados/ntnb.md) a partir das séries lidas do Tesouro.
//
// POR QUE ISTO É UM MÓDULO E NÃO CÓDIGO SOLTO NO COLETOR: o coletor é um script
// que executa ao ser importado (top-level await), então nada consegue testá-lo
// sem baixar dezenas de MB. Estas funções são puras — entram séries, saem o
// objeto e o texto —, então scripts/verificar.mjs consegue exercitá-las com uma
// amostra e pegar erro de montagem antes de ir para produção. Foi assim que um
// crase solta dentro do template do markdown apareceu: ele quebrava o arquivo
// inteiro e só dava as caras na hora de gravar.

import { calcularDuration, anosEntre, brDeISO, temDuration } from "./util.js";
import { porSlug, rotuloGenerico } from "./catalogo.js";

export const arred = (v, casas) => (v == null || !Number.isFinite(v) ? null : Number(v.toFixed(casas)));

// Séries cruas -> um item por vencimento, já com duration.
//
// Títulos JÁ VENCIDOS ficam de fora. Eles continuam no arquivo do Tesouro (e no
// histórico, que é onde têm valor), mas cotar um título vencido não significa
// nada: a última taxa publicada é calculada sobre um prazo que tende a zero, o
// que produz números absurdos — a coleta real trouxe uma NTN-B 2026 a 13,32% e
// uma 2019 a −0,94%. Num arquivo que outra ferramenta vai ler como verdade,
// isso é pior do que ausência.
export function montarTitulos({ ordenados, secPorSlug = {}, hoje }) {
  const vivos = ordenados.filter(([, d]) => d.vencimento > hoje);
  return vivos.map(([slug, dados]) => {
    const u = dados.ultimo;
    const doCatalogo = porSlug[slug] || null;
    const taxa = u ? (u.taxaCompra ?? u.taxaVenda) : null;
    // LFT fica sem duration DE PROPÓSITO: é pós-fixada e a taxa cotada é
    // ágio/deságio sobre a Selic — calcular duration sobre esse spread daria um
    // número com cara de análise e valor de nada. Para prefixados a taxa é
    // NOMINAL (não "sobre o IPCA"); a matemática é a mesma, o rótulo não.
    const d = temDuration(dados.tipo)
      ? calcularDuration({
          vencimentoISO: dados.vencimento,
          comCupom: dados.comCupom,
          cupomAnual: dados.cupomAnual ?? undefined,
          taxaReal: taxa == null ? null : taxa / 100,
          hojeISO: hoje,
        })
      : { macaulay: null, modificada: null, convexidade: null, variacaoPor1pp: null, variacaoMenos1pp: null };
    const item = {
      slug,
      nome: doCatalogo?.nome || rotuloGenerico(dados.tipo, dados.vencimento),
      tipo: dados.tipo,
      vencimento: dados.vencimento,
      comCupom: dados.comCupom,
      destaque: doCatalogo?.destaque === true,
      data: u?.data ?? null,
      anosAteVencer: arred(anosEntre(hoje, dados.vencimento), 3),
      // Nomes preservados como no arquivo de origem: "venda" = Tesouro vendendo
      // ao investidor; "compra" = recompra antecipada.
      taxa: arred(taxa, 4),
      taxaCompra: arred(u?.taxaCompra, 4),
      taxaVenda: arred(u?.taxaVenda, 4),
      pu: arred(u ? (u.puCompra ?? u.puVenda ?? u.puBase) : null, 2),
      puCompra: arred(u?.puCompra, 2),
      puVenda: arred(u?.puVenda, 2),
      duration: {
        macaulayAnos: arred(d.macaulay, 3),
        modificada: arred(d.modificada, 3),
        convexidade: arred(d.convexidade, 3),
        variacaoPrecoMais1pp: arred(d.variacaoPor1pp, 2),
        variacaoPrecoMenos1pp: arred(d.variacaoMenos1pp, 2),
      },
      pontosNaSerie: Object.keys(dados.serie).length,
    };
    const s = secPorSlug[slug];
    if (s) {
      item.secundario = {
        fonte: "ANBIMA — mercado secundário",
        taxaIndicativa: arred(s.taxaIndicativa, 4),
        taxaCompra: arred(s.taxaCompra, 4),
        taxaVenda: arred(s.taxaVenda, 4),
        pu: arred(s.pu, 6),
      };
    }
    return item;
  });
}

// `familias` filtra quais tipos entram neste arquivo-ponte (ex.: só os IPCA+
// em dados/ntnb.json). Cada família nova ganha um arquivo IRMÃO em vez de
// mudar o formato de um existente — quem já consome a URL antiga não quebra.
export function filtrarFamilias(titulos, familias) {
  return titulos.filter((t) => familias.includes(t.tipo));
}

export function montarPonte({ titulos, agora, urlCsv, urlAnbima = null, nota = null }) {
  return {
    atualizadoEm: agora,
    ...(nota ? { nota } : {}),
    geradoPor: "Tesouro-Tracker/.github/workflows/coletar-tesouro.yml",
    fontes: { tesouro: urlCsv, anbima: urlAnbima },
    convencao:
      "Taxas em % ao ano sobre o IPCA (taxa real). PU em reais. Duration em anos, calculada em dias corridos/365 " +
      "(a convenção oficial da ANBIMA é dias úteis/252; a diferença é desprezível para duration). " +
      "variacaoPrecoMais1pp = variação % estimada do preço se a taxa real subir 1 ponto percentual, já com convexidade.",
    aviso: "Fontes públicas, com defasagem de ao menos um dia útil. Uso informativo — não é recomendação de investimento.",
    titulos,
  };
}

export function montarHistorico({ ordenados, agora, urlCsv, desde }) {
  return {
    atualizadoEm: agora,
    fonte: "Tesouro Nacional — Tesouro Transparente (Taxas dos Títulos Ofertados pelo Tesouro Direto)",
    url: urlCsv,
    desde,
    nota: "`serie` mapeia data ISO -> [taxa real % a.a., PU em reais]. Taxa e PU são os de COMPRA (recompra do Tesouro), com queda para os de venda quando ausentes.",
    titulos: Object.fromEntries(
      ordenados.map(([slug, d]) => [
        slug,
        {
          tipo: d.tipo,
          vencimento: d.vencimento,
          comCupom: d.comCupom,
          cupomAnual: d.cupomAnual ?? null,
          serie: Object.fromEntries(Object.keys(d.serie).sort().map((k) => [k, d.serie[k]])),
        },
      ])
    ),
  };
}

export function tabelaMD(titulos) {
  const linhas = [
    "| Vencimento | Título | Taxa real | PU (R$) | Duration | Dur. mod. | +1 p.p. | −1 p.p. | Data |",
    "| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | --- |",
  ];
  const n = (v, s = "") => (v == null ? "—" : `${v}${s}`);
  for (const t of titulos) {
    linhas.push(
      `| ${brDeISO(t.vencimento)} | ${t.nome}${t.destaque ? " ⭐" : ""} | ${n(t.taxa, "%")} | ${n(t.pu)} | ` +
        `${n(t.duration.macaulayAnos, " a")} | ${n(t.duration.modificada)} | ${n(t.duration.variacaoPrecoMais1pp, "%")} | ` +
        `${n(t.duration.variacaoPrecoMenos1pp, "%")} | ${brDeISO(t.data) ?? "—"} |`
    );
  }
  return linhas.join("\n");
}

// O markdown é montado por concatenação, e não num template literal gigante, de
// propósito: o texto tem crases (nomes de arquivo em `código`) e um template
// literal as interpretaria como fim da string — foi exatamente esse o bug que
// motivou extrair este módulo.
export function markdownDaPonte({ titulos, agora, comAnbima = false }) {
  const partes = [
    "# NTN-B — Tesouro IPCA+",
    "",
    "Retrato gerado automaticamente em " + agora + ".",
    "Fonte: Tesouro Nacional (Tesouro Transparente)" + (comAnbima ? " + ANBIMA (mercado secundário)" : "") + ".",
    "",
    tabelaMD(titulos),
    "",
    "## Como ler",
    "",
    "- **Taxa real** — juros ao ano *acima* do IPCA. É a taxa de compra (recompra do",
    "  Tesouro); títulos fora de oferta deixam de publicar a taxa de venda, mas seguem",
    "  publicando esta.",
    "- **PU** — preço unitário em reais, do mesmo lado da taxa.",
    "- **Duration** — prazo médio ponderado dos fluxos, em anos (Macaulay). Para o",
    "  Tesouro IPCA+ sem cupom, é igual ao prazo; com juros semestrais é bem menor,",
    "  porque parte do dinheiro volta antes.",
    "- **Dur. mod.** — duration modificada: a variação percentual aproximada do preço",
    "  para cada 1 ponto percentual de variação da taxa.",
    "- **+1 p.p. / −1 p.p.** — quanto o preço se move hoje se a taxa real subir ou cair",
    "  1 ponto percentual, já com o termo de convexidade (por isso não são simétricos).",
    "- ⭐ marca os vencimentos acompanhados de perto.",
    "- Os números usam **ponto decimal** e as datas dos arquivos .json usam **ISO",
    "  (aaaa-mm-dd)**. É um arquivo de intercâmbio: o ponto decimal evita a ambiguidade",
    "  do formato brasileiro para quem lê por máquina. Na tabela acima as datas",
    "  aparecem em dd/mm/aaaa por legibilidade.",
    "",
    "## Ressalvas",
    "",
    "- Os dados têm defasagem de pelo menos um dia útil: o arquivo do Tesouro é de",
    "  fechamento e este retrato é gerado uma vez por dia.",
    "- Duration e sensibilidade usam dias corridos/365. A convenção oficial da ANBIMA",
    "  para NTN-B é dias úteis/252 — a diferença é desprezível para duration, mas existe.",
    "- A sensibilidade é uma aproximação de segunda ordem (duration + convexidade), não",
    "  uma reprecificação exata.",
    "- Uso informativo. Não é recomendação de investimento.",
    "",
  ];
  return partes.join("\n");
}

// ---------- O retrato da aba Painel (dados/painel.json + painel.md) ----------
//
// POR QUE UM ARQUIVO PRÓPRIO: o Painel mostra duas coisas que hoje vivem em
// lugares diferentes — os vencimentos acompanhados (que já estão no
// historico/ntnb) e a MOLDURA macro (IPCA, Ibovespa, câmbio, CDI, Selic), que
// era lida só na hora do request e portanto não existia em arquivo nenhum.
// Sem isto, quem consome as pontes por raw.githubusercontent vê os títulos mas
// não vê a moldura.
//
// LIMITE HONESTO, e é importante: a estrela que escolhe os "acompanhados de
// perto" no app fica no localStorage do aparelho e o servidor não a conhece.
// Este arquivo traz os vencimentos marcados como `destaque` no CATÁLOGO. Se a
// seleção do celular for outra, os dois divergem — e o próprio arquivo diz isso
// no campo `sobreAcompanhados`.

const SIGNIFICADO_TAXA = {
  ipca: "juros reais ao ano ACIMA do IPCA",
  "ipca-juros": "juros reais ao ano ACIMA do IPCA",
  prefixado: "juros nominais ao ano (a inflação do período corre por conta do investidor)",
  "prefixado-juros": "juros nominais ao ano (a inflação do período corre por conta do investidor)",
  selic: "ágio/deságio sobre a Selic (não é uma taxa cheia; pode ser negativo)",
};

const pctDe = (v) => (v && Number.isFinite(v.pct) ? arred(v.pct, 2) : null);

export function montarPainel({ titulos, macro, agora, urlRepo }) {
  const ind = macro?.indicadores || {};
  const acompanhados = titulos
    .filter((t) => t.destaque)
    .map((t) => ({
      slug: t.slug,
      nome: t.nome,
      vencimento: t.vencimento,
      comCupom: t.comCupom,
      taxa: t.taxa,
      taxaSignifica: SIGNIFICADO_TAXA[t.tipo] || null,
      pu: t.pu,
      data: t.data,
      duration: t.duration,
    }));

  return {
    atualizadoEm: agora,
    geradoPor: "Tesouro-Tracker/.github/workflows/coletar-tesouro.yml",
    sobre:
      "Retrato da aba Painel do Tesouro Tracker: os vencimentos acompanhados e a moldura macro (IPCA, Ibovespa, câmbio, CDI e Selic).",
    sobreAcompanhados:
      "São os vencimentos marcados como destaque no catálogo do repositório. A estrela do app é escolhida por aparelho (localStorage) e o servidor não a conhece — se a seleção do celular for outra, esta lista não a reflete.",
    convencao:
      "Taxas em % ao ano; veja `taxaSignifica` em cada título, porque o mesmo número quer dizer coisas diferentes por família. " +
      "Duration em anos (dias corridos/365, aproximação da convenção oficial de dias úteis/252). " +
      "variacaoPrecoMais1pp = variação % estimada do preço se a taxa subir 1 ponto percentual, já com convexidade. " +
      "Variações de 12 meses e 1 semana comparam com o último pregão EM OU ANTES do alvo (mercado não abre em fim de semana); " +
      "`desde` diz de que data a comparação parte. Campo ausente ou null = dado indisponível, nunca estimado.",
    aviso:
      "Fontes públicas, com defasagem de ao menos um dia útil. Uso informativo — não é recomendação de investimento.",
    fontes: {
      titulos: "Tesouro Nacional — Tesouro Transparente",
      ipca: "BCB/SGS 433",
      cdi: "BCB/SGS 4389",
      selic: "BCB/SGS 432",
      cambio: "BCB/SGS 1 (USD) e 21619 (EUR), PTAX venda",
      ibovespa: "Yahoo Finance ^BVSP",
      repositorio: urlRepo || null,
    },
    acompanhados,
    moldura: {
      ipca: ind.ipca
        ? {
            acumulado12mPct: arred(ind.ipca.acumulado12m, 2),
            ultimoMesPct: arred(ind.ipca.valor, 2),
            data: ind.ipca.data,
          }
        : null,
      ibovespa: ind.ibovespa
        ? {
            pontos: arred(ind.ibovespa.valor, 0),
            var12mPct: pctDe(ind.ibovespa.var12m),
            var12mDesde: ind.ibovespa.var12m?.de ?? null,
            var1semPct: pctDe(ind.ibovespa.var1sem),
            data: ind.ibovespa.data,
          }
        : null,
      eurbrl: ind.eurbrl
        ? {
            valor: arred(ind.eurbrl.valor, 4),
            varDiaPct: arred(ind.eurbrl.changePct, 2),
            var12mPct: pctDe(ind.eurbrl.var12m),
            var1semPct: pctDe(ind.eurbrl.var1sem),
            data: ind.eurbrl.data,
          }
        : null,
      usdbrl: ind.usdbrl
        ? {
            valor: arred(ind.usdbrl.valor, 4),
            varDiaPct: arred(ind.usdbrl.changePct, 2),
            var12mPct: pctDe(ind.usdbrl.var12m),
            var1semPct: pctDe(ind.usdbrl.var1sem),
            data: ind.usdbrl.data,
          }
        : null,
      cdi: ind.cdi ? { pctAoAno: arred(ind.cdi.valor, 2), data: ind.cdi.data } : null,
      selic: ind.selic
        ? {
            metaPctAoAno: arred(ind.selic.valor, 2),
            vigenteDesde: ind.selic.decisao?.vigenteDesde ?? null,
            ultimaVariacaoPP: arred(ind.selic.decisao?.variacaoPP, 2),
            data: ind.selic.data,
          }
        : null,
    },
  };
}

// Markdown do Painel — por concatenação, não template literal, pelo mesmo
// motivo do markdownDaPonte: o texto tem crases e elas encerrariam a string.
export function markdownDoPainel(p) {
  const n = (v, s = "") => (v == null ? "—" : `${v}${s}`);
  const m = p.moldura;
  const linhas = [
    "# Painel — Tesouro Tracker",
    "",
    "Retrato gerado automaticamente em " + p.atualizadoEm + ".",
    "",
    "## Acompanhados de perto",
    "",
    "| Vencimento | Título | Taxa | Significa | PU (R$) | Duration | +1 p.p. | Data |",
    "| --- | --- | ---: | --- | ---: | ---: | ---: | --- |",
  ];
  for (const t of p.acompanhados) {
    linhas.push(
      `| ${brDeISO(t.vencimento)} | ${t.nome} | ${n(t.taxa, "%")} | ${t.taxaSignifica || "—"} | ${n(t.pu)} | ` +
        `${n(t.duration?.macaulayAnos, " a")} | ${n(t.duration?.variacaoPrecoMais1pp, "%")} | ${brDeISO(t.data) ?? "—"} |`
    );
  }
  linhas.push(
    "",
    "## Moldura",
    "",
    "| Indicador | Valor | 12 meses | 1 semana | Data |",
    "| --- | ---: | ---: | ---: | --- |",
    `| IPCA (acum. 12m) | ${n(m.ipca?.acumulado12mPct, "%")} | — | — | ${brDeISO(m.ipca?.data) ?? "—"} |`,
    `| Ibovespa | ${n(m.ibovespa?.pontos)} pts | ${n(m.ibovespa?.var12mPct, "%")} | ${n(m.ibovespa?.var1semPct, "%")} | ${brDeISO(m.ibovespa?.data) ?? "—"} |`,
    `| EUR/BRL | ${n(m.eurbrl?.valor)} | ${n(m.eurbrl?.var12mPct, "%")} | ${n(m.eurbrl?.var1semPct, "%")} | ${brDeISO(m.eurbrl?.data) ?? "—"} |`,
    `| USD/BRL | ${n(m.usdbrl?.valor)} | ${n(m.usdbrl?.var12mPct, "%")} | ${n(m.usdbrl?.var1semPct, "%")} | ${brDeISO(m.usdbrl?.data) ?? "—"} |`,
    `| CDI | ${n(m.cdi?.pctAoAno, "% a.a.")} | — | — | ${brDeISO(m.cdi?.data) ?? "—"} |`,
    `| Selic (meta) | ${n(m.selic?.metaPctAoAno, "% a.a.")} | — | — | ${brDeISO(m.selic?.data) ?? "—"} |`,
    "",
    "## Ressalvas",
    "",
    "- " + p.sobreAcompanhados,
    "- " + p.convencao,
    "- " + p.aviso,
    "",
  );
  return linhas.join("\n");
}
