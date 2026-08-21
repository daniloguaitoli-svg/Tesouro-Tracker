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

import { calcularDuration, anosEntre, brDeISO } from "./util.js";
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
    const d = calcularDuration({
      vencimentoISO: dados.vencimento,
      comCupom: dados.comCupom,
      taxaReal: taxa == null ? null : taxa / 100,
      hojeISO: hoje,
    });
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

export function montarPonte({ titulos, agora, urlCsv, urlAnbima = null }) {
  return {
    atualizadoEm: agora,
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
