// scripts/verificar.mjs — a verificação que o `npm run build` não faz.
//
// O `vite build` empacota só o src/, então a metade server/ (datalayer,
// catálogo, util, providers) nem chega a ser lida por ele: um import quebrado,
// uma coluna essencial sumida do parser ou uma constante fora de sincronia
// passam verde e só quebram em produção, na hora do request.
//
// Aqui os módulos são carregados de verdade e os invariantes que o CLAUDE.md
// declara são conferidos — inclusive:
//   - a MATEMÁTICA do título (as identidades que a duration tem de satisfazer);
//   - o PARSER do CSV contra o cabeçalho documentado do Tesouro;
//   - a regra dos TRÊS LUGARES (datalayer + api/ + devApi do vite.config.js);
//   - as constantes duplicadas de propósito entre server/ e src/.
//
// Sem dependências de propósito: o repositório não tem test runner e a regra é
// manter só react + react-dom.

import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), "..");
const ler = (rel) => readFile(join(RAIZ, rel), "utf-8");

let falhas = 0;
const ok = (msg) => console.log(`  ok    ${msg}`);
const falhar = (msg) => {
  console.error(`  FALHA ${msg}`);
  falhas++;
};
const conferir = (cond, msg) => (cond ? ok(msg) : falhar(msg));
// Aviso não derruba o CI: serve para o que envelhece sozinho com o tempo
// (um vencimento que passou), onde falhar seria punir ninguém por nada.
const avisar = (msg) => console.log(`  aviso ${msg}`);
const perto = (a, b, tol = 1e-9) => Math.abs(a - b) <= tol;

// ---------------------------------------------------------------
console.log("\nmódulos do servidor carregam");
const datalayer = await import("../server/datalayer.js");
const util = await import("../server/util.js");
const cat = await import("../server/catalogo.js");
const tesouro = await import("../server/providers/tesouro.js");
const anbima = await import("../server/providers/anbima.js");

const ROTAS = ["getTitulos", "getDetalhe", "getCurva", "getMacro", "getMercado", "getNoticias"];
for (const nome of ROTAS) conferir(typeof datalayer[nome] === "function", `datalayer exporta ${nome}()`);
for (const rel of ["tesouro", "anbima", "bcb", "globais", "noticias"]) {
  await import(`../server/providers/${rel}.js`);
  ok(`provider ${rel} carrega`);
}
await import("../server/cache.js");
ok("cache carrega (lê dados/ sem estourar quando vazio)");

// ---------------------------------------------------------------
console.log("\nintegridade do catálogo");
const { CATALOGO, CATEGORIAS, porSlug, DESTAQUES, MACRO } = cat;
conferir(CATALOGO.length > 0, `${CATALOGO.length} vencimentos catalogados`);
conferir(Object.keys(porSlug).length === CATALOGO.length, "porSlug cobre todo o catálogo (slugs únicos)");
conferir(DESTAQUES.length > 0, `${DESTAQUES.length} vencimentos em destaque`);

const TIPOS = CATEGORIAS.map((c) => c.id);
for (const c of CATALOGO) {
  for (const campo of ["slug", "nome", "tipo", "vencimento", "fonte", "periodicidade"]) {
    if (!c[campo]) falhar(`${c.slug || "(sem slug)"}: falta ${campo}`);
  }
  if (!TIPOS.includes(c.tipo)) falhar(`${c.slug}: tipo desconhecido ${c.tipo}`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(c.vencimento)) falhar(`${c.slug}: vencimento fora do ISO (${c.vencimento})`);
  if (c.slug !== util.slugDe(c.tipo, c.vencimento)) falhar(`${c.slug}: slug não bate com slugDe()`);
  if (c.comCupom !== (c.tipo === "ipca-juros")) falhar(`${c.slug}: comCupom incoerente com o tipo`);
  // Dias de vencimento por família (sourced dos arquivos reais): NTN-B em
  // 15/05 ou 15/08; LTN/NTN-F em 01/01; LFT em 01/03. Fora disso é quase
  // certamente erro de digitação no catálogo.
  if (c.tipo.startsWith("ipca") && !/-(05|08)-15$/.test(c.vencimento)) {
    falhar(`${c.slug}: NTN-B vence em 15/05 ou 15/08 — confira ${c.vencimento}`);
  }
  if (c.tipo.startsWith("prefixado") && !/-01-01$/.test(c.vencimento)) {
    falhar(`${c.slug}: LTN/NTN-F vencem em 01/01 — confira ${c.vencimento}`);
  }
  if (c.tipo === "selic" && !/-03-01$/.test(c.vencimento)) {
    falhar(`${c.slug}: LFT vence em 01/03 — confira ${c.vencimento}`);
  }
}
ok("campos obrigatórios, tipos, ISO dos vencimentos e coerência dos slugs");
conferir(DESTAQUES.every((d) => porSlug[d.slug]), "todo destaque existe no catálogo");

// Um catálogo com título vencido engana quem o lê. Em destaque é erro (o Painel
// avisaria sobre um título morto); fora do destaque é só sinal de faxina.
const hojeReal = util.hojeISO();
for (const d of DESTAQUES) {
  if (d.vencimento <= hojeReal) falhar(`destaque ${d.slug} já venceu — troque por um vivo`);
}
const vencidos = CATALOGO.filter((c) => c.vencimento <= hojeReal);
if (vencidos.length) avisar(`${vencidos.length} entrada(s) do catálogo já venceram: ${vencidos.map((c) => c.slug).join(", ")}`);
else ok("nenhum vencimento do catálogo já venceu");
conferir(MACRO.every((m) => m.id && m.serie && m.nome), "séries macro têm id, código SGS e nome");

// ---------------------------------------------------------------
// A parte que mais importa: se a duration estiver errada, o app mente sobre
// risco. Estas são identidades matemáticas — valem sempre, não dependem de dado.
console.log("\nmatemática do título");
const HOJE = "2026-01-15";

conferir(
  perto(util.CUPOM_SEMESTRAL_NTNB, Math.pow(1.06, 0.5) - 1, 1e-12),
  "cupom semestral = (1,06)^(1/2) − 1 (juros compostos, não 3% linear)"
);

const zero = util.calcularDuration({ vencimentoISO: "2035-05-15", comCupom: false, taxaReal: 0.07, hojeISO: HOJE });
const prazoZero = util.anosEntre(HOJE, "2035-05-15");
conferir(perto(zero.macaulay, prazoZero, 1e-9), "zero-cupom: duration de Macaulay = prazo até o vencimento");
conferir(perto(zero.modificada, zero.macaulay / 1.07, 1e-9), "duration modificada = Macaulay / (1 + y)");

const cupom = util.calcularDuration({ vencimentoISO: "2035-05-15", comCupom: true, taxaReal: 0.07, hojeISO: HOJE });
conferir(cupom.macaulay < prazoZero, "com cupom: duration < prazo (parte do dinheiro volta antes)");
conferir(cupom.macaulay < zero.macaulay, "com cupom: duration menor que a do zero-cupom de mesmo vencimento");
conferir(cupom.fluxos.length === 19, `fluxo semestral tem ${cupom.fluxos.length} pagamentos até 15/05/2035`);
conferir(
  cupom.fluxos.every((f) => /-(05|11)-15$/.test(f.dataISO)),
  "cupons de um vencimento de maio caem em 15/05 e 15/11"
);
conferir(
  perto(cupom.fluxos.at(-1).valor, 100 + 100 * util.CUPOM_SEMESTRAL_NTNB, 1e-9),
  "último fluxo = principal + cupom"
);

// Convexidade: subir e cair 1 p.p. não custam o mesmo. O ganho tem de ser maior
// que a perda — se isso inverter, o sinal do termo quadrático está trocado.
conferir(
  Math.abs(zero.variacaoMenos1pp) > Math.abs(zero.variacaoPor1pp),
  "convexidade: −1 p.p. ganha mais do que +1 p.p. perde"
);
conferir(zero.variacaoPor1pp < 0 && zero.variacaoMenos1pp > 0, "taxa sobe -> preço cai, e vice-versa");

// Preço ao par: um título com cupom precificado à própria taxa de cupom vale ~100.
const par = util.precoPor100({ vencimentoISO: "2035-05-15", comCupom: true, taxaReal: 0.06, hojeISO: HOJE });
conferir(Math.abs(par - 100) < 1.5, `com cupom a 6% precificado a 6% vale ~100 (deu ${par.toFixed(2)})`);

// NTN-F: mesmo desconto, cupom de 10%. Cupom maior devolve dinheiro mais cedo,
// então, com a MESMA taxa e o MESMO prazo, a duration tem de ser menor que a
// de um título de cupom 6%.
conferir(
  perto(util.CUPOM_SEMESTRAL_NTNF, Math.pow(1.10, 0.5) - 1, 1e-12),
  "cupom semestral NTN-F = (1,10)^(1/2) − 1"
);
const cupom6 = util.calcularDuration({ vencimentoISO: "2035-01-01", comCupom: true, cupomAnual: 0.06, taxaReal: 0.10, hojeISO: HOJE });
const cupom10 = util.calcularDuration({ vencimentoISO: "2035-01-01", comCupom: true, cupomAnual: 0.10, taxaReal: 0.10, hojeISO: HOJE });
conferir(cupom10.macaulay < cupom6.macaulay, "cupom 10% (NTN-F) tem duration menor que cupom 6%, mesma taxa e prazo");

// LFT: pós-fixada, fora da matemática de duration por decisão.
conferir(util.temDuration("ipca") && util.temDuration("prefixado-juros") && !util.temDuration("selic"),
  "temDuration: todas as famílias menos a LFT");

console.log("\nclassificador de títulos");
const cls = (n) => util.classificarTitulo(n);
conferir(cls("Tesouro Prefixado")?.tipo === "prefixado", "LTN por extenso -> prefixado");
conferir(cls("Tesouro Prefixado com Juros Semestrais")?.tipo === "prefixado-juros", "NTN-F por extenso -> prefixado-juros");
conferir(cls("Tesouro Selic")?.tipo === "selic", "LFT por extenso -> selic");
conferir(cls("LTN")?.tipo === "prefixado" && cls("NTN-F")?.tipo === "prefixado-juros" && cls("LFT")?.tipo === "selic",
  "siglas da ANBIMA reconhecidas (LTN, NTN-F, LFT)");
conferir(cls("NTN-B")?.tipo === "ipca-juros" && cls("NTN-B Principal")?.tipo === "ipca", "NTN-B e NTN-B Principal seguem certos");
conferir(cls("Tesouro RendA+ Aposentadoria Extra") === null && cls("Tesouro Educa+") === null,
  "RendA+ e Educa+ ficam fora (amortização mensal, régua diferente)");
conferir(cls("Tesouro Prefixado com Juros Semestrais")?.cupomAnual === 0.10, "NTN-F carrega cupom de 10%");

// Sem taxa não há duration — e o app renderiza "—" em vez de inventar zero.
const semTaxa = util.calcularDuration({ vencimentoISO: "2035-05-15", comCupom: false, taxaReal: null });
conferir(semTaxa.macaulay === null, "sem taxa, duration é null (nunca 0)");
const vencido = util.calcularDuration({ vencimentoISO: "2020-05-15", comCupom: false, taxaReal: 0.07, hojeISO: HOJE });
conferir(vencido.macaulay === null, "vencimento no passado não produz duration");

// ---------------------------------------------------------------
console.log("\nparser do CSV do Tesouro");
const CAB = "Tipo Titulo;Data Vencimento;Data Base;Taxa Compra Manha;Taxa Venda Manha;PU Compra Manha;PU Venda Manha;PU Base Manha";
const idx = tesouro.mapearColunas(CAB, ";");
conferir(Object.keys(idx).length === 8, `cabeçalho documentado mapeia as 8 colunas (achou ${Object.keys(idx).length})`);
const p = tesouro.linhaParaPonto(
  "Tesouro IPCA+ com Juros Semestrais;15/08/2032;20/08/2026;7,05;7,11;4.312,45;4.298,10;4.305,00".split(";"),
  idx,
  null
);
conferir(p?.slug === "ipca-juros-2032-08-15", "linha de exemplo vira o slug esperado");
conferir(p?.taxaCompra === 7.05 && p?.puCompra === 4312.45, "números pt-BR convertidos (vírgula decimal, ponto de milhar)");
conferir(p?.comCupom === true, "'com Juros Semestrais' reconhecido como título com cupom");
const pLtn = tesouro.linhaParaPonto("Tesouro Prefixado;01/01/2031;20/08/2026;13,1;13,2;600,1;599,0;600,0".split(";"), idx, null);
conferir(pLtn?.slug === "prefixado-2031-01-01", "LTN agora entra, com o slug prefixado-*");
conferir(
  tesouro.linhaParaPonto("Tesouro RendA+ Aposentadoria Extra;15/12/2065;20/08/2026;6,1;6,2;100,1;99,0;100,0".split(";"), idx, null) === null,
  "RendA+/Educa+ continuam descartados (amortização mensal, régua diferente)"
);
// A coleta real trouxe uma linha com PU 0,00 (campo vazio de título vencido).
// Zero não é preço — passaria adiante como "R$ 0,00".
const puZero = tesouro.linhaParaPonto(
  "Tesouro IPCA+ com Juros Semestrais;15/08/2020;14/08/2020;-1,78;0;0,00;0,00;0,00".split(";"),
  idx,
  null
);
conferir(puZero?.puCompra === null, "PU zerado vira null (não R$ 0,00)");
conferir(tesouro.mapearColunas("Data Base;Tipo Titulo;Data Vencimento", ";").tipo === 1, "colunas achadas por nome, não por posição");
let estourou = false;
try {
  tesouro.mapearColunas("A;B;C", ";");
} catch {
  estourou = true;
}
conferir(estourou, "cabeçalho irreconhecível falha alto (em vez de ler número errado calado)");

console.log("\nparsers do Fed e do BCE");
const globais = await import("../server/providers/globais.js");
const fredFix = "observation_date,DFEDTARU\n2026-06-01,4.50\n2026-08-18,4.25\n2026-08-20,4.25";
const fredR = globais.parseCsvFred(fredFix);
conferir(fredR.ok && fredR.pontos.length === 3, "CSV do FRED parseia (cabeçalho observation_date)");
conferir(globais.parseCsvFred("DATE,DFEDTARU\n2026-08-18,4.25").ok, "CSV do FRED parseia (cabeçalho DATE antigo)");
const dec = globais.ultimaDecisao(fredR.pontos);
conferir(dec.taxa === 4.25 && dec.vigenteDesde === "2026-08-18" && dec.variacaoPP === -0.25,
  "última decisão derivada da série (taxa, vigência e variação)");
const bceFix = "KEY,FREQ,TIME_PERIOD,OBS_VALUE\nx,B,2026-06-10,2.15\nx,B,2026-08-19,2.00";
conferir(globais.parseCsvBce(bceFix).ok, "csvdata do BCE parseia (TIME_PERIOD/OBS_VALUE por nome)");
conferir(globais.parseCsvFred("lixo").ok === false && globais.parseCsvBce("lixo").ok === false,
  "formato irreconhecível devolve ok:false com amostra (nunca chute)");

console.log("\nparser de RSS (notícias)");
const noticias = await import("../server/providers/noticias.js");
const rssFix = `<rss><channel><item><title>Manchete A - Fonte X</title><link>https://t/1</link><pubDate>Fri, 21 Aug 2026 12:00:00 GMT</pubDate><source url="x">Fonte X</source></item><item><title><![CDATA[B &amp; C]]></title><link>https://t/2</link></item><item><title></title><link>https://t/3</link></item></channel></rss>`;
const itensRss = noticias.extrairItens(rssFix);
conferir(itensRss.length === 2, "itens extraídos; sem título são descartados");
conferir(itensRss[0].titulo === "Manchete A" && itensRss[0].fonte === "Fonte X", "sufixo da fonte removido do título");
conferir(itensRss[1].titulo === "B & C", "CDATA e entidades decodificados");
conferir(noticias.extrairItens("nada").length === 0, "XML irreconhecível devolve lista vazia (a tela explica)");
conferir(noticias.REGIOES.length === 3, "três regiões configuradas");

console.log("\nparser da ANBIMA");
const amostra = [
  "Titulo@Data Referencia@Codigo SELIC@Data Base/Emissao@Data Vencimento@Taxa Compra@Taxa Venda@Taxa Indicativa@PU",
  "NTN-B@20260820@760199@15/07/2000@15/05/2035@7,0512@7,0112@7,0312@4.123,456789",
  "LTN@20260820@100000@01/01/2020@01/01/2031@13,10@13,00@13,05@600,10",
].join("\n");
const ext = anbima.extrairTitulos(amostra);
// Com o classificador ampliado, a LTN da amostra também é reconhecida — o que
// é o comportamento desejado agora que o app cobre prefixados.
conferir(ext.ok && ext.titulos.length === 2, "extrai a NTN-B e agora também a LTN");
conferir(ext.titulos.some((t) => t.slug === "prefixado-2031-01-01"), "a LTN sai com slug prefixado-*");
conferir(ext.titulos[0]?.taxaIndicativa === 7.0312, "taxa indicativa lida");
conferir(anbima.extrairTitulos("lixo").ok === false, "arquivo irreconhecível devolve ok:false com amostra (nunca chute)");

// ---------------------------------------------------------------
// A montagem dos arquivos-ponte é o produto do repositório: se ela quebrar, o
// job falha depois de baixar dezenas de MB e o consumidor externo fica com o
// retrato de ontem. Como as funções são puras, dá para exercitá-las aqui.
console.log("\nmontagem dos arquivos-ponte");
const ponteMod = await import("../server/ponte.js");
const amostraSerie = [
  [
    "ipca-juros-2035-05-15",
    {
      tipo: "ipca-juros",
      vencimento: "2035-05-15",
      comCupom: true,
      serie: { "2026-08-19": [7.01, 4310.1], "2026-08-20": [7.05, 4312.45] },
      ultimo: { data: "2026-08-20", taxaCompra: 7.05, taxaVenda: 7.11, puCompra: 4312.45, puVenda: 4298.1 },
    },
  ],
  [
    "ipca-2035-05-15",
    {
      tipo: "ipca",
      vencimento: "2035-05-15",
      comCupom: false,
      serie: { "2026-08-20": [7.22, 2111.03] },
      ultimo: { data: "2026-08-20", taxaCompra: 7.22, taxaVenda: null, puCompra: 2111.03, puVenda: null },
    },
  ],
];
const montados = ponteMod.montarTitulos({ ordenados: amostraSerie, secPorSlug: {}, hoje: HOJE });
conferir(montados.length === 2, "montarTitulos devolve um item por vencimento");

// A coleta real trouxe NTN-B de 2019, 2020, 2024 e 2026 ainda no arquivo, com
// taxas absurdas (13,32% e −0,94%) porque o prazo tende a zero. Num arquivo que
// outra ferramenta lê como verdade, isso é pior do que ausência.
const comVencido = ponteMod.montarTitulos({
  ordenados: [
    ...amostraSerie,
    [
      "ipca-2019-05-15",
      {
        tipo: "ipca",
        vencimento: "2019-05-15",
        comCupom: false,
        serie: { "2019-05-14": [-0.94, 3224.89] },
        ultimo: { data: "2019-05-14", taxaCompra: -0.94, puCompra: 3224.89 },
      },
    ],
  ],
  secPorSlug: {},
  hoje: HOJE,
});
conferir(comVencido.length === 2, "títulos já vencidos ficam fora do retrato do dia");
conferir(!comVencido.some((t) => t.vencimento <= HOJE), "nenhum vencimento passado sobra no arquivo-ponte");

// Uma LFT montada não pode sair com duration; e os filtros por família são o
// que mantém o ntnb.json com o formato de sempre.
const comLft = ponteMod.montarTitulos({
  ordenados: [
    ...amostraSerie,
    ["selic-2029-03-01", { tipo: "selic", vencimento: "2029-03-01", comCupom: false, cupomAnual: null,
      serie: { "2026-08-20": [0.04, 16712.9] }, ultimo: { data: "2026-08-20", taxaCompra: 0.04, puCompra: 16712.9 } }],
  ],
  secPorSlug: {},
  hoje: HOJE,
});
const lft = comLft.find((t) => t.tipo === "selic");
conferir(lft && lft.duration.macaulayAnos === null, "LFT montada sai sem duration (null, não zero)");
conferir(ponteMod.filtrarFamilias(comLft, ["ipca", "ipca-juros"]).length === 2, "filtro de famílias isola os IPCA+ para o ntnb.json");
conferir(ponteMod.filtrarFamilias(comLft, ["selic"]).length === 1, "filtro de famílias isola a LFT para o selic.json");
conferir(montados[0].duration.macaulayAnos > 0, "item montado traz duration numérica");
conferir(montados[1].taxaVenda === null, "campo ausente vira null (não 0, não some)");
conferir(montados[0].destaque === true, "destaque do catálogo chega ao item");

const jsonPonte = ponteMod.montarPonte({ titulos: montados, agora: "2026-08-21T00:00:00.000Z", urlCsv: "x" });
conferir(JSON.parse(JSON.stringify(jsonPonte)).titulos.length === 2, "ntnb.json serializa e volta inteiro");
const jsonHist = ponteMod.montarHistorico({ ordenados: amostraSerie, agora: "z", urlCsv: "x", desde: "2019-01-01" });
conferir(Object.keys(jsonHist.titulos).length === 2, "historico.json monta os dois vencimentos");

// O markdown já quebrou uma vez por uma crase solta dentro de um template
// literal — erro que só aparece na hora de gerar. Este bloco é o guarda disso.
const mdPonte = ponteMod.markdownDaPonte({ titulos: montados, agora: "2026-08-21T00:00:00.000Z" });
conferir(typeof mdPonte === "string" && mdPonte.length > 400, "markdownDaPonte devolve texto");
conferir(mdPonte.startsWith("# NTN-B"), "markdown começa pelo título");
conferir(mdPonte.includes("| 15/05/2035 |"), "tabela do markdown traz a linha do vencimento");
conferir(!mdPonte.includes("undefined") && !mdPonte.includes("[object"), "markdown sem `undefined` ou `[object Object]`");
conferir(ponteMod.tabelaMD([]).split("\n").length === 2, "tabela vazia ainda traz cabeçalho + separador");


// ---------------------------------------------------------------
// A regra dos três lugares: um endpoint novo precisa existir no datalayer, no
// middleware do vite (dev) E como função da Vercel (produção). Esquecer a
// terceira faz funcionar em dev e dar 404 no ar — exatamente o erro que este
// bloco existe para pegar.
console.log("\nregra dos três lugares (datalayer + api/ + devApi)");
const vite = await ler("vite.config.js");
for (const nome of ROTAS) {
  const rota = nome.replace(/^get/, "").toLowerCase();
  const temArquivo = await ler(`api/${rota}.js`).then(() => true).catch(() => false);
  conferir(temArquivo, `api/${rota}.js existe (função da Vercel)`);
  conferir(vite.includes(`/api/${rota}`), `devApi() serve /api/${rota}`);
  conferir(vite.includes(nome), `vite.config.js importa ${nome}`);
}

// ---------------------------------------------------------------
console.log("\narquivos de dados");
for (const arq of ["dados/historico.json", "dados/ntnb.json"]) {
  try {
    const j = JSON.parse(await ler(arq));
    conferir(!!j && typeof j === "object", `${arq} é JSON válido`);
  } catch (e) {
    falhar(`${arq}: ${e.message}`);
  }
}
const hist = JSON.parse(await ler("dados/historico.json"));
conferir(!!hist.titulos, "historico.json tem `titulos`");
for (const [slug, d] of Object.entries(hist.titulos || {})) {
  if (!d.vencimento || !d.tipo) falhar(`historico: ${slug} sem tipo/vencimento`);
  if (slug !== util.slugDe(d.tipo, d.vencimento)) falhar(`historico: ${slug} não bate com slugDe()`);
}
ok("todo slug do histórico é coerente com tipo+vencimento (histórico não órfão)");

// ---------------------------------------------------------------
// CLAUDE.md, "Constantes duplicadas de propósito": server/ e src/ nunca se
// importam, então estes valores são copiados à mão e só um confronto de
// arquivos percebe quando um lado muda sozinho.
console.log("\nconstantes duplicadas entre server/ e src/");
const calc = await ler("src/components/Calculadora.jsx");
for (const [nome, valorServidor] of [
  ["CUPOM_SEMESTRAL_NTNB", util.CUPOM_SEMESTRAL_NTNB],
  ["CUPOM_SEMESTRAL_NTNF", util.CUPOM_SEMESTRAL_NTNF],
]) {
  const m = calc.match(new RegExp(`${nome}\\s*=\\s*([\\d.]+)`));
  if (!m) falhar(`${nome} não encontrado em Calculadora.jsx`);
  else conferir(perto(Number(m[1]), valorServidor, 5e-7), `${nome}: util.js ${valorServidor.toFixed(6)} = Calculadora.jsx ${m[1]}`);
}

// Estado por dispositivo: duas chaves de localStorage escritas por arquivos
// diferentes. Se colidirem (copiar-colar de uma para a outra), alertas e
// destaques passam a sobrescrever um ao outro — falha silenciosa e chata de
// diagnosticar, porque só aparece depois que o usuário mexe nos dois.
console.log("\nchaves de localStorage");
const alertasSrc = await ler("src/components/Alertas.jsx");
const destaquesSrc = await ler("src/destaques.js");
const chaveAlertas = alertasSrc.match(/CHAVE\s*=\s*"([^"]+)"/)?.[1];
const chaveDestaques = destaquesSrc.match(/CHAVE\s*=\s*"([^"]+)"/)?.[1];
conferir(!!chaveAlertas && !!chaveDestaques, "as duas chaves de localStorage foram encontradas");
conferir(chaveAlertas !== chaveDestaques, `chaves distintas (${chaveAlertas} != ${chaveDestaques})`);
const doc = await ler("CLAUDE.md");
for (const [nome, chave] of [["alertas", chaveAlertas], ["destaques", chaveDestaques]]) {
  conferir(chave && doc.includes(chave), `CLAUDE.md documenta a chave de ${nome} (${chave})`);
}

const { PERIODICIDADE } = await import("../src/format.js");
const mesmasChaves =
  Object.keys(util.ROTULO_PERIODICIDADE).length === Object.keys(PERIODICIDADE).length &&
  Object.entries(util.ROTULO_PERIODICIDADE).every(([k, v]) => PERIODICIDADE[k] === v);
conferir(mesmasChaves, "ROTULO_PERIODICIDADE (util.js) = PERIODICIDADE (format.js)");

console.log(falhas === 0 ? "\ntudo certo\n" : `\n${falhas} verificação(ões) falharam\n`);
process.exit(falhas === 0 ? 0 : 1);
