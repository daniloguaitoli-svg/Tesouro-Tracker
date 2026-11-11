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

import { readdir, readFile } from "node:fs/promises";
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

const ROTAS = ["getTitulos", "getDetalhe", "getCurva", "getFuturos", "getMacro", "getMercado", "getNoticias", "getCdi"];
for (const nome of ROTAS) conferir(typeof datalayer[nome] === "function", `datalayer exporta ${nome}()`);
for (const rel of ["tesouro", "anbima", "bcb", "globais", "noticias", "yahoo"]) {
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
  // O rótulo do catálogo, passado pelo classificador REAL, tem de devolver o
  // mesmo tipo e o mesmo comCupom que o catálogo declara. Amarrar as duas
  // pontas assim evita a versão anterior desta checagem, que codificava a
  // regra à mão como `comCupom === (tipo === "ipca-juros")` e por isso
  // afirmava que NTN-F não paga cupom — errado, e errado dos dois lados.
  const classe = util.classificarTitulo(c.nome);
  if (!classe) falhar(`${c.slug}: classificarTitulo() não reconhece o rótulo "${c.nome}"`);
  else if (classe.tipo !== c.tipo) falhar(`${c.slug}: rótulo classifica como ${classe.tipo}, catálogo diz ${c.tipo}`);
  else if (classe.comCupom !== c.comCupom) falhar(`${c.slug}: comCupom incoerente com o rótulo`);
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
const prazoZero = util.anosUteisEntre(HOJE, "2035-05-15");
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
// O choque de 2 p.p. NÃO é o dobro do de 1 p.p., e é a convexidade que faz a
// diferença: ela entra ao quadrado, então amortece a perda na alta e amplia o
// ganho na baixa. Se alguém "simplificar" a tela dobrando o ±1 p.p. à mão,
// estes dois abrem — e o erro seria do tipo que ninguém nota, porque o número
// continua plausível (−10,5% em vez de −10,2%).
conferir(
  zero.variacaoPor2pp < 0 && zero.variacaoPor2pp > 2 * zero.variacaoPor1pp,
  `+2 p.p. perde menos que o dobro de +1 p.p. (${zero.variacaoPor2pp.toFixed(2)}% contra ${(2 * zero.variacaoPor1pp).toFixed(2)}%)`
);
conferir(
  zero.variacaoMenos2pp > 2 * zero.variacaoMenos1pp,
  `−2 p.p. ganha mais que o dobro de −1 p.p. (${zero.variacaoMenos2pp.toFixed(2)}% contra ${(2 * zero.variacaoMenos1pp).toFixed(2)}%)`
);

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

// ---------------------------------------------------------------
// A ÚNICA conferência deste arquivo que compara a conta com a REALIDADE.
//
// Todas as outras acima são identidades internas — duration de zero-cupom
// igual ao prazo, modificada = Macaulay/(1+y) — e continuam verdes sob
// QUALQUER convenção de contagem, porque os dois lados contam igual.
// Foi exatamente por isso que o repositório descontou fluxo em dias
// corridos/365 por meses, com o CI verde, enquanto o mercado precifica em
// dias úteis/252.
//
// A LTN é o caso limpo: não tem cupom e a face é R$ 1.000 exatos, então o PU
// publicado pelo Tesouro tem de sair de volta da taxa publicada. Com du/252 o
// erro medido foi de 0,0003% a 0,0009% (arredondamento de centavo); com
// corridos/365, de −0,09% a −0,50%, crescendo com o prazo. A tolerância de
// 0,01% fica duas ordens de grandeza entre os dois.
//
// Isto também é o teste do calendário de feriados: um feriado faltando
// encurta o prazo em um dia útil e desloca o preço em (1+i)^(1/252) ≈ 0,05%,
// cinco vezes a tolerância.
console.log("\nconvenção de contagem (PU oficial reconstruído da taxa)");
{
  const { diasUteis, ehDiaUtil } = await import("../server/feriados.js");
  const { createRequire } = await import("node:module");
  const prefixado = createRequire(join(RAIZ, "package.json"))("./dados/prefixado.json");
  // Sem cupom e com PU: a face é 1.000 e o desconto é de um fluxo só.
  const ltns = (prefixado.titulos || []).filter(
    (t) => t.comCupom === false && t.puCompra > 0 && t.taxaCompra > 0 && t.data
  );

  // O repositório nasce com arquivos-semente vazios, e antes da primeira
  // coleta não há PU para conferir — isso é estado esperado, não defeito.
  if (!ltns.length) {
    avisar("nenhuma LTN com PU nos dados — pulando (semente ainda não coletada?)");
  } else {
    // Duas medidas, porque elas separam dois defeitos diferentes. A primeira
    // usa só o calendário; a segunda usa a precificação do app. Se as duas
    // abrem, o feriado está errado; se só a segunda abre, a convenção do app
    // é que está.
    const pior = (f) =>
      ltns.reduce(
        (p, t) => {
          const esperado = f(t);
          const erro = esperado == null ? Infinity : Math.abs(esperado / t.puCompra - 1);
          return erro > p.erro
            ? { erro, rotulo: `${t.vencimento} (oficial ${t.puCompra}, calculado ${esperado?.toFixed(2) ?? "—"})` }
            : p;
        },
        { erro: 0, rotulo: "" }
      );

    const calendario = pior((t) => 1000 / Math.pow(1 + t.taxaCompra / 100, diasUteis(t.data, t.vencimento) / 252));
    conferir(
      calendario.erro <= 1e-4,
      `calendário: ${ltns.length} LTN reconstruídas em du/252 — pior erro ${(calendario.erro * 100).toFixed(4)}% ${calendario.rotulo}`
    );

    // precoPor100 é a MESMA função que desconta o fluxo da NTN-B e alimenta a
    // duration e a Calculadora. A face da LTN é 1.000, daí o ×10.
    const app = pior((t) => {
      const por100 = util.precoPor100({
        vencimentoISO: t.vencimento,
        comCupom: false,
        taxaReal: t.taxaCompra / 100,
        hojeISO: t.data,
      });
      return por100 == null ? null : por100 * 10;
    });
    conferir(
      app.erro <= 1e-4,
      `precoPor100 do app reproduz o PU oficial — pior erro ${(app.erro * 100).toFixed(4)}% ${app.rotulo}`
    );
  }

  // A CONTAGEM ACUMULADA TEM DE DAR O MESMO QUE A CAMINHADA DIA A DIA.
  //
  // diasUteis deixou de andar um dia por vez em 10/2026 — caminhar custava
  // 7,6 s em getCurva, porque a duration de um título com cupom conta uma vez
  // por fluxo. A caminhada continua sendo a DEFINIÇÃO do que se quer contar, e
  // é contra ela que a versão rápida é conferida aqui, em datas sorteadas por
  // todo o intervalo que o app alcança.
  //
  // Sorteio com semente fixa: a checagem tem de dar o mesmo resultado em toda
  // execução, senão um CI vermelho não se reproduz.
  {
    const MS_DIA = 86400000;
    const caminhando = (a, b) => {
      const fim = new Date(Date.parse(`${b}T00:00:00Z`));
      let d = new Date(Date.parse(`${a}T00:00:00Z`));
      let n = 0;
      while (d < fim) {
        d = new Date(d.getTime() + MS_DIA);
        if (ehDiaUtil(d)) n++;
      }
      return n;
    };
    let semente = 20261026;
    const sorteio = () => ((semente = (semente * 1103515245 + 12345) % 2147483648) / 2147483648);
    const de = Date.parse("2002-01-01T00:00:00Z");
    const ate = Date.parse("2065-12-31T00:00:00Z");
    const data = (t) => new Date(t).toISOString().slice(0, 10);

    // As bordas que um contador acumulado erra primeiro: virada de ano, ano
    // bissexto, feriado móvel (carnaval 2024) e o 20/11 que só é nacional
    // desde 2024 — nos dois lados da mudança.
    const bordas = [
      ["2019-12-31", "2020-01-02"],
      ["2020-02-27", "2020-03-02"],
      ["2024-02-09", "2024-02-15"],
      ["2023-11-17", "2023-11-21"],
      ["2024-11-18", "2024-11-21"],
      ["2026-10-26", "2060-08-15"],
    ];
    let divergentes = 0;
    for (const [a, b] of bordas) if (diasUteis(a, b) !== caminhando(a, b)) divergentes++;
    for (let i = 0; i < 600; i++) {
      let x = de + Math.floor(sorteio() * (ate - de));
      let y = de + Math.floor(sorteio() * (ate - de));
      if (x > y) [x, y] = [y, x];
      if (diasUteis(data(x), data(y)) !== caminhando(data(x), data(y))) divergentes++;
    }
    conferir(
      divergentes === 0,
      `contagem acumulada = caminhada dia a dia em ${600 + bordas.length} intervalos (bordas de ano, bissexto, carnaval e 20/11)`
    );
  }
}

// A janela de 12 meses é o numero em DESTAQUE do cartao do Ibovespa: se ela
// comparar com o ponto errado (ou com o mais antigo que existir, fingindo ser
// um ano), a tela mente com cara de certeza.
// ---------------------------------------------------------------
// As curvas de futuros da B3. Os números da amostra NÃO são inventados: são
// os do arquivo real de 23/10/2026, copiados da sonda. Isso faz a conferência
// medir a conta contra a realidade, e não contra si mesma — a mesma lição que
// a convenção de dias úteis custou.
console.log("\ncurvas de futuros da B3 (DI1 e cupom cambial)");
{
  const b3 = await import("../server/providers/b3.js");
  const REF = "2026-10-23";

  // Duas linhas de aviso antes do cabeçalho, de propósito: o arquivo da B3
  // abre com "Status do Arquivo", e quem tomar a linha 0 como cabeçalho lê
  // tudo deslocado sem erro nenhum.
  const negocios = [
    "Status do Arquivo: Final",
    "RptDt;TckrSymb;ISIN;SgmtNm;MinPric;MaxPric;TradAvrgPric;LastPric;OscnPctg;AdjstdQt;AdjstdQtTax;RefPric;TradQty;FinInstrmQty;NtlFinVol",
    "2026-10-23;DI1F27;;FINANCIAL;;;;;;97.671,01;13,468;;10718;;",
    "2026-10-23;DI1F28;;FINANCIAL;;;;;;86.671,01;12,859;;40021;;",
    "2026-10-23;DDIX26;;FINANCIAL;;;;;;;29,032;;0;;",
    "2026-10-23;DDIZ26;;FINANCIAL;;;;;;;12,085;;0;;",
    "2026-10-23;DDIF27;;FINANCIAL;;;;;;98.165,48;9,216;;0;;",
    "2026-10-23;FRCZ26;;FINANCIAL;;;;;;;5,38;;12;;",
    "2026-10-23;FRCF27;;FINANCIAL;;;;;;;5,65;;37;;",
    "2026-10-23;PETR4;;CASH;;;;;;;;;999;;",
  ].join("\n");

  const cadastro = [
    "Status do Arquivo: Final",
    "RptDt;TckrSymb;Asst;AsstDesc;SgmtNm;MktNm;SctyCtgyNm;XprtnDt",
    "2026-10-23;DI1F27;DI1;DI1;FINANCIAL;;;2027-01-04",
    "2026-10-23;DI1F28;DI1;DI1;FINANCIAL;;;2028-01-03",
    "2026-10-23;DDIX26;DDI;DDI;FINANCIAL;;;2026-11-03",
    "2026-10-23;DDIZ26;DDI;DDI;FINANCIAL;;;2026-12-01",
    "2026-10-23;DDIF27;DDI;DDI;FINANCIAL;;;2027-01-04",
    "2026-10-23;FRCZ26;FRC;FRC;FINANCIAL;;FORWARD RATE AGREEMENT;2026-12-01",
    "2026-10-23;FRCF27;FRC;FRC;FINANCIAL;;FORWARD RATE AGREEMENT;2027-01-04",
  ].join("\n");

  conferir(b3.numeroB3("97.671,01") === 97671.01, "número pt-BR da B3: 97.671,01 vira 97671.01");
  conferir(b3.numeroB3("") === null && b3.numeroB3("—") === null, "campo vazio da B3 é null, nunca 0");
  conferir(b3.partesDoTicker("DI1F27")?.letra === "F", "ticker se abre em ativo + letra do mês + ano");
  conferir(b3.partesDoTicker("PETR4") === null, "código que não é de futuro não vira contrato");

  const { contratos, incoerentes, dataRef } = b3.extrairContratos(negocios, cadastro);
  conferir(dataRef === REF, `a data de referência sai do arquivo (${dataRef})`);
  conferir(contratos.length === 7, `${contratos.length} contratos extraídos, a ação de fora`);
  conferir(incoerentes.length === 0, "letra do mês bate com o mês do vencimento em todos");

  // O defeito que a conferência de coerência existe para pegar: cadastro
  // casado com o contrato errado. Não levanta erro — só move a curva.
  const cadTorto = cadastro.replace("DI1F27;DI1;DI1;FINANCIAL;;;2027-01-04", "DI1F27;DI1;DI1;FINANCIAL;;;2027-07-01");
  conferir(b3.extrairContratos(negocios, cadTorto).incoerentes.length === 1, "junção torta entre os dois arquivos é detectada");

  // Cabeçalho ausente tem de ESTOURAR com o que recebeu, não devolver vazio.
  let gritou = false;
  try {
    b3.lerCsvB3("qualquer coisa;sem;cabecalho\n1;2;3");
  } catch {
    gritou = true;
  }
  conferir(gritou, "arquivo sem a coluna RptDt falha alto, não devolve lista vazia");

  // A CONFERÊNCIA QUE VALE: o PU recalculado na convenção de dias úteis/252
  // tem de reproduzir o ajuste publicado pela B3.
  const di = b3.curvaDI(contratos, REF);
  const f27 = di.find((p) => p.ticker === "DI1F27");
  conferir(f27?.diasUteis === 47, `DI1F27 tem ${f27?.diasUteis} dias úteis até 04/01/2027`);
  const erroPU = Math.abs(f27.puRecalculado / f27.pu - 1);
  conferir(erroPU <= 1e-4, `DI1 em du/252 reproduz o ajuste da B3 — erro ${(erroPU * 100).toFixed(4)}%`);

  // Cupom: o vértice curto é o próximo DDI em aberto, e ele NÃO é ponto de
  // curva. 29% ao lado de 5,4% é a PTAX de ontem, não o mercado.
  const cupom = b3.curvaCupom(contratos, REF);
  conferir(cupom.vertice?.ticker === "DDIX26", `vértice curto é o próximo DDI em aberto (${cupom.vertice?.ticker})`);
  conferir(cupom.vertice?.dias === 11, `vértice curto a ${cupom.vertice?.dias} dias corridos`);
  conferir(
    cupom.pontos.every((p) => p.ticker.startsWith("FRC")),
    "a curva em USD é só de FRC — nenhum DDI sujo entre os pontos"
  );
  conferir(
    cupom.pontos.every((p) => p.diasDoVertice > 0 && p.diasDoVertice < p.dias),
    "o prazo do FRC é contado a partir do vértice curto, não de hoje"
  );

  // O ROLL DO FRC, que é a regra publicada da B3: a partir do penúltimo dia
  // de negociação do primeiro vencimento de DDI, a ponta curta passa para o
  // segundo. Sem isto, a âncora fica no vértice que está morrendo, a
  // identidade abre e o coletor para de gravar — foi o que congelou o
  // histórico de futuros entre 29 e 31/10/2026.
  //
  // O DDIX26 vence em 03/11/2026 e 02/11 é feriado, então o último dia de
  // negociação é 30/10 e o penúltimo é 29/10. A virada tem de cair EXATAMENTE
  // aí: um dia antes ou um dia depois reproduz o defeito, em dias diferentes.
  {
    const diasDaVirada = [
      ["2026-10-23", "DDIX26", "seis dias úteis antes: ainda o primeiro"],
      ["2026-10-28", "DDIX26", "três dias úteis antes: ainda o primeiro"],
      ["2026-10-29", "DDIZ26", "PENÚLTIMO dia de negociação: rola para o segundo"],
      ["2026-10-30", "DDIZ26", "último dia de negociação: já rolado"],
    ];
    for (const [data, esperada, porque] of diasDaVirada) {
      const a = b3.ancoraDoCupom(contratos, data);
      conferir(a?.ticker === esperada, `âncora em ${data} é ${a?.ticker} — ${porque}`);
    }
  }

  // E a identidade que define o FRC, com os números reais: se ela abrir, ou a
  // convenção linear/360 mudou, ou o vértice curto não é o que pensamos.
  const { pior, comparados } = b3.erroDoBootstrap(contratos, REF);
  conferir(comparados >= 2, `${comparados} vencimentos comparados no bootstrap`);
  conferir(pior <= 1e-5, `DDI curto + FRC reproduz o DDI longo — pior erro ${(pior * 100).toFixed(5)}%`);
}

// A DAP tem BLOCO PRÓPRIO porque tem DATA própria: estes números são do
// arquivo real de 30/10/2026, e os de cima são de 23/10. Misturar as duas
// datas num fixture só faria os dias úteis saírem errados e a conferência
// reprovar código correto — exatamente o erro de comparação que o CLAUDE.md
// registra na seção de comparar futuro com Tesouro.
console.log("\ncurva de juro real da B3 (DAP)");
{
  const b3 = await import("../server/providers/b3.js");
  const REF = "2026-10-30";

  const negocios = [
    "Status do Arquivo: Final",
    "RptDt;TckrSymb;ISIN;SgmtNm;MinPric;MaxPric;TradAvrgPric;LastPric;OscnPctg;AdjstdQt;AdjstdQtTax;RefPric;TradQty;FinInstrmQty;NtlFinVol",
    "2026-10-30;DAPX26;;FINANCIAL;;;;;;99.685,66;8,257;;0;;",
    "2026-10-30;DAPK27;;FINANCIAL;;;;;;97.506,86;4,900;;112;;",
    "2026-10-30;DAPK29;;FINANCIAL;;;;;;82.763,84;7,835;;124;;",
    "2026-10-30;DAPQ32;;FINANCIAL;;;;;;64.204,44;8,005;;117;;",
    "2026-10-30;DAPQ60;;FINANCIAL;;;;;;9.111,45;7,394;;0;;",
  ].join("\n");
  const cadastro = [
    "Status do Arquivo: Final",
    "RptDt;TckrSymb;Asst;AsstDesc;SgmtNm;MktNm;SctyCtgyNm;XprtnDt",
    "2026-10-30;DAPX26;DAP;Cupom de IPCA;FINANCIAL;;;2026-11-16",
    "2026-10-30;DAPK27;DAP;Cupom de IPCA;FINANCIAL;;;2027-05-17",
    "2026-10-30;DAPK29;DAP;Cupom de IPCA;FINANCIAL;;;2029-05-15",
    "2026-10-30;DAPQ32;DAP;Cupom de IPCA;FINANCIAL;;;2032-08-16",
    "2026-10-30;DAPQ60;DAP;Cupom de IPCA;FINANCIAL;;;2060-08-16",
  ].join("\n");

  const { contratos } = b3.extrairContratos(negocios, cadastro);
  const dap = b3.curvaDAP(contratos, REF);
  conferir(dap.length === 5, `${dap.length} vencimentos de DAP extraídos`);

  // A CONFERÊNCIA CONTRA A REALIDADE, igual à do DI1: o ajuste publicado tem
  // de sair da taxa publicada, em dias úteis/252 exponencial. Se abrir, a
  // convenção da DAP não é a que medimos.
  let pior = 0, ondePior = "";
  for (const p of dap) {
    const e = Math.abs(p.puRecalculado / p.pu - 1);
    if (e > pior) { pior = e; ondePior = p.ticker; }
  }
  conferir(pior <= 1e-4, `DAP em du/252 reproduz o ajuste da B3 em 5 vencimentos — pior erro ${(pior * 100).toFixed(4)}% (${ondePior})`);

  // O vencimento mais longo da DAP é o primeiro dia útil depois do da NTN-B
  // 2060 (15/08/2060, um domingo). É a evidência de que a DAP é moldada na
  // NTN-B, e é barata de conferir.
  const longo = dap[dap.length - 1];
  conferir(longo.vencimento === "2060-08-16", `a ponta longa da DAP acompanha a NTN-B 2060 (${longo.vencimento})`);

  // A FACE IMPLÍCITA, que é o portão de gravação. Constante = convenção
  // entendida.
  const face = b3.erroDaFace(dap);
  conferir(face.comparados === 5, `${face.comparados} vencimentos na conferência da face`);
  conferir(face.dispersao <= 1e-4, `face implícita constante — dispersão ${(face.dispersao * 100).toFixed(4)}%`);
  conferir(Math.abs(face.face - 100000) < 10, `e vale ${Math.round(face.face).toLocaleString("pt-BR")}, a face do contrato`);

  // CONTROLE NEGATIVO: sem ele, "a dispersão fechou" só diria que a conta
  // concorda consigo mesma. Preços montados na convenção ERRADA (corridos/365)
  // têm de abrir a face muito além do limite.
  const errados = dap.map((p) => {
    const corridos = Math.round((Date.parse(p.vencimento) - Date.parse(REF)) / 86400000);
    return { ...p, pu: 100000 / Math.pow(1 + p.taxa / 100, corridos / 365) };
  });
  const faceErrada = b3.erroDaFace(errados);
  conferir(
    faceErrada.dispersao > 1e-3,
    `preço montado em corridos/365 abre a face em ${(faceErrada.dispersao * 100).toFixed(2)}% — o portão pega convenção trocada`
  );
}

// ---------------------------------------------------------------
// A ACUMULAÇÃO dos futuros. O arquivo público da B3 só serve os últimos
// meses, então o histórico nasce daqui — e erro de fusão não grita, só perde
// dia em silêncio.
// ---------------------------------------------------------------
// A montagem das curvas de futuros, com duas datas de mentira. Sem isto a
// lógica só poderia ser exercitada depois da primeira coleta de verdade —
// quer dizer, só em produção.
console.log("\ncurvas de futuros: montagem do payload");
{
  const { curvasDeFuturos } = await import("../server/datalayer.js");

  const hoje = "2026-11-24";
  const mes = "2026-10-23"; // 32 dias antes: passa do piso de 30
  const arquivo = {
    fonte: "B3",
    contratos: {
      DI1F27: { ativo: "DI1", vencimento: "2027-01-04", serie: { [mes]: [13.468, 97671.01], [hoje]: [13.1, 98500] } },
      DI1F29: { ativo: "DI1", vencimento: "2029-01-02", serie: { [mes]: [12.642, 77264.96], [hoje]: [12.5, 78000] } },
      DI1X26: { ativo: "DI1", vencimento: "2026-11-03", serie: { [mes]: [14.9, 99500] } }, // venceu entre as duas datas
      FRCF27: { ativo: "FRC", vencimento: "2027-01-04", serie: { [mes]: [5.65, null], [hoje]: [5.7, null] } },
      FRCF29: { ativo: "FRC", vencimento: "2029-01-02", serie: { [mes]: [6.18, null], [hoje]: [6.2, null] } },
      DDIZ26: { ativo: "DDI", cupomSujo: true, vencimento: "2026-12-01", serie: { [hoje]: [21.4, null] } },
      DDIF27: { ativo: "DDI", vencimento: "2027-01-04", serie: { [hoje]: [9.2, 98165.48] } },
      // Dois de DAP acima do piso e um abaixo: é o que permite conferir que o
      // corte da ponta curta acontece e que o cortado não some.
      DAPK29: { ativo: "DAP", vencimento: "2029-05-15", serie: { [mes]: [7.8, 82763.84], [hoje]: [7.835, 82700] } },
      DAPQ32: { ativo: "DAP", vencimento: "2032-08-16", serie: { [mes]: [8.0, 64204.44], [hoje]: [8.005, 64100] } },
      DAPK27: { ativo: "DAP", vencimento: "2027-05-17", serie: { [hoje]: [4.9, 97506.86] } },
    },
  };

  const r = curvasDeFuturos(arquivo);
  conferir(r.pendente === false && r.data === hoje, `a data da curva é a última coletada (${r.data})`);
  conferir(r.comparadoCom === mes, `a comparação pega a coleta mais próxima de 30 dias atrás (${r.comparadoCom})`);

  const di = r.curvas.find((c) => c.id === "di-pre");
  const cupom = r.curvas.find((c) => c.id === "cupom-limpo");

  conferir(di.agora.length === 2 && cupom.agora.length === 2, "cada curva pega só os contratos do seu ativo");
  conferir(di.agora.every((p) => p.slug.startsWith("DI1")), "nenhum DDI vaza para a curva em reais");
  conferir(cupom.agora.every((p) => p.slug.startsWith("FRC")), "nenhum DDI sujo vaza para a curva em dólar");

  // A curva de um mês atrás é feita do que estava vivo NAQUELA data — o DI1X26
  // venceu desde então e precisa aparecer lá, senão a ponta curta da linha
  // tracejada começa mais à direita que a da linha cheia, e quem comparar as
  // duas lê o recorte em vez do mercado. É a mesma regra da curva dos títulos.
  conferir(di.umMesAtras.length === 3, `a curva de um mês atrás tem os vivos de então (${di.umMesAtras.length}, com o que já venceu)`);
  conferir(di.umMesAtras.some((p) => p.slug === "DI1X26"), "o vencimento que expirou no meio-tempo está na curva antiga");
  conferir(!di.agora.some((p) => p.slug === "DI1X26"), "e não está na de hoje");

  // Cada curva no seu prazo: dias úteis/252 no DI, dias corridos/360 no cupom.
  // Mesmo vencimento, números diferentes de propósito.
  const diF27 = di.agora.find((p) => p.slug === "DI1F27");
  const frcF27 = cupom.agora.find((p) => p.slug === "FRCF27");
  conferir(Math.abs(diF27.anos - 0.112) < 0.02, `DI1F27 a ${diF27.anos.toFixed(3)} anos ÚTEIS de 24/11`);
  conferir(Math.abs(frcF27.anos - 0.114) < 0.02, `FRCF27 a ${frcF27.anos.toFixed(3)} anos CORRIDOS/360`);
  conferir(diF27.anos !== frcF27.anos, "as duas curvas medem o prazo em réguas diferentes, de propósito");

  conferir(
    di.agora[0].anos < di.agora[1].anos && cupom.agora[0].anos < cupom.agora[1].anos,
    "os pontos saem ordenados por prazo — polilinha não volta para trás"
  );
  conferir(di.agora.every((p) => p.comCupom === false), "todo ponto carrega comCupom, senão o separador de famílias agrupa tudo calado");

  // O vértice curto é o DDI mais curto vivo, e vem com a taxa SUJA marcada.
  conferir(cupom.vertice?.slug === "DDIZ26", `vértice curto é o DDI mais curto (${cupom.vertice?.slug})`);
  conferir(cupom.vertice?.taxaSuja === 21.4, "o vértice traz a taxa suja, não uma taxa limpa qualquer");

  // A TERCEIRA CURVA, e o piso da ponta curta. O DAPK27 está a ~0,5 ano: tem
  // de ficar FORA do gráfico e DENTRO de `curtos`, porque a tela precisa dizer
  // o que cortou. Sumir calado seria o mesmo defeito que o vértice sujo do DDI
  // teria se não viajasse no payload.
  const ipca = r.curvas.find((c) => c.id === "cupom-ipca");
  conferir(!!ipca, "a curva de cupom de IPCA existe no payload");
  conferir(ipca.agora.length === 2, `o piso de ${1.5} ano deixa ${ipca.agora.length} vértices no gráfico`);
  conferir(ipca.agora.every((p) => p.anos >= 1.5), "nenhum ponto abaixo do piso entra na curva");
  conferir(ipca.curtos?.some((p) => p.slug === "DAPK27"), "o vértice curto cortado viaja em `curtos`, não some");
  conferir(ipca.curtos.every((p) => p.anos < 1.5), "e `curtos` só tem o que ficou abaixo do piso");
  conferir(ipca.agora.every((p) => p.slug.startsWith("DAP")), "nenhum DI1 vaza para a curva de juro real");
  conferir(!di.agora.some((p) => p.slug.startsWith("DAP")), "nem a DAP vaza para a curva pré");
  conferir(ipca.convencao.includes("úteis"), `a DAP é declarada em dias úteis (${ipca.convencao})`);

  conferir(r.historicoNota != null, "com poucos dias coletados a tela avisa que o histórico ainda cresce");

  const vazio = curvasDeFuturos({ contratos: {} });
  conferir(vazio.pendente === true && vazio.curvas.every((c) => c.agora.length === 0), "arquivo-semente devolve pendente, não gráfico vazio");
  conferir(curvasDeFuturos(null).pendente === true, "arquivo ausente não estoura");
}

console.log("\nacumulação de dados/futuros.json");
{
  const { montarFuturos } = await import("../server/ponte.js");
  const leitura = (data) => ({
    data,
    di: [{ ticker: "DI1F27", vencimento: "2027-01-04", taxa: 13.468, pu: 97671.01 }],
    cupom: {
      pontos: [{ ticker: "FRCF27", vencimento: "2027-01-04", taxa: 5.65 }],
      vertice: { ticker: "DDIX26", vencimento: "2026-11-03", dias: 11, taxaSuja: 29.032 },
    },
  });

  const dia1 = montarFuturos({ anterior: { contratos: {} }, leitura: leitura("2026-10-23"), agora: "A" });
  conferir(Object.keys(dia1.contratos).length === 3, "primeira coleta grava DI1, FRC e o vértice curto");
  conferir(dia1.desde === "2026-10-23" && dia1.ultimaColeta === "2026-10-23", "primeira coleta define desde e ultimaColeta");
  conferir(dia1.contratos.FRCF27.serie["2026-10-23"][1] === null, "FRC entra com PU null — ele não tem preço de ajuste");
  conferir(dia1.contratos.DI1F27.serie["2026-10-23"][1] === 97671.01, "DI1 entra com o PU de ajuste");
  conferir(dia1.contratos.DDIX26.cupomSujo === true, "o vértice curto fica MARCADO como cupom sujo");

  const dia2 = montarFuturos({ anterior: dia1, leitura: leitura("2026-10-26"), agora: "B" });
  conferir(Object.keys(dia2.contratos.DI1F27.serie).length === 2, "segunda coleta ACRESCENTA o dia, não substitui a série");
  conferir(dia2.desde === "2026-10-23", "desde continua apontando para a primeira coleta");
  conferir(dia2.ultimaColeta === "2026-10-26", "ultimaColeta anda com a coleta nova");

  // Repetir o mesmo dia tem de ser idempotente: o job roda cinco vezes por dia.
  const repetido = montarFuturos({ anterior: dia2, leitura: leitura("2026-10-26"), agora: "C" });
  conferir(Object.keys(repetido.contratos.DI1F27.serie).length === 2, "coletar o mesmo dia de novo não duplica ponto");

  // Contrato que saiu da leitura (venceu) não pode sumir do arquivo: a série
  // dele é história, como os títulos vencidos em historico.json.
  const semFrc = { data: "2026-10-27", di: leitura("x").di, cupom: { pontos: [], vertice: null } };
  const dia3 = montarFuturos({ anterior: dia2, leitura: semFrc, agora: "D" });
  conferir(dia3.contratos.FRCF27 != null, "contrato ausente da leitura do dia NÃO é apagado do histórico");
  conferir(Object.keys(dia3.contratos.FRCF27.serie).length === 2, "e a série dele fica intacta, sem ponto novo");

  const datas = Object.keys(dia2.contratos.DI1F27.serie);
  conferir(datas.join() === [...datas].sort().join(), "a série sai ordenada por data");

  const cache = await import("../server/cache.js");
  conferir(typeof cache.futuros === "function", "cache.js expõe futuros()");

  // A gravação é condicional de propósito: identidade do bootstrap aberta
  // significa convenção mudada na B3, e aí gravar por cima do bom é pior do
  // que não gravar.
  // A gravação tem de acontecer DEPOIS da conferência do bootstrap, e em um
  // lugar só. Conferido por POSIÇÃO no arquivo, e não por uma linha literal:
  // a primeira versão desta conferência citava a linha exata, e quebrou na
  // primeira vez que o bloco mudou de lugar — exigindo que o código fique
  // escrito de um jeito específico, em vez de exigir a propriedade.
  const coletor = await ler(".github/scripts/coletar-tesouro.mjs");
  const gravacoes = [...coletor.matchAll(/writeFile\(ARQ_FUTUROS/g)];
  const guarda = coletor.indexOf("pior > LIMITE_BOOTSTRAP");
  conferir(gravacoes.length === 1, `futuros.json é gravado em um lugar só (${gravacoes.length})`);
  conferir(guarda >= 0 && gravacoes[0]?.index > guarda, "a gravação de futuros.json vem DEPOIS da conferência do bootstrap");

  // E antes da saída antecipada do Tesouro: fontes independentes, falhas
  // independentes. Se esta ordem inverter, uma queda do Tesouro passa a
  // custar um dia de histórico da B3 sem ninguém perceber.
  const leituraB3 = coletor.indexOf("await lerFuturos(");
  const leituraTesouro = coletor.indexOf("await varrerSerie(");
  conferir(
    leituraB3 >= 0 && leituraTesouro >= 0 && leituraB3 < leituraTesouro,
    "a B3 é lida e gravada ANTES do Tesouro, para a queda de um não custar o dia do outro"
  );
}

console.log("\njanelas de variação (12 meses / 1 semana)");
const serieUtil = [];
{
  let v = 100;
  for (let d = new Date(Date.UTC(2024, 7, 1)); d <= new Date(Date.UTC(2026, 7, 21)); d = new Date(d.getTime() + 864e5)) {
    const dow = d.getUTCDay();
    if (dow === 0 || dow === 6) continue; // sem pregão
    v *= 1.0004;
    serieUtil.push({ date: d.toISOString().slice(0, 10), close: Number(v.toFixed(2)) });
  }
}
const j12 = util.variacaoPeriodo(serieUtil, 365);
const j1s = util.variacaoPeriodo(serieUtil, 7);
conferir(j12 && j12.de === "2025-08-21" && j12.ate === "2026-08-21", "12 meses parte do ponto de um ano antes");
conferir(j12.pct > 0, "série em alta devolve variação positiva");
// 21/08/2026 é sexta; 7 dias antes é 14/08, também sexta e com pregão.
conferir(j1s && j1s.de === "2026-08-14", "1 semana cai no último pregão em ou antes do alvo");
// Alvo em fim de semana: recua para a sexta anterior em vez de devolver null.
const ateSegunda = serieUtil.filter((p) => p.date <= "2026-08-17");
conferir(util.variacaoPeriodo(ateSegunda, 2)?.de === "2026-08-14", "alvo em fim de semana recua para o pregão anterior");
// Série curta: null, nunca comparar com o ponto mais antigo e chamar de 12 meses.
conferir(util.variacaoPeriodo(serieUtil.slice(-10), 365) === null, "série curta demais devolve null (não finge 12 meses)");
conferir(util.variacaoPeriodo([], 7) === null && util.variacaoPeriodo(null, 7) === null, "série vazia/ausente devolve null");
// Sinal correto na queda.
const caindo = [
  { date: "2025-08-20", close: 200 },
  { date: "2026-08-20", close: 150 },
];
conferir(Math.abs(util.variacaoPeriodo(caindo, 365).pct - -25) < 1e-9, "queda de 200 para 150 é −25%");

console.log("\nclassificador de títulos");
const cls = (n) => util.classificarTitulo(n);
conferir(cls("Tesouro Prefixado")?.tipo === "prefixado", "LTN por extenso -> prefixado");
conferir(cls("Tesouro Prefixado com Juros Semestrais")?.tipo === "prefixado-juros", "NTN-F por extenso -> prefixado-juros");
conferir(cls("Tesouro Selic")?.tipo === "selic", "LFT por extenso -> selic");
conferir(cls("LTN")?.tipo === "prefixado" && cls("NTN-F")?.tipo === "prefixado-juros" && cls("LFT")?.tipo === "selic",
  "siglas da ANBIMA reconhecidas (LTN, NTN-F, LFT)");
conferir(cls("NTN-B")?.tipo === "ipca-juros" && cls("NTN-B Principal")?.tipo === "ipca", "NTN-B e NTN-B Principal seguem certos");
conferir(cls("Tesouro RendA+ Aposentadoria Extra") === null && cls("Tesouro Educa+") === null,
  "RendA+ e Educa+ ficam fora (amortização mensal, escala diferente)");
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
  "RendA+/Educa+ continuam descartados (amortização mensal, escala diferente)"
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
conferir(fredR.ok && fredR.pontos.length === 3, "CSV do FRED é lido (cabeçalho observation_date)");
conferir(globais.parseCsvFred("DATE,DFEDTARU\n2026-08-18,4.25").ok, "CSV do FRED é lido (cabeçalho DATE antigo)");
const dec = globais.ultimaDecisao(fredR.pontos);
conferir(dec.taxa === 4.25 && dec.vigenteDesde === "2026-08-18" && dec.variacaoPP === -0.25,
  "última decisão derivada da série (taxa, vigência e variação)");
const bceFix = "KEY,FREQ,TIME_PERIOD,OBS_VALUE\nx,B,2026-06-10,2.15\nx,B,2026-08-19,2.00";
conferir(globais.parseCsvBce(bceFix).ok, "csvdata do BCE é lido (TIME_PERIOD/OBS_VALUE por nome)");
conferir(globais.parseCsvFred("lixo").ok === false && globais.parseCsvBce("lixo").ok === false,
  "formato irreconhecível devolve ok:false com amostra (nunca chute)");

console.log("\nparser do Yahoo (Ibovespa)");
const yahoo = await import("../server/providers/yahoo.js");
const ontem = Math.floor(Date.UTC(2026, 7, 20) / 1000);
const hoje = Math.floor(Date.UTC(2026, 7, 21) / 1000);
const fixtureY = {
  chart: { result: [{ timestamp: [ontem, hoje, hoje + 86400],
    indicators: { quote: [{ close: [138000.4, 139500.6, null] }] } }] },
};
const serieY = yahoo.extrairSerie(fixtureY, { casas: 0 });
conferir(serieY.length === 2, "série do Yahoo extraída, pontos nulos descartados");
conferir(serieY[0].close === 138000 && serieY[0].date === "2026-08-20", "fechamento e data corretos");
// O formato do Yahoo é aninhado (chart.result[0].indicators.quote[0].close):
// uma refatoração desatenta devolve vazio em vez de erro, e a tela só mostra
// "—" sem ninguém entender por quê.
conferir(yahoo.extrairSerie({}).length === 0, "payload inesperado devolve série vazia (sem estourar)");
conferir(yahoo.extrairSerie({ chart: { result: [{}] } }).length === 0, "result sem timestamp/close devolve vazio");
conferir(yahoo.SIMBOLO_IBOVESPA === "^BVSP", "símbolo do Ibovespa é ^BVSP");

console.log("\nparser de RSS (notícias)");
const noticias = await import("../server/providers/noticias.js");
const rssFix = `<rss><channel><item><title>Manchete A - Fonte X</title><link>https://t/1</link><pubDate>Fri, 21 Aug 2026 12:00:00 GMT</pubDate><source url="x">Fonte X</source></item><item><title><![CDATA[B &amp; C]]></title><link>https://t/2</link></item><item><title></title><link>https://t/3</link></item></channel></rss>`;
const itensRss = noticias.extrairItens(rssFix);
conferir(itensRss.length === 2, "itens extraídos; sem título são descartados");
conferir(itensRss[0].titulo === "Manchete A" && itensRss[0].fonte === "Fonte X", "sufixo da fonte removido do título");
conferir(itensRss[1].titulo === "B & C", "CDATA e entidades decodificados");
conferir(noticias.extrairItens("nada").length === 0, "XML irreconhecível devolve lista vazia (a tela explica)");
conferir(noticias.REGIOES.length === 3, "três regiões configuradas");

// O FILTRO DO QUE NÃO É MANCHETE. No feed real de 09/11/2026, duas das oito
// manchetes dos EUA eram a página de cotação da CNN com o nome do ativo por
// preencher ("symbol__ Stock Quote…"), repetida, e a primeira do Brasil era
// o anúncio de um simpósio. Cada conferência abaixo guarda um lado da regra:
// o que tem de sair, e o que NÃO pode sair junto.
const itemRss = (t, l, d, f) =>
  `<item><title>${t}${f ? " - " + f : ""}</title><link>${l}</link>${d ? `<pubDate>${d}</pubDate>` : ""}${f ? `<source url="x">${f}</source>` : ""}</item>`;
const feedSujo = `<rss>${[
  itemRss("symbol__ Stock Quote Price and Forecast", "https://t/1", "Mon, 09 Nov 2026 17:40:05 GMT", "CNN"),
  itemRss("Tech set to still sway US stock market", "https://t/2", "Mon, 09 Nov 2026 16:55:16 GMT", "Reuters"),
  itemRss("symbol__ Stock Quote Price and Forecast", "https://t/3", "Mon, 09 Nov 2026 17:40:11 GMT", "CNN"),
  itemRss("UFPI divulga programação do 2º Simpósio Sala de Ações", "https://t/4", "Mon, 09 Nov 2026 17:27:00 GMT", "UFPI"),
  itemRss("Mercado eleva projeção da Selic", "https://t/5", "Mon, 09 Nov 2026 13:26:00 GMT", "Agência Brasil"),
  itemRss("Mercado eleva projeção da Selic!", "https://t/6", "Mon, 09 Nov 2026 14:00:00 GMT", "Outro"),
  itemRss("Congresso aprova arcabouço; corte de juros em curso", "https://t/7", "Mon, 09 Nov 2026 19:00:00 GMT", "Valor"),
  itemRss("Powell press conference: Fed holds", "https://t/8", "Mon, 09 Nov 2026 18:00:00 GMT", "WSJ"),
  itemRss("Sem data nenhuma", "https://t/9", null, "X"),
].join("")}</rss>`;
const limpos = noticias.extrairItens(feedSujo);
const titulosLimpos = limpos.map((x) => x.titulo);
conferir(!titulosLimpos.some((t) => /symbol__/.test(t)), "página de cotação com modelo por preencher fica de fora");
conferir(!titulosLimpos.some((t) => /Simpósio/.test(t)), "divulgação de evento fica de fora");
conferir(titulosLimpos.filter((t) => /projeção da Selic/.test(t)).length === 1, "manchete repetida entra uma vez só");
// O outro lado: as três palavras que NÃO podem estar no filtro, porque são
// manchete de mercado todo dia. Quem "completar" a lista de eventos com
// congresso, curso ou conference derruba estas três.
conferir(titulosLimpos.some((t) => /Congresso aprova/.test(t)), '"Congresso" e "em curso" não são descartados');
conferir(titulosLimpos.some((t) => /press conference/.test(t)), '"press conference" não é descartada');
conferir(limpos.length === 5, `sobraram as cinco manchetes de verdade (${limpos.length})`);
const datasLimpas = limpos.filter((x) => x.data).map((x) => Date.parse(x.data));
conferir(datasLimpas.every((d, i) => i === 0 || datasLimpas[i - 1] >= d), "manchetes da mais nova para a mais antiga");
conferir(limpos[limpos.length - 1].data === null, "manchete sem data vai para o fim, não some");
// Filtra ANTES de cortar: com limite 2, as duas primeiras do feed são lixo e
// uma boa. Cortar primeiro devolveria uma manchete só.
conferir(noticias.extrairItens(feedSujo, 2).length === 2, "o limite conta manchetes aproveitadas, não itens lidos");
conferir(noticias.descartadosDoFeed(feedSujo).length === 3, "o coletor recebe os três descartes, com motivo");
conferir(noticias.motivoDoDescarte("Ibovespa fecha em alta com exterior") === null, "manchete comum não tem motivo de descarte");

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
// Relacional de propósito, não fixado num slug: os destaques espelham as
// estrelas do celular e mudam quando a seleção muda. Fixar "montados[0] é
// destaque" fazia o verificar quebrar a cada troca de estrela — ruído, não
// defeito. O que importa é que o item repita o que o catálogo diz.
conferir(
  montados.every((t) => t.destaque === (porSlug[t.slug]?.destaque === true)),
  "destaque do catálogo chega ao item"
);
const foraDoCatalogo = ponteMod.montarTitulos({
  ordenados: [
    ["ipca-2099-05-15", { tipo: "ipca", vencimento: "2099-05-15", comCupom: false,
      serie: { "2026-08-20": [7.0, 100] }, ultimo: { data: "2026-08-20", taxaCompra: 7.0, puCompra: 100 } }],
  ],
  secPorSlug: {},
  hoje: HOJE,
});
conferir(foraDoCatalogo[0].destaque === false, "vencimento fora do catálogo nunca sai como destaque");

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
// O painel.json é o arquivo que o assistente pessoal lê todo dia. Se a
// montagem quebrar, ele fica com o retrato de ontem — ou pior, com campos
// faltando e sem aviso.
console.log("\nmontagem do painel.json");
const macroFake = {
  indicadores: {
    ipca: { valor: 0.32, acumulado12m: 4.87, data: "2026-07-01" },
    ibovespa: { valor: 171032.4, data: "2026-08-22", var12m: { pct: 23.9612, de: "2025-08-22" }, var1sem: { pct: 2.4489, de: "2026-08-14" } },
    usdbrl: { valor: 5.28714, changePct: 0.1234, data: "2026-08-20", var12m: null, var1sem: { pct: -0.35, de: "2026-08-14" } },
    cdi: { valor: 14.65, data: "2026-08-20" },
    selic: { valor: 14.75, data: "2026-08-20", decisao: { vigenteDesde: "2026-06-18", variacaoPP: -0.25 } },
  },
};
const titulosFake = [
  { slug: "ipca-2035-05-15", nome: "Tesouro IPCA+ 2035", tipo: "ipca", vencimento: "2035-05-15", comCupom: false, destaque: true, taxa: 7.93, pu: 2446.97, data: "2026-08-20", duration: { macaulayAnos: 8.734, modificada: 8.093, variacaoPrecoMais1pp: -7.73 } },
  { slug: "selic-2029-03-01", nome: "Tesouro Selic 2029", tipo: "selic", vencimento: "2029-03-01", comCupom: false, destaque: false, taxa: 0.03, pu: 19697.85, data: "2026-08-20", duration: { macaulayAnos: null } },
];
const painelFake = ponteMod.montarPainel({ titulos: titulosFake, macro: macroFake, agora: "2026-08-22T22:00:00.000Z" });
conferir(painelFake.acompanhados.length === 1, "painel leva só os títulos em destaque");
conferir(
  painelFake.acompanhados[0].taxaSignifica?.includes("ACIMA do IPCA"),
  "cada título diz o que a taxa dele significa (real x nominal x spread)"
);
conferir(painelFake.moldura.ibovespa.var12mPct === 23.96, "variação de 12 meses arredondada para o arquivo");
conferir(painelFake.moldura.usdbrl.var12mPct === null, "janela indisponível vira null (nunca estimada)");
conferir(painelFake.moldura.selic.vigenteDesde === "2026-06-18", "Selic carrega a data de vigência da decisão");
conferir(painelFake.moldura.eurbrl === null, "indicador ausente da moldura vira null, não some do formato");
// Serializa e volta: o arquivo tem de sobreviver ao round-trip.
const voltou = JSON.parse(JSON.stringify(painelFake));
conferir(voltou.moldura.cdi.pctAoAno === 14.65, "painel.json serializa e volta inteiro");
const mdPainel = ponteMod.markdownDoPainel(painelFake);
conferir(mdPainel.startsWith("# Painel"), "markdownDoPainel devolve texto");
conferir(!mdPainel.includes("undefined") && !mdPainel.includes("[object"), "markdown do painel sem `undefined`");
conferir(mdPainel.includes("| Ibovespa |"), "tabela da moldura traz o Ibovespa");

console.log("\nregra dos três lugares (datalayer + api/ + devApi)");
{
  // LACUNA QUE EU CAÍ DENTRO em 25/10/2026: acrescentei a rota /api/futuros ao
  // devApi e esqueci de importar getFuturos. A regra dos três lugares olhava a
  // rota e o arquivo em api/, não o import — então o CI passou e só o
  // `npm run dev` teria quebrado, com ReferenceError em tempo de requisição. A
  // fumaça também não pega: ela serve /api direto do datalayer, sem passar
  // pelo vite.
  const vite = await ler("vite.config.js");
  const importado = new Set((vite.match(/import \{([^}]+)\} from "\.\/server\/datalayer\.js"/)?.[1] || "").split(",").map((x) => x.trim()));
  const chamadas = [...vite.matchAll(/url\.pathname === "\/api\/[a-z]+"\)\s*return send\(200, await (\w+)\(/g)].map((m) => m[1]);
  const semImport = chamadas.filter((f) => !importado.has(f));
  conferir(chamadas.length >= 5, `${chamadas.length} rotas do devApi conferidas`);
  conferir(semImport.length === 0, `toda função chamada pelo devApi está importada${semImport.length ? ` (falta ${semImport.join(", ")})` : ""}`);
}
const vite = await ler("vite.config.js");
for (const nome of ROTAS) {
  const rota = nome.replace(/^get/, "").toLowerCase();
  const temArquivo = await ler(`api/${rota}.js`).then(() => true).catch(() => false);
  conferir(temArquivo, `api/${rota}.js existe (função da Vercel)`);
  conferir(vite.includes(`/api/${rota}`), `devApi() serve /api/${rota}`);
  // `includes` aqui é fraco de propósito: ele casa com a linha da ROTA
  // também. Quem confere o import de verdade é o bloco acima, que lê a
  // lista de nomes importados — esta linha sobrevive só como sinal de que
  // o nome aparece em algum lugar do arquivo.
  conferir(vite.includes(nome), `vite.config.js menciona ${nome}`);
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
// O rastreador da Vercel (@vercel/nft) só empacota um JSON quando o caminho
// está LITERAL dentro do require(). Um helper `carregar(caminho)` passa no
// build, passa nos testes locais (os arquivos estão no disco) e falha só em
// produção — o app sobe em "aguardando coleta" para sempre. Já aconteceu aqui.
console.log("\nrequires de dados/ são literais (rastreáveis pela Vercel)");
const cacheSrc = await ler("server/cache.js");
const requires = [...cacheSrc.matchAll(/require\(([^)]*)\)/g)].map((m) => m[1].trim());
const naoLiterais = requires.filter((a) => !/^["'][^"']+["']$/.test(a));
conferir(requires.length >= 3, `${requires.length} require(...) em cache.js`);
conferir(
  naoLiterais.length === 0,
  `todo require() usa caminho literal${naoLiterais.length ? ` — variável em: ${naoLiterais.join(", ")}` : ""}`
);
for (const arq of ["../dados/historico.json", "../dados/ntnb.json", "../dados/global.json"]) {
  conferir(cacheSrc.includes(`require("${arq}")`), `cache.js exige ${arq} por literal`);
}

// Segunda linha de defesa do mesmo perigo. O require literal manda o rastreador
// enxergar os JSON; o includeFiles manda incluí-los de qualquer jeito. Duas
// garantias baratas para uma falha que NÃO aparece localmente: build, verificar
// e pré-voo do handler passam todos, e só a produção fica vazia.
//
// O PADRÃO É "api/*.js", NÃO "api/**/*.js": as funções são todas planas em
// api/, e a Vercel FALHA O BUILD quando um padrão de `functions` não casa com
// nenhuma função ("The pattern ... doesn't match any Serverless Functions").
// Com `**` isso depende de a implementação aceitar zero segmentos — risco sem
// ganho nenhum aqui. Se algum dia surgir api/sub/algo.js, acrescente uma
// entrada em vez de trocar por `**`.
const vercelCfg = JSON.parse(await ler("vercel.json"));
const padroes = Object.keys(vercelCfg?.functions || {});
const funcoesApi = (await readdir(join(RAIZ, "api"))).filter((f) => f.endsWith(".js"));
conferir(padroes.includes("api/*.js"), `vercel.json usa o padrão api/*.js (achou: ${padroes.join(", ") || "nenhum"})`);
conferir(
  funcoesApi.every((f) => !f.includes("/")),
  `as ${funcoesApi.length} funções são planas em api/, que é o que api/*.js cobre`
);
const incl = vercelCfg?.functions?.["api/*.js"]?.includeFiles;
conferir(incl === "dados/**", `vercel.json inclui dados/ no pacote das funções (includeFiles: ${JSON.stringify(incl)})`);

console.log("\nagendamento da coleta");
// O GitHub ATRASA ou DESCARTA execuções agendadas sob carga, e o pico é a
// virada da hora. Com "0 13,22" isto aconteceu de verdade: a coleta de 26/08
// 22:00 saiu 4h23 atrasada e as de 27 e 28/08 às 13:00 nunca rodaram — o app
// passou dois dias com preço velho enquanto o job aparecia "verde". Estas duas
// checagens travam a regra aprendida ali.
const wf = await ler(".github/workflows/coletar-tesouro.yml");
const crons = [...wf.matchAll(/^\s*-\s*cron:\s*"([^"]+)"/gm)].map((m) => m[1]);
conferir(crons.length === 1, `um cron declarado (${crons.join(" | ") || "nenhum"})`);
const [minuto, horas] = (crons[0] || "").split(/\s+/);
conferir(minuto !== "0" && minuto !== "*", `cron fora da virada da hora (minuto ${minuto})`);
conferir(
  (horas || "").split(",").filter(Boolean).length >= 4,
  `pelo menos 4 janelas por dia, para uma execução perdida não custar o dia (horas: ${horas})`
);

// Botão de "rodar agora": sem ele, execução perdida por fonte fora do ar só se
// recupera esperando a próxima janela. Exatamente UMA vez — chave repetida em
// YAML é ambígua e o GitHub pode recusar o arquivo inteiro, o que é pior que a
// falta do gatilho (foi o que quase entrou ao acrescentá-lo sem olhar o resto).
const nDispatch = (wf.match(/^\s*workflow_dispatch:/gm) || []).length;
conferir(nDispatch === 1, `workflow_dispatch declarado uma única vez (${nDispatch})`);

// FONTE FORA DO AR NÃO É DEFEITO, formato quebrado É. O coletor tem de separar
// os dois: uma recusa de conexão só reprova depois de dias sem coleta, mas um
// arquivo que chega e não se entende reprova na hora.
const coletor = await ler(".github/scripts/coletar-tesouro.mjs");
const limite = coletor.match(/LIMITE_DIAS_FONTE_FORA\s*=\s*(\d+)/)?.[1];
conferir(!!limite, `tolerância a fonte fora do ar declarada (${limite} dias)`);
// Recorta o bloco catch inteiro e confere os DOIS desfechos dentro dele, em vez
// de adivinhar uma distância em caracteres — o primeiro palpite deu 700 e o
// exit(0) estava logo depois disso, reprovando um código correto.
const catchFonte = coletor.slice(coletor.indexOf("} catch (erro) {"), coletor.indexOf("// ---------- 2."));
conferir(/process\.exit\(0\)/.test(catchFonte), "fonte inalcançável dentro do limite sai com sucesso");
conferir(/process\.exit\(1\)/.test(catchFonte), "fonte inalcançável além do limite ainda reprova");
conferir(
  catchFonte.indexOf("process.exit(1)") < catchFonte.indexOf("process.exit(0)"),
  "reprova só quando passa do limite; o sucesso é o caminho de saída"
);
conferir(
  /series\.size === 0\) \{[\s\S]{0,200}?process\.exit\(1\)/.test(coletor),
  "formato irreconhecível continua fatal, sem tolerância"
);
// O AVISO tem de ser gritado, não sussurrado: é o único sinal de que a coleta
// não rodou num dia em que o job aparece verde.
conferir(/console\.warn\(/.test(coletor), "a saída tolerante avisa alto (console.warn)");

// dados/ é versionado DE PROPÓSITO — é a ponte inteira. Ignorá-lo esvazia a
// produção e deixa o dev perfeito, que é o pior formato possível de defeito.
for (const arq of [".gitignore", ".vercelignore"]) {
  const txt = await ler(arq).catch(() => null);
  if (txt === null) continue;
  const ignora = txt
    .split("\n")
    .map((l) => l.trim())
    .some((l) => l && !l.startsWith("#") && /^\/?dados(\/|$|\*)/.test(l));
  conferir(!ignora, `${arq} não ignora dados/`);
}

// E VERSIONADO NÃO BASTA: o arquivo precisa ENTRAR NO COMMIT. O coletor grava
// em dados/ no runner, e o que não estiver no `git add` do workflow morre com a
// máquina — coleta verde, log dizendo "gravado", e nada chega à produção. Foi
// exatamente o que aconteceu com futuros.json na primeira execução real: as 44
// taxas de DI1 e as 43 de FRC foram lidas, conferidas e jogadas fora.
// A lista é derivada do coletor, não escrita à mão, senão o próximo arquivo
// novo repete o mesmo silêncio.
const gravados = new Set();
const constantes = new Map(
  [...coletor.matchAll(/const (ARQ_\w+) = join\(DIR, "([^"]+)"\)/g)].map((m) => [m[1], m[2]])
);
for (const m of coletor.matchAll(/writeFile\(\s*(?:join\(DIR, "([^"]+)"\)|(ARQ_\w+))/g)) {
  const nome = m[1] || constantes.get(m[2]);
  if (nome) gravados.add(`dados/${nome}`);
}
conferir(gravados.size >= 8, `o coletor grava ${gravados.size} arquivos em dados/`);
const linhaAdd = wf.match(/^\s*git add (.+)$/m)?.[1] || "";
const adicionados = new Set(linhaAdd.split(/\s+/).filter(Boolean));
for (const arq of [...gravados].sort()) {
  conferir(adicionados.has(arq), `${arq} entra no git add do workflow`);
}

console.log("\ncurva: ponta curta e inflação implícita");
const curva = await datalayer.getCurva();
for (const c of curva.curvas) {
  if (!c.agora.length) continue;
  // O corte de prazo mínimo vale para as TRÊS curvas. Se a histórica voltar a
  // ser montada só com os títulos vivos HOJE, a ponta curta dela salta ~1 ano
  // e a comparação passa a medir o recorte em vez do mercado.
  const curto = (s) => (s.length ? s[0].anos : null);
  for (const [nome, serie] of [["1 mês", c.umMesAtras], ["1 ano", c.umAnoAtras]]) {
    if (!serie.length) continue;
    conferir(curto(serie) >= 1.5, `${c.id}/${nome}: ponta curta em ${curto(serie).toFixed(2)}a respeita o prazo mínimo`);
  }
  conferir(
    c.agora.every((p) => p.anos >= 1.5),
    `${c.id}: nenhum ponto de curva abaixo de 1,5a (onde a taxa anualizada explode)`
  );
}

// O eixo de duration só é honesto se cada ponto trouxer a SUA duration, medida
// na data da própria curva. Duas identidades que o garantem: zero-cupom tem
// duration igual ao prazo, e com cupom é sempre estritamente menor.
for (const c of curva.curvas) {
  if (!c.agora.length) continue;
  conferir(
    c.agora.every((p) => p.duration != null && p.duration > 0),
    `${c.id}: todo ponto da curva traz duration`
  );
  const zeros = c.agora.filter((p) => !p.comCupom);
  const cupons = c.agora.filter((p) => p.comCupom);
  conferir(
    zeros.every((p) => Math.abs(p.duration - p.anos) < 0.02),
    `${c.id}: zero-cupom tem duration = prazo (${zeros.length} pontos)`
  );
  conferir(
    cupons.every((p) => p.duration < p.anos),
    `${c.id}: com cupom tem duration < prazo (${cupons.length} pontos)`
  );
}
// A duration de um mesmo título encurta conforme a data avança. Se a curva
// histórica reaproveitasse a duration de hoje, a linha inteira sairia deslocada
// no eixo — justamente o que se quer comparar.
{
  const c = curva.curvas.find((x) => x.agora.length && x.umAnoAtras.length);
  const par = c && c.agora.find((p) => c.umAnoAtras.some((q) => q.slug === p.slug));
  if (par) {
    const antes = c.umAnoAtras.find((q) => q.slug === par.slug);
    conferir(
      antes.duration > par.duration,
      `duration é da data da curva, não de hoje (${par.slug}: ${antes.duration}a há um ano vs ${par.duration}a hoje)`
    );
  }
}

// Fisher, não subtração: a 14,33% nominal e 7,57% real a diferença entre as
// duas contas passa de 0,4pp — no número que decide entre IPCA+ e Prefixado.
const imp = curva.implicita?.agora || [];
if (imp.length) {
  const p = imp[imp.length - 1];
  const fisher = ((1 + p.nominal / 100) / (1 + p.real / 100) - 1) * 100;
  conferir(Math.abs(p.taxa - fisher) < 0.011, `inflação implícita usa Fisher, não subtração (${p.taxa}% vs ${(p.nominal - p.real).toFixed(2)}% subtraindo)`);
  conferir(
    imp.every((x) => x.anos >= 1.5 && x.nominal != null && x.real != null),
    `os ${imp.length} pontos implícitos trazem os dois lados da conta`
  );
} else {
  avisar("inflação implícita sem pontos — as duas famílias precisam se sobrepor em prazo");
}

console.log("\nrótulo real x nominal na Calculadora");
// A taxa de um IPCA+ é REAL e a de um prefixado é NOMINAL — a tela dizia
// "taxa real" nos dois casos, em quatro lugares. Agora vem tudo de um
// `rotuloTaxa` derivado do tipo, e esta checagem impede que alguém volte a
// escrever a palavra à mão num deles.
const calcSrc = await ler("src/components/Calculadora.jsx");
// Ficam de fora os comentários (onde os dois termos são explicados de
// propósito) e a própria linha que define `rotuloTaxa` — o único lugar do
// arquivo onde as duas palavras têm de estar escritas.
const calcSemComentarios = calcSrc
  .split("\n")
  .filter((l) => !l.trim().startsWith("//") && !/const rotuloTaxa\s*=/.test(l))
  .join("\n");
conferir(/const rotuloTaxa\s*=/.test(calcSrc), "Calculadora deriva rotuloTaxa do tipo do título");
for (const termo of ["taxa real", "taxa nominal"]) {
  const n = (calcSemComentarios.match(new RegExp(termo, "g")) || []).length;
  conferir(n === 0, `"${termo}" não aparece escrito à mão na Calculadora (achou ${n})`);
}

console.log("\npiso de texto e gráficos em pixels reais");
// NADA ABAIXO DE 12px. Em 11/2026 havia 10 e 11px em dezenas de lugares (60 só
// na aba Títulos) e 9 nos eixos dos gráficos. O piso só se mantém se uma
// regra nova a 11px reprovar aqui — a olho, um pixel a menos nunca parece
// errado, e é assim que eles voltam um a um.
{
  const { readdir } = await import("node:fs/promises");
  const css = await ler("src/styles.css");
  const noCss = [...css.matchAll(/font(?:-size)?:[^;{}]*?\b(\d+(?:\.\d+)?)px/g)].map((m) => Number(m[1])).filter((n) => n < 12);
  conferir(noCss.length === 0, `nenhum font-size abaixo de 12px no styles.css (achou ${noCss.join(", ") || "nenhum"})`);
  const pequenosJsx = [];
  for (const arq of (await readdir(join(RAIZ, "src/components"))).filter((a) => a.endsWith(".jsx"))) {
    const src = await ler(`src/components/${arq}`);
    for (const m of src.matchAll(/fontSize[=:]\s*\{?\s*"?(\d+(?:\.\d+)?)\b/g)) if (Number(m[1]) < 12) pequenosJsx.push(`${arq}: ${m[1]}`);
  }
  conferir(pequenosJsx.length === 0, `nenhum fontSize abaixo de 12 escrito nos componentes (achou ${pequenosJsx.join("; ") || "nenhum"})`);
  // O piso só vale nos gráficos porque eles são desenhados na largura medida.
  // Com o quadro fixo de antes, "12" virava 10px no celular e 39px no monitor.
  for (const arq of ["GraficoTaxa.jsx", "CurvaChart.jsx"]) {
    const src = await ler(`src/components/${arq}`);
    conferir(/useLarguraMedida\(/.test(src), `${arq} desenha na largura medida (uma unidade = um pixel)`);
    conferir(/<svg ref=\{ref\}[^>]*width=\{width\}/.test(src), `${arq}: o SVG leva a largura medida como atributo`);
  }
  // O campo de texto a menos de 16px faz o Safari do iPhone dar zoom na página.
  const regraCampo = css.match(/\.input, \.select \{[^}]*\}/)?.[0] || "";
  conferir(/font-size: 16px/.test(regraCampo), "campos de texto a 16px (abaixo disso o iPhone dá zoom ao focar)");
}

console.log("\nlegenda da curva");
// A legenda desenhava um retângulo sólido para as três séries — a de um ano
// atrás é TRACEJADA no gráfico e saía igual às outras na legenda, distinguível
// só pela cor, num quadradinho de 14x3px. Agora ela vem do CurvaLegenda, que lê
// a mesma lista `series` e desenha o mesmo traço. Duas coisas a manter:
// nenhuma amostra pintada à mão no Curva.jsx, e todo item de série com rótulo.
const curvaSrc = await ler("src/components/Curva.jsx");
const chartSrc = await ler("src/components/CurvaChart.jsx");
conferir(
  /<CurvaLegenda\s/.test(curvaSrc) && !/className="legenda"/.test(curvaSrc),
  "Curva.jsx usa <CurvaLegenda> em vez de montar a legenda à mão"
);
const seriesDeclaradas = curvaSrc.match(/\{\s*id:\s*"[^"]+",[^}]*pontos:[^}]*\}/g) || [];
conferir(seriesDeclaradas.length >= 6, `séries da curva encontradas (${seriesDeclaradas.length})`);
for (const linha of seriesDeclaradas) {
  const id = linha.match(/id:\s*"([^"]+)"/)?.[1];
  conferir(/rotulo:\s*"/.test(linha), `série ${id} traz rotulo para a legenda`);
}
// O vão do tracejado tem de SOBREVIVER à espessura do traço. A ponta redonda
// estica cada traço em strokeWidth/2 de cada lado, então come strokeWidth
// inteiro do vão declarado: a legenda desenha a 2.4px e, com o "4 3" do
// gráfico, sobrava 0,6px de vão — sólido a olho nu num celular, que é
// justamente o defeito que a legenda nova veio corrigir. Esta checagem calcula
// o vão que de fato aparece nos dois lugares e exige que dê para ver.
const vaoVisivel = (par, espessura, ponta) => {
  const [traco, vao] = par.split(/\s+/).map(Number);
  return { traco: traco + (ponta === "round" ? espessura : 0), vao: vao - (ponta === "round" ? espessura : 0) };
};
const parDe = (nome) => chartSrc.match(new RegExp(`export const ${nome}\\s*=\\s*"([^"]+)"`))?.[1];
const parGrafico = parDe("TRACEJADO");
const parLegenda = parDe("TRACEJADO_LEGENDA");
conferir(!!parGrafico && !!parLegenda, `os dois pares de tracejado existem (${parGrafico} / ${parLegenda})`);
// A legenda usa ponta reta justamente para o vão declarado ser o vão visível.
const legendaPontaReta = /strokeLinecap=\{s\.tracejado \? "butt" : "round"\}/.test(chartSrc);
conferir(legendaPontaReta, "a linha tracejada da legenda usa ponta reta (butt)");
for (const [onde, par, espessura, ponta] of [
  ["gráfico", parGrafico, 1.4, "round"],
  ["legenda", parLegenda, 2.4, legendaPontaReta ? "butt" : "round"],
]) {
  if (!par) continue;
  const v = vaoVisivel(par, espessura, ponta);
  conferir(v.vao >= 1.5, `${onde}: vão visível do tracejado ${v.vao.toFixed(1)}px (>= 1.5)`);
}
// E a amostra tem de ser larga o bastante para caber traço suficiente: com
// menos de três traços a linha não se lê como tracejada.
const cssLegenda = (await ler("src/styles.css")).match(/\.legenda-traco\s*\{[^}]*width:\s*(\d+)px/)?.[1];
const periodo = parLegenda ? parLegenda.split(/\s+/).map(Number).reduce((a, b) => a + b, 0) : 0;
conferir(
  cssLegenda && periodo && (Number(cssLegenda) - 2) / periodo >= 2.5,
  `amostra de ${cssLegenda}px cabe ${((Number(cssLegenda) - 2) / periodo).toFixed(1)} traços`
);

console.log("\nfamílias separadas na curva");
// A polilinha única costurava DUAS curvas. Cinco vencimentos da NTN-B existem
// com e sem cupom na mesma data e com taxas diferentes, então a linha pulava na
// vertical no mesmo x, ida e volta — o serrilhado era o desenho, não o mercado.
// Primeiro: provar que a causa continua nos dados (se um dia sumir, o motivo
// desta separação sumiu junto e o comentário passa a mentir).
// Depois de separar as QUATRO curvas, nenhuma delas mistura famílias — então a
// prova de que a separação se justifica não pode mais sair de uma curva
// isolada. Sai da UNIÃO de cada par: se existe prazo em que as duas formas
// coexistem com taxas diferentes, ligá-las numa linha só era o defeito.
const PARES = [
  ["ipca-sem-cupom", "ipca-com-cupom"],
  ["pre-sem-cupom", "pre-com-cupom"],
];
for (const [semId, comId] of PARES) {
  const sem = curva.curvas.find((c) => c.id === semId)?.agora || [];
  const com = curva.curvas.find((c) => c.id === comId)?.agora || [];
  const porPrazo = new Map();
  for (const p2 of [...sem, ...com]) {
    const k = p2.anos.toFixed(2);
    (porPrazo.get(k) || porPrazo.set(k, []).get(k)).push(p2);
  }
  const coincidem = [...porPrazo.values()].filter((g) => new Set(g.map((x) => x.comCupom)).size > 1);
  const divergem = coincidem.filter((g) => new Set(g.map((x) => x.taxa)).size > 1);
  conferir(
    coincidem.length >= 1,
    `${semId.split("-")[0]}: ${coincidem.length} prazo(s) com as duas formas — é o que justifica separar`
  );
  conferir(
    divergem.length >= 1,
    `${semId.split("-")[0]}: nesses prazos as taxas de fato diferem (${divergem.length})`
  );
}
// Cada curva carrega UMA família só, e a família que o nome promete.
for (const c of curva.curvas) {
  const familias = new Set(c.agora.map((p) => p.comCupom));
  conferir(familias.size === 1, `${c.id}: uma família só na curva (${[...familias].join("/")})`);
  conferir([...familias][0] === c.id.endsWith("com-cupom"), `${c.id}: a família é a que o nome promete`);
}
conferir(curva.curvas.length === 4, `quatro curvas na tela (${curva.curvas.map((c) => c.id).join(", ")})`);

// A implícita continua saindo da curva real INTEIRA, não de metade dela: ela
// tem de alcançar prazos que só existem numa das duas famílias.
const prazosImp = new Set((curva.implicita?.agora || []).map((p) => p.anos.toFixed(2)));
const soSemCupom = new Set(
  (curva.curvas.find((c) => c.id === "ipca-sem-cupom")?.agora || []).map((p) => p.anos.toFixed(2))
);
conferir(prazosImp.size >= 2, `inflação implícita com ${prazosImp.size} prazos`);
conferir(
  [...prazosImp].some((a) => !soSemCupom.has(a)),
  "a implícita usa a curva real inteira, não só a sem cupom"
);
// E o mesmo do lado NOMINAL. Esta é a regressão que a separação da prefixada
// quase causou: a implícita lia `curvas.find(id === "prefixada")`, que deixou
// de existir ao virar dois quadros — teria devolvido undefined e a curva
// implícita inteira sumiria, sem erro. Agora ela lê TIPOS_PREFIXADA, e isto
// prova que os dois lados nominais entraram: há mais prazos na implícita do
// que em qualquer das duas curvas prefixadas isolada.
const preSem = curva.curvas.find((c) => c.id === "pre-sem-cupom")?.agora?.length ?? 0;
const preCom = curva.curvas.find((c) => c.id === "pre-com-cupom")?.agora?.length ?? 0;
conferir(
  prazosImp.size > Math.max(preSem, preCom) - 1 && prazosImp.size > 1,
  `a implícita usa as duas curvas prefixadas (${prazosImp.size} prazos vs ${preSem}/${preCom})`
);
// Sem `comCupom` booleano em todo ponto o separador jogaria tudo num grupo só e
// a linha voltaria a costurar as duas famílias, calada.
for (const c of curva.curvas) {
  const semCampo = c.agora.filter((p2) => typeof p2.comCupom !== "boolean").length;
  conferir(semCampo === 0, `${c.id}: todo ponto traz comCupom booleano (${semCampo} sem)`);
}
// E o gráfico tem de de fato separar: uma polilinha POR grupo, e os marcadores
// vindos da lista inteira — uma família com um ponto só não vira linha, mas o
// título não pode sumir da tela por causa disso.
conferir(/export function separarFamilias/.test(chartSrc), "CurvaChart exporta separarFamilias");
conferir(
  /separarFamilias\(s\.pontos\)\.map\(/.test(chartSrc),
  "cada série vira uma polilinha por família"
);
conferir(
  /s\.forte &&\s*\n?\s*s\.pontos\.map\(/.test(chartSrc),
  "os marcadores saem da lista completa de pontos, não dos grupos"
);

console.log("\nvigência das decisões de política monetária");
// O BCE anuncia a mudança antes de ela valer, então a série traz a linha com
// data de efeito FUTURA — e a tela escrevia "vigente desde 16/09" num dia
// 13/09. A taxa mostrada continua sendo a nova, de propósito; o que muda é a
// preposição. format.js não importa nada, então dá para exercitar a função de
// verdade em vez de casar regex com o texto.
const fmt = await import("../src/format.js");
conferir(typeof fmt.vigencia === "function", "format.js exporta vigencia()");
const casos = [
  ["2026-09-16", "2026-09-13", "a partir de 16/09/2026", "data futura"],
  ["2026-09-13", "2026-09-13", "vigente desde 13/09/2026", "hoje já vale"],
  ["2025-12-11", "2026-09-13", "vigente desde 11/12/2025", "data passada"],
];
for (const [iso, hoje, esperado, nome] of casos) {
  const got = fmt.vigencia(iso, hoje);
  conferir(got === esperado, `${nome}: "${got}"`);
}
conferir(fmt.vigencia(null) === "", "sem data devolve string vazia");
// O fuso importa: às 21h de São Paulo o toISOString() já virou o dia e uma
// taxa que passou a valer hoje apareceria como futura.
conferir(/America\/Sao_Paulo/.test(await ler("src/format.js")), "hojeSP compara no fuso de São Paulo");
// E a tela tem de usar a função, não escrever a preposição à mão.
const mercadoSrc = await ler("src/components/Mercado.jsx");
const mercadoSemComentarios = mercadoSrc
  .split("\n")
  .filter((l) => !l.trim().startsWith("//"))
  .join("\n");
conferir(/vigencia\(/.test(mercadoSrc), "Mercado usa vigencia()");
conferir(
  !/vigente desde/.test(mercadoSemComentarios),
  '"vigente desde" não aparece escrito à mão no Mercado'
);

console.log("\ngrade do Mercado");
const { INDICES, indicePorId, IBOVESPA, JUROS_DIARIOS } = await import("../server/catalogo.js");
// Um símbolo errado não dá erro: o Yahoo devolve 404, o allSettled engole e a
// linha some da tela sem explicação. Então pelo menos o que dá para checar sem
// rede: ids e símbolos únicos, e o Ibovespa derivado da mesma lista.
conferir(INDICES.length >= 5, `${INDICES.length} índices no catálogo`);
conferir(new Set(INDICES.map((i) => i.id)).size === INDICES.length, "ids de índice únicos");
conferir(new Set(INDICES.map((i) => i.simbolo)).size === INDICES.length, "símbolos de índice únicos");
for (const i of INDICES) {
  conferir(/^\^[A-Z0-9]+$/.test(i.simbolo), `${i.id}: símbolo com forma de índice (${i.simbolo})`);
  conferir(Number.isInteger(i.casas), `${i.id}: casas decimais declaradas`);
}
conferir(IBOVESPA === indicePorId.ibovespa, "IBOVESPA deriva de INDICES, não é uma segunda definição");
// As séries diárias existem para compor RETORNO e são outras que as de MACRO
// (nível anualizado). Se alguém as igualar, a coluna vira variação do nível.
for (const j of JUROS_DIARIOS) {
  conferir(j.serie !== (await import('../server/catalogo.js')).macroPorId[j.id]?.serie, `${j.id}: série diária (${j.serie}) difere da série de nível`);
}

const mercSrcBase = await ler("src/components/Mercado.jsx");

// A aritmética das janelas, com fixture — é onde um erro passa calado.
const { janelasDePreco, janelasDeRetorno, JANELAS } = datalayer;
conferir(JANELAS.length === 5, `cinco janelas: ${JANELAS.join(", ")}`);

// Série de preço subindo 0,05% por dia útil, dois anos.
const serieSint = [];
{
  let v = 100;
  let d = new Date(Date.UTC(2024, 8, 1));
  const fim = new Date(Date.UTC(2026, 8, 11));
  while (d <= fim) {
    const wd = d.getUTCDay();
    if (wd !== 0 && wd !== 6) {
      v *= 1.0005;
      serieSint.push({ date: d.toISOString().slice(0, 10), close: Number(v.toFixed(4)) });
    }
    d = new Date(d.getTime() + 864e5);
  }
}
const jp = janelasDePreco(serieSint);
const jr = janelasDeRetorno(serieSint.map((p) => ({ date: p.date, close: 0.05 })));
for (const k of JANELAS) {
  conferir(jp[k] && Number.isFinite(jp[k].pct), `preço: ${k} preenchido`);
  conferir(jr[k] && Number.isFinite(jr[k].pct), `retorno: ${k} preenchido`);
}
// O CRUZAMENTO que vale: um índice que sobe 0,05% ao dia e uma taxa de 0,05%
// ao dia têm de dar o mesmo em 12 meses. São dois caminhos independentes —
// razão entre dois preços de um lado, produto de 252 fatores do outro. Se um
// deles somar em vez de compor, ou errar a borda da janela, isto abre.
const difere = Math.abs(jp.var12m.pct - jr.var12m.pct);
conferir(difere < 0.05, `preço e retorno batem em 12m (${difere.toFixed(4)} p.p. de diferença)`);
conferir(jp.var12m.pct > 13 && jp.var12m.pct < 15, `12m de 0,05% ao dia útil dá ~13,9% (${jp.var12m.pct.toFixed(2)}%)`);
// Compor não é somar: 252 dias de 0,05% somam 12,6% e compõem ~13,9%.
conferir(jr.var12m.pct > 13.5, `retorno é composto, não somado (${jr.var12m.pct.toFixed(2)}% > 12,6%)`);
// A janela do ano ancora no ÚLTIMO dia do ano anterior, não no primeiro do ano.
conferir(jp.varAno.de.startsWith("2025-12"), `YTD ancora em dezembro do ano anterior (${jp.varAno.de})`);
conferir(jr.varAno.de.startsWith("2026-01"), `retorno no ano começa em janeiro (${jr.varAno.de})`);
// Série curta devolve null, nunca zero — "—" na tela é honesto, 0% mente.
const curta = serieSint.slice(-5);
conferir(janelasDePreco(curta).var12m === null, "janela sem histórico devolve null, não zero");
conferir(janelasDePreco([]).var1d === null, "série vazia não explode");

// --- A COTAÇÃO DE BASE, impressa embaixo do percentual na coluna do câmbio.
// O risco aqui não é ela sumir — é aparecer um número que NÃO foi o usado na
// conta. Ninguém confere 5,0918 de cabeça, então um base errado não seria
// pego pelo olho: daria ao percentual uma confirmação falsa. Por isso duas
// exigências, e não uma: refazer a conta a partir do par tem de devolver o
// mesmo pct, e cada valor tem de ser o fechamento do ponto daquela data.
const fechamentoEm = new Map(serieSint.map((p) => [p.date, p.close]));
for (const k of JANELAS) {
  const j = jp[k];
  const refeito = ((j.valorAte - j.valorDe) / j.valorDe) * 100;
  conferir(
    Number.isFinite(j.valorDe) && Number.isFinite(j.valorAte) && Math.abs(refeito - j.pct) < 1e-9,
    `preço: ${k} carrega o par que gerou o pct (${j.valorDe} → ${j.valorAte})`
  );
  conferir(
    fechamentoEm.get(j.de) === j.valorDe && fechamentoEm.get(j.ate) === j.valorAte,
    `preço: ${k} usa o fechamento das próprias datas (${j.de} → ${j.ate})`
  );
}
// E o RETORNO não pode carregar base nenhuma: ali os pontos são taxas diárias,
// então "de 0,05" embaixo de "+13,90%" seria a taxa de um dia posando de ponto
// de partida do acumulado — duas grandezas diferentes na mesma célula. Sem o
// campo, a célula simplesmente não desenha a segunda linha (o Cel exige
// valorDe), e é isso que mantém `mostrarBase` inofensivo se um dia alguém
// ligar a chave no grupo de juros.
for (const k of JANELAS) {
  conferir(jr[k].valorDe === undefined, `retorno: ${k} não finge ter cotação de base`);
}
// --- EUR/USD, que é CRUZAMENTO e não série própria. O risco aqui é casar por
// posição em vez de data: as duas pernas da PTAX quase sempre têm os mesmos
// dias, e o "quase" só aparece num feriado de um lado — dividindo a cotação de
// ontem pela de hoje, calado, com cara de certeza.
const pernaUsd = [
  { date: "2026-09-15", close: 5.40 },
  { date: "2026-09-16", close: 5.20 }, // dia que só existe do lado do dólar
  { date: "2026-09-17", close: 5.00 },
];
const pernaEur = [
  { date: "2026-09-15", close: 6.00 },
  { date: "2026-09-17", close: 5.00 },
];
const cruz = util.cruzarSeries(pernaUsd, pernaEur);
conferir(cruz.length === 2, `cruzamento fica só nas datas que existem dos dois lados (${cruz.length})`);
conferir(cruz.every((p) => p.date !== "2026-09-16"), "o dia sem par do outro lado não entra");
conferir(Math.abs(cruz[0].close - 0.9) < 1e-9, `5,40 / 6,00 = 0,90 (${cruz[0].close})`);
conferir(cruz[1].date === "2026-09-17" && cruz[1].close === 1, "casa por data, não por posição (senão 5,00/5,00 sairia errado)");
// E a identidade que a tela promete: dividir as duas primeiras linhas do câmbio
// dá a terceira. É o que justifica cruzar a PTAX em vez de buscar um EUR/USD de
// mercado, cotado em outro instante do dia.
const ultCruz = cruz[cruz.length - 1];
conferir(
  Math.abs(ultCruz.close - pernaUsd[2].close / pernaEur[1].close) < 1e-9,
  "a linha cruzada fecha com as duas de cima na mesma data"
);
conferir(util.cruzarSeries(null, pernaEur).length === 0 && util.cruzarSeries(pernaUsd, []).length === 0,
  "perna ausente ou vazia devolve série vazia (a linha sai como '—')");
// Divisor zero não pode virar Infinity na tela.
conferir(util.cruzarSeries([{ date: "2026-09-17", close: 5 }], [{ date: "2026-09-17", close: 0 }]).length === 0,
  "divisor zero é descartado, não vira Infinity");
// O datalayer tem de montar a linha a partir das duas pernas, e não de uma
// terceira série do SGS que não existe.
const dataSrcCruz = await ler("server/datalayer.js");
conferir(/cruzarSeries\(serieDe\.eurbrl, serieDe\.usdbrl\)/.test(dataSrcCruz), "EUR/USD sai do cruzamento das duas pernas da PTAX");
// A DIREÇÃO do par, que é o tipo de coisa que inverte numa refatoração e passa:
// 1,1464 e 0,8723 são os dois números plausíveis, e só um deles é o que o
// mercado cota. O euro vai no numerador — dólares por euro.
conferir(
  /nome: "EUR\/USD"/.test(dataSrcCruz) && !/nome: "USD\/EUR"/.test(dataSrcCruz),
  "o par é publicado como EUR/USD (dólares por euro), padrão de mercado"
);
conferir(/EUR\/USD/.test(await ler("src/components/Mercado.jsx")), "a tela explica a leitura XXX/YYY das três linhas de câmbio");

// Os três pedaços da corrente, porque quebrar um deles não quebra nada
// visível: a base só some da tela, calada. O payload declara o grupo, a tela
// lê a chave, e o CSS mantém a cotação numa linha só — foi o que faltou quando
// a base ainda dizia "de 5,1523" e a célula virava três linhas.
const dataSrc = await ler("server/datalayer.js");
conferir(/mostrarBase: true/.test(dataSrc), "datalayer marca o grupo que mostra a cotação de base");
conferir(/grupo\.mostrarBase/.test(mercSrcBase), "Mercado.jsx lê grupo.mostrarBase");
conferir(/valorDe/.test(mercSrcBase), "Mercado.jsx imprime o valorDe embaixo do percentual");
conferir(
  /\.cel-base\s*\{[^}]*white-space:\s*nowrap/.test(await ler("src/styles.css")),
  ".cel-base não quebra linha (a cotação de base cabe numa linha só)"
);

// E a tela tem de dizer que a coluna dos juros é retorno, não variação do nível.
const mercSrc = mercSrcBase;
conferir(/retorno acumulado/i.test(mercSrc), "Mercado explica que a coluna de juros é retorno acumulado");

console.log("\ninflação por região");
const { INFLACAO } = await import("../server/catalogo.js");
conferir(INFLACAO.length >= 6, `${INFLACAO.length} índices de inflação`);
conferir(new Set(INFLACAO.map((i) => i.id)).size === INFLACAO.length, "ids de inflação únicos");
for (const i of INFLACAO) {
  const fontes = [i.serie, i.fred, i.ecb].filter(Boolean);
  conferir(fontes.length === 1, `${i.id}: exatamente uma fonte declarada (${fontes.length})`);
  // `forma` decide se a conta compõe variações ou divide níveis. Trocar isso
  // não dá erro: dá um número plausível e errado — o SGS lido como índice daria
  // "variação de 0,32 para 0,41", que é uma inflação de 28%.
  const esperada = i.serie ? "variacao" : "indice";
  conferir(i.forma === esperada, `${i.id}: forma "${i.forma}" bate com a fonte (${esperada})`);
  conferir(!!i.regiao && !!i.nome && !!i.fonte, `${i.id}: região, nome e fonte preenchidos`);
}

// As duas contas de janela mensal, com fixture.
const { janelasDeIndiceMensal, janelasDeVariacaoMensal } = util;
{
  // Índice: dez/2025 = 100, +0,4% ao mês até ago/2026; ago/2025 = 96.
  const idx = [{ date: "2025-08-01", close: 96 }, { date: "2025-12-01", close: 100 }];
  let v = 100;
  for (let mm = 1; mm <= 8; mm++) { v *= 1.004; idx.push({ date: `2026-${String(mm).padStart(2, "0")}-01`, close: v }); }
  const a = janelasDeIndiceMensal(idx);
  conferir(perto(a.mes.pct, 0.4, 1e-9), `índice/mês = 0,4% (${a.mes.pct.toFixed(4)})`);
  conferir(perto(a.ano.pct, (1.004 ** 8 - 1) * 100, 1e-9), `índice/ano ancora em dezembro (${a.ano.pct.toFixed(4)}%)`);
  conferir(a.ano.de === "2025-12", `índice/ano parte de ${a.ano.de}, não de janeiro`);
  conferir(a.doze.de === "2025-08", `índice/12m parte do mesmo mês do ano passado (${a.doze.de})`);
}
{
  // Variação: 12 meses de 0,5% ao mês.
  const varm = [];
  for (let mm = 9; mm <= 12; mm++) varm.push({ date: `2025-${mm}-01`, close: 0.5 });
  for (let mm = 1; mm <= 8; mm++) varm.push({ date: `2026-${String(mm).padStart(2, "0")}-01`, close: 0.5 });
  const b = janelasDeVariacaoMensal(varm);
  conferir(b.mes.pct === 0.5, `variação/mês é o próprio mês (${b.mes.pct}%)`);
  // COMPOR, não somar: doze meses de 0,5% dão 6,1678%, e somados dariam 6,0000%.
  conferir(perto(b.doze.pct, (1.005 ** 12 - 1) * 100, 1e-9), `variação/12m composta (${b.doze.pct.toFixed(4)}% ≠ 6,0000%)`);
  conferir(b.ano.de === "2026-01", `variação/ano começa em janeiro (${b.ano.de})`);
  conferir(janelasDeVariacaoMensal(varm.slice(-3)).doze === null, "menos de 12 meses não vira janela de 12 meses");
}
conferir(janelasDeIndiceMensal([]).mes === null, "série de inflação vazia não explode");

// O csvdata do BCE traz AAAA-MM nas séries MENSAIS e AAAA-MM-DD nas diárias. A
// versão que só aceitava data completa devolvia série VAZIA para o HICP, sem
// erro — que se lê como fonte fora do ar, não como formato não previsto.
const bce = globais.parseCsvBce("KEY,TIME_PERIOD,OBS_VALUE\nICP,2026-07,127.34\nICP,2026-08,127.61");
conferir(bce.ok && bce.pontos.length === 2, `parseCsvBce lê série mensal (${bce.pontos.length} pontos)`);
conferir(bce.pontos[0].date === "2026-07-01", `mês vira dia 1º (${bce.pontos[0]?.date})`);
const bceD = globais.parseCsvBce("KEY,TIME_PERIOD,OBS_VALUE\nFM,2026-09-11,2.25");
conferir(bceD.ok && bceD.pontos[0].date === "2026-09-11", "parseCsvBce continua lendo série diária");

// Cada grupo do Mercado declara as próprias colunas.
const merc = await datalayer.getMercado();
for (const g of merc.grupos) {
  conferir(Array.isArray(g.colunas) && g.colunas.length > 0, `grupo ${g.id} declara colunas (${g.colunas?.length})`);
  conferir(typeof g.comValor === "boolean", `grupo ${g.id} diz se tem coluna de valor`);
}
const gInf = merc.grupos.find((g) => g.id === "inflacao");
conferir(gInf?.comValor === false, "inflação não mostra o nível do índice, que não diz nada");
conferir(
  gInf?.colunas.map((c) => c.id).join(",") === "mes,ano,doze",
  `inflação tem as três janelas mensais (${gInf?.colunas.map((c) => c.id).join(",")})`
);

console.log("\ncorpo do SGS: tudo que não é lista de pontos");
// O SGS devolve HTTP 200 com corpo estranho quando estrangula. A blindagem
// anterior cobria corpo não-JSON mas NÃO cobria JSON que não é lista: o
// JSON.parse aceitava um objeto, e o `.map` estourava depois, fora do laço de
// retentativa — sem retry, com "bruto.map is not a function", e engolido pelo
// allSettled. Foi assim que a série 4389 sumiu numa sonda de 14/09/2026
// enquanto a tela seguia mostrando o CDI, que vem de outra série.
const bcbProv = await import("../server/providers/bcb.js");
conferir(typeof bcbProv.interpretarCorpoSgs === "function", "bcb.js exporta interpretarCorpoSgs");
const listaBoa = bcbProv.interpretarCorpoSgs(
  JSON.stringify([{ data: "10/09/2026", valor: "13.90" }, { data: "11/09/2026", valor: "13.91" }]),
  4389
);
conferir(listaBoa.ok && listaBoa.pontos.length === 2, `lista válida vira 2 pontos (${listaBoa.pontos?.length})`);
conferir(listaBoa.pontos?.[0]?.date === "2026-09-10", `data pt-BR vira ISO (${listaBoa.pontos?.[0]?.date})`);
for (const [nome, corpo] of [
  ["objeto", JSON.stringify({ error: "limite excedido" })],
  ["null", "null"],
  ["número", "42"],
  ["não-JSON", '<?xml version="1.0"?><erro/>'],
]) {
  const r = bcbProv.interpretarCorpoSgs(corpo, 4389);
  conferir(r.ok === false, `corpo ${nome} é recusado, não explode`);
  conferir(/4389/.test(r.motivo || ""), `o erro de ${nome} nomeia a série`);
}
// Lista vazia é válida como forma, e o chamador é que decide — mas não pode ir
// para o cache, senão um soluço vira meia hora de tela vazia.
const vazia = bcbProv.interpretarCorpoSgs("[]", 12);
conferir(vazia.ok && vazia.pontos.length === 0, "lista vazia é forma válida, com zero pontos");
const bcbSrc = await ler("server/providers/bcb.js");
conferir(
  /if \(!pontos\.length\) return pontos;/.test(bcbSrc),
  "série vazia não entra no cache"
);
// E o `.map` tem de estar DENTRO da função pura, não solto depois do laço.
conferir(
  !/const pontos = await \(async/.test(bcbSrc) && /interpretarCorpoSgs\(await r\.text\(\)/.test(bcbSrc),
  "a interpretação do corpo acontece dentro do laço de retentativa"
);

console.log("\nagendamento da sonda");
const wfSonda = await ler(".github/workflows/sonda-mercado.yml");
const cronSonda = wfSonda.match(/^\s*-\s*cron:\s*"([^"]+)"/m)?.[1];
conferir(!!cronSonda, `sonda tem cron (${cronSonda || "nenhum"})`);
const [minSonda, horaSonda] = (cronSonda || "").split(/\s+/);
// Minuto 0 é o pico em que o GitHub atrasa ou descarta agendamento — a mesma
// razão de o coletor rodar no minuto 23.
conferir(minSonda !== "0" && minSonda !== "*", `sonda fora da virada da hora (minuto ${minSonda})`);
// E longe do minuto do COLETOR: os dois batem no SGS, e requisição concorrente
// ao SGS é justamente o estrangulamento que a sonda existe para detectar.
// Sondar em cima da coleta fabricaria a falha que deveria estar medindo.
const minColetor = wf.match(/^\s*-\s*cron:\s*"(\S+)/m)?.[1];
conferir(
  minSonda !== minColetor,
  `sonda (min ${minSonda}) não cai no mesmo minuto do coletor (min ${minColetor})`
);
const horasColetor = (wf.match(/^\s*-\s*cron:\s*"\S+\s+(\S+)/m)?.[1] || "").split(",");
conferir(
  !horasColetor.includes(horaSonda) || minSonda !== minColetor,
  `sonda em hora ${horaSonda}, coletor em ${horasColetor.join("/")} — sem colisão`
);
// Manual continua existindo: é como se investiga uma fonte na hora.
conferir(/workflow_dispatch:/.test(wfSonda), "sonda mantém o disparo manual");
conferir((wfSonda.match(/^\s*workflow_dispatch:/gm) || []).length === 1, "workflow_dispatch uma vez só");
// A SEGUNDA PASSAGEM no agendado é o que impede a sonda de virar email diário
// por soluço de rede — o Fed devolveu 404 em 14/09 e voltou minutos depois.
conferir(
  /if: github\.event_name == 'schedule'/.test(wfSonda) && /sleep 60/.test(wfSonda),
  "execução agendada repete antes de reprovar"
);
conferir(
  /if: github\.event_name != 'schedule'/.test(wfSonda),
  "execução manual falha na primeira, para quem está olhando ver logo"
);
conferir(/concurrency:/.test(wfSonda), "sonda não roda sobreposta consigo mesma");

console.log("\numa URL só para o SGS");
// A sonda batia em /dados/ultimos/3 e o app em /dados?dataInicial=...&dataFinal=...
// Dois endpoints diferentes do SGS, que respondem coisa diferente: em
// 15/09/2026 o `ultimos` deu 09/09 como último dia da série 4389 e o intervalo
// deu 11/09. Além de dar investigação à toa, a sonda estava abonando um caminho
// que o app não percorre — se o intervalo quebrasse e o `ultimos` seguisse de
// pé, ela diria "ok" com a tela vazia.
conferir(typeof bcbProv.urlSerie === "function", "bcb.js exporta urlSerie()");
const urlExemplo = bcbProv.urlSerie(4389, { dias: 800 });
conferir(/bcdata\.sgs\.4389\/dados\?/.test(urlExemplo), `urlSerie monta o endpoint de intervalo (${urlExemplo.slice(40, 78)})`);
conferir(/dataInicial=\d{2}\/\d{2}\/\d{4}/.test(urlExemplo), "urlSerie manda dataInicial em dd/mm/aaaa");
conferir(!/ultimos/.test(urlExemplo), "urlSerie não usa o endpoint /ultimos");
// UMA definição só: o endereço aparece montado em um lugar do server/.
// Só linhas de CÓDIGO: o cabeçalho do arquivo documenta o endpoint de
// propósito, e contar o comentário reprovaria o arquivo por estar bem escrito.
const montagens = bcbSrc
  .split("\n")
  .filter((l) => !l.trim().startsWith("//") && /api\.bcb\.gov\.br\/dados\/serie/.test(l)).length;
conferir(montagens === 1, `o endereço do SGS é montado uma vez só em bcb.js (${montagens})`);
const sondaSrc = await ler("scripts/sonda-mercado.mjs");
conferir(/urlSerie\(/.test(sondaSrc), "a sonda lê pela mesma urlSerie() do app");
conferir(
  !/api\.bcb\.gov\.br/.test(sondaSrc),
  "a sonda não monta endereço do SGS à mão"
);
// E a divergência entre as duas leituras virou checagem, não ruído.
conferir(/DIVERGE da leitura crua/.test(sondaSrc), "a sonda reprova se as duas leituras discordarem");

console.log("\nchaves de localStorage");
// Os alertas saíram de dentro da tela para src/alertas.js em 11/2026, quando o
// Painel e a navegação passaram a mostrar os atingidos.
const alertasSrc = await ler("src/alertas.js");
const destaquesSrc = await ler("src/destaques.js");
const chaveAlertas = alertasSrc.match(/CHAVE\s*=\s*"([^"]+)"/)?.[1];
const chaveDestaques = destaquesSrc.match(/CHAVE\s*=\s*"([^"]+)"/)?.[1];
conferir(!!chaveAlertas && !!chaveDestaques, "as duas chaves de localStorage foram encontradas");
conferir(chaveAlertas !== chaveDestaques, `chaves distintas (${chaveAlertas} != ${chaveDestaques})`);
const doc = await ler("CLAUDE.md");
for (const [nome, chave] of [["alertas", chaveAlertas], ["destaques", chaveDestaques]]) {
  conferir(chave && doc.includes(chave), `CLAUDE.md documenta a chave de ${nome} (${chave})`);
}

console.log("\nalertas: a regra do disparo");
// A regra saiu da tela de Alertas e passou a decidir o que o Painel e a
// navegação anunciam. Um erro aqui deixa de ser uma etiqueta trocada numa aba
// e vira o app avisando o que não aconteceu — ou calando o que aconteceu.
{
  const al = await import("../src/alertas.js");
  const acima = { slug: "x", direcao: "acima", alvo: 7 };
  const abaixo = { slug: "x", direcao: "abaixo", alvo: 7 };
  conferir(al.alertaAtingido(acima, 7.01) && !al.alertaAtingido(acima, 6.99), '"acima de" dispara acima do alvo e só acima');
  conferir(al.alertaAtingido(abaixo, 6.99) && !al.alertaAtingido(abaixo, 7.01), '"abaixo de" dispara abaixo do alvo e só abaixo');
  conferir(al.alertaAtingido(acima, 7) && al.alertaAtingido(abaixo, 7), "o alvo exato conta como atingido, nos dois sentidos");
  // Falta de dado nunca é condição satisfeita: um título sem taxa no arquivo
  // não pode acender o aviso.
  conferir(!al.alertaAtingido(acima, null) && !al.alertaAtingido(abaixo, undefined), "sem taxa não há disparo");
  conferir(!al.alertaAtingido({ direcao: "abaixo", alvo: NaN }, 5), "alvo inválido não dispara");
  const titulos = [{ slug: "a", taxa: 7.5 }, { slug: "b", taxa: 6 }];
  const lista = [
    { id: "1", slug: "a", direcao: "acima", alvo: 7 },
    { id: "2", slug: "b", direcao: "acima", alvo: 7 },
    { id: "3", slug: "venceu", direcao: "abaixo", alvo: 99 },
  ];
  const at = al.alertasAtingidos(lista, titulos);
  conferir(at.length === 1 && at[0].alerta.id === "1" && at[0].titulo.slug === "a", "atingidos trazem o alerta e o título dele");
  conferir(!at.some((x) => x.alerta.slug === "venceu"), "alerta de título que saiu da lista não dispara");
  conferir(al.alertasAtingidos(null, null).length === 0, "sem alertas nem títulos devolve lista vazia");
}

console.log("\nrota no endereço");
// O endereço é lido de fora: link guardado, link digitado, link antigo. A
// leitura tem de ABRIR O APP em qualquer caso — e nunca mandar para /api um
// "slug" que não tem cara de slug.
{
  const { lerRota, escreverRota } = await import("../src/rota.js");
  const abas = ["painel", "titulos", "curva"];
  const ler2 = (h) => lerRota(h, abas, "painel");
  conferir(ler2("").tab === "painel" && ler2("").slug === null, "sem hash abre a aba padrão");
  conferir(ler2("#/curva").tab === "curva", "#/curva abre a Curva");
  conferir(ler2("#/nao-existe").tab === "painel", "aba desconhecida cai na padrão, sem erro");
  conferir(ler2("#/titulo/tesouro-ipca-2035").slug === "tesouro-ipca-2035", "#/titulo/<slug> abre o título");
  conferir(ler2("#/titulo/../../etc").slug === null, "o que não tem cara de slug não vira título");
  conferir(ler2("#/titulo/a%20b").slug === null && ler2("#/titulo/%E0%A4%A").slug === null, "slug com espaço ou % quebrado é recusado");
  for (const r of [{ tab: "curva", slug: null }, { tab: "painel", slug: "tesouro-selic-2031" }]) {
    const volta = ler2(escreverRota(r));
    conferir(volta.slug === r.slug && (r.slug || volta.tab === r.tab), `ida e volta: ${escreverRota(r)}`);
  }
  // O gancho tem de EMPILHAR ao abrir um título e SUBSTITUIR ao trocar de aba:
  // é o que faz o Voltar fechar o título, e não refazer aba por aba.
  const gancho = await ler("src/useRota.js");
  const corpoDe = (nome) => gancho.slice(gancho.indexOf(`const ${nome} = useCallback`), gancho.indexOf("}, []);", gancho.indexOf(`const ${nome} = useCallback`)));
  conferir(/historico\("pushState"/.test(corpoDe("abrirTitulo")), "abrir um título empilha uma entrada no histórico");
  conferir(/historico\("replaceState"/.test(corpoDe("irParaAba")) && !/pushState/.test(corpoDe("irParaAba")), "trocar de aba substitui a entrada, não empilha");
}

console.log("\ndados guardados no aparelho");
// O nome do cache das respostas de /api vive em dois lugares que não se
// importam: src/api.js escreve nele, e public/sw.js tem de POUPÁ-LO quando
// limpa os caches velhos. Se os nomes divergirem não há erro nenhum — só o
// app esquecendo, a cada atualização, tudo o que guardou para mostrar offline.
{
  const apiSrc = await ler("src/api.js");
  const swSrc = await ler("public/sw.js");
  const noApi = apiSrc.match(/CACHE_DADOS\s*=\s*"([^"]+)"/)?.[1];
  const noSw = swSrc.match(/const DADOS\s*=\s*"([^"]+)"/)?.[1];
  conferir(!!noApi && noApi === noSw, `mesmo nome de cache em api.js e sw.js (${noApi} / ${noSw})`);
  conferir(/k !== CACHE && k !== DADOS/.test(swSrc), "a ativação do worker poupa o cache de dados");
  // A ordem é rede primeiro. O guardado só pode aparecer DEPOIS de o fetch
  // falhar — nunca como atalho.
  const corpo = apiSrc.slice(apiSrc.indexOf("async function getJSON"));
  conferir(corpo.indexOf("await fetch(url)") < corpo.indexOf("doAparelho(url)"), "a rede vem antes do guardado");
  conferir(/r\.status >= 500/.test(corpo), "só erro do servidor (5xx) recorre ao guardado; 4xx continua erro");
  conferir((corpo.match(/marcarDoAparelho\(url, \{ salvoEm/g) || []).length === 2, "servir do aparelho sempre avisa a tela, com a hora (sem rede e 5xx)");
}

// O aviso de dado guardado, EXERCITADO. A aba Curva faz duas buscas ao mesmo
// tempo; com o estado numa variável só, a que chegava bem apagava o aviso da
// que tinha falhado, e o App lia isso como "a rede voltou" e remontava a tela
// em laço. O que se confere aqui é o comportamento, com um fetch e um cache de
// mentira — a ordem de chegada das respostas não pode mudar o resultado.
{
  const guardado = new Map();
  const cacheFalso = {
    put: async (url, resp) => void guardado.set(url, resp),
    match: async (url) => guardado.get(url)?.clone(),
    keys: async () => [...guardado.keys()].map((u) => ({ url: `http://app${u}` })),
    delete: async (req) => guardado.delete(new URL(req.url).pathname),
  };
  const fetchDeAntes = globalThis.fetch;
  const cachesDeAntes = globalThis.caches;
  globalThis.caches = { open: async () => cacheFalso };
  let rede = {}; // url -> "ok" | 502 | 404 | "fora"
  globalThis.fetch = async (url) => {
    const como = rede[url] ?? "ok";
    if (como === "fora") throw new TypeError("sem rede");
    if (como === "ok") return { ok: true, status: 200, json: async () => ({ url, daRede: true }) };
    return { ok: false, status: como, json: async () => ({ error: "fonte fora do ar" }) };
  };
  const api = await import("../src/api.js");
  const pausa = () => new Promise((r) => setTimeout(r, 5)); // guardar() não é esperado por getJSON
  let voltas = 0;
  const desligar = api.assinarVolta(() => voltas++);

  await Promise.all([api.getCurva(), api.getFuturos()]);
  await pausa();
  conferir(api.estadoDaConexao() === null, "tudo da rede: sem aviso");

  // Uma fonte fora do ar entre duas da mesma tela — nas DUAS ordens de chegada.
  rede = { "/api/curva": 502 };
  await api.getCurva();
  await api.getFuturos();
  const falhaPrimeiro = api.estadoDaConexao();
  await api.getFuturos();
  await api.getCurva();
  const falhaDepois = api.estadoDaConexao();
  conferir(
    falhaPrimeiro?.motivo === "servidor" && falhaDepois?.motivo === "servidor",
    "uma busca que deu certo não apaga o aviso de outra que falhou (qualquer ordem de chegada)"
  );
  conferir(voltas === 0, "e isso não conta como 'a rede voltou' — era o que remontava a tela em laço");
  conferir(api.veioDoAparelho("/api/curva") && !api.veioDoAparelho("/api/futuros"), "o estado é por endereço");
  conferir(api.estadoDaConexao() === api.estadoDaConexao(), "o resumo mantém a identidade entre leituras (useSyncExternalStore)");

  // O servidor volta para aquele endereço: só então o aviso some.
  rede = {};
  await api.getCurva();
  await pausa();
  conferir(api.estadoDaConexao() === null, "o aviso some quando o PRÓPRIO endereço volta a responder");

  // Sem rede em duas telas; uma busca dá certo: a rede voltou para todas.
  rede = { "/api/curva": "fora", "/api/futuros": "fora" };
  await Promise.all([api.getCurva(), api.getFuturos()]);
  conferir(api.estadoDaConexao()?.motivo === "conexao", "sem rede: aviso de conexão");
  rede = { "/api/curva": "fora" };
  await api.getFuturos();
  conferir(voltas === 1 && api.estadoDaConexao() === null, "uma resposta boa limpa a falta de conexão das outras e avisa o App, uma vez");

  // Trocar de tela solta o que a tela anterior mostrava; os títulos ficam.
  rede = { "/api/curva": 502, "/api/titulos": 502 };
  await api.getTitulos().catch(() => {}); // ainda não guardado: vira erro, não aviso
  conferir(api.estadoDaConexao() === null, "5xx sem nada guardado é erro na tela, não aviso de dado guardado");
  rede = {};
  await api.getTitulos();
  await pausa();
  rede = { "/api/curva": 502, "/api/titulos": 502 };
  await Promise.all([api.getCurva(), api.getTitulos()]);
  api.soltarGuardados((u) => u === api.URL_TITULOS);
  conferir(api.veioDoAparelho(api.URL_TITULOS) && !api.veioDoAparelho("/api/curva"), "trocar de tela solta a tela anterior e mantém os títulos");
  // 4xx num endereço que vinha do aparelho: passa a ser erro, e o aviso sai.
  rede = { "/api/titulos": 404 };
  const erro404 = await api.getTitulos().then(() => null, (e) => e);
  conferir(erro404 instanceof Error && api.estadoDaConexao() === null, "4xx é erro, sem recorrer ao guardado nem deixar aviso para trás");

  desligar();
  globalThis.fetch = fetchDeAntes;
  if (cachesDeAntes === undefined) delete globalThis.caches;
  else globalThis.caches = cachesDeAntes;

  const appSrc = await ler("src/App.jsx");
  conferir(/assinarVolta\(/.test(appSrc) && !/estavaGuardado/.test(appSrc), "o App remonta pelo sinal de volta, não pelo aviso se apagando");
}

// ---------------------------------------------------------------
// As três janelas do cartão do Painel. O que se defende aqui é o que não dá
// erro quando quebra: uma base errada continua devolvendo um número com cara
// de certo.
console.log("\nvariação do título por janela");
{
  // Dias úteis de 03/08 a 14/08/2026 (sem feriado no meio), taxa e PU subindo.
  const dias = ["03", "04", "05", "06", "07", "10", "11", "12", "13", "14"];
  const serie = dias.map((d, i) => ({ date: `2026-08-${d}`, taxa: 7 + i * 0.01, pu: 1000 + i }));
  const v = util.variacoesDoTitulo(serie);
  conferir(
    util.JANELAS_DO_TITULO.every((j) => j.id in v) && Object.keys(v).length === util.JANELAS_DO_TITULO.length,
    `uma entrada por janela (${Object.keys(v).join(", ")})`
  );
  conferir(v["1D"].de === "2026-08-13" && perto(v["1D"].taxaPP, 0.01, 1e-9), "1 dia = último ponto contra o anterior");
  conferir(perto(v["1D"].puPct, (1 / 1008) * 100, 1e-9), "o preço varia em %, sobre o PU da base");
  // 14/08 − 7 dias = 07/08, que existe na série.
  conferir(v["1S"].de === "2026-08-07" && perto(v["1S"].taxaPP, 0.05, 1e-9), `1 semana ancora 7 dias antes (${v["1S"].de})`);
  conferir(v["1M"] === null, "série que não alcança 1 mês devolve null, não a variação desde o ponto mais antigo");

  // Segunda-feira: o "1 dia" é contra a sexta, não null.
  const ateSegunda = [...serie, { date: "2026-08-17", taxa: 7.2, pu: 1020 }];
  conferir(util.variacoesDoTitulo(ateSegunda)["1D"].de === "2026-08-14", "na segunda, 1 dia compara com a sexta");
  // Alvo em fim de semana (17/08 − 7 = 10/08 existe; 16/08 − 7 = 09/08, domingo, não).
  const ateTerca = [...ateSegunda, { date: "2026-08-18", taxa: 7.2, pu: 1021 }];
  conferir(util.variacoesDoTitulo(ateTerca)["1S"].de === "2026-08-11", "alvo existente é usado como está");
  const semODia = ateTerca.filter((p) => p.date !== "2026-08-11");
  conferir(util.variacoesDoTitulo(semODia)["1S"].de === "2026-08-10", "alvo sem preço recua para o último publicado antes");

  // Título que ficou fora de oferta: o último preço antes do buraco não é
  // "uma semana atrás".
  const comBuraco = [
    { date: "2026-03-02", taxa: 6, pu: 900 },
    { date: "2026-03-03", taxa: 6, pu: 901 },
    { date: "2026-08-13", taxa: 7, pu: 1000 },
    { date: "2026-08-14", taxa: 7.1, pu: 995 },
  ];
  const vb = util.variacoesDoTitulo(comBuraco);
  conferir(vb["1S"] === null && vb["1M"] === null, "base velha demais (título meses sem preço) vira null");
  conferir(vb["1D"] !== null, "o dia continua valendo com o buraco para trás");

  conferir(util.variacoesDoTitulo([])["1D"] === null && util.variacoesDoTitulo(null)["1M"] === null, "série vazia ou ausente: tudo null");
  const semTaxa = util.variacoesDoTitulo([{ date: "2026-08-13", taxa: null, pu: 10 }, { date: "2026-08-14", taxa: 7, pu: 11 }]);
  conferir(semTaxa["1D"].taxaPP === null && semTaxa["1D"].puPct != null, "taxa ausente na base -> taxaPP null, nunca diferença contra zero");
}

// O cupom. No dia em que ele sai do preço o PU cai 3% a 5% sem perda nenhuma;
// a tela mostrava essa queda em vermelho.
console.log("\ncupom dentro da janela");
{
  conferir(util.dataExCupom("2026-08-15") === "2026-08-14", "cupom de sábado: sai do preço na sexta");
  conferir(util.dataExCupom("2026-05-15") === "2026-05-14", "cupom em dia útil: sai do preço na VÉSPERA (liquidação em D+1)");
  conferir(util.dataExCupom("2026-01-01") === "2025-12-30", "cupom de 01/01: sai em 30/12 — 31/12 não tem preço");

  const venc = "2030-08-15";
  const antes = { date: "2026-08-13", taxa: 8.12, pu: 4566.39 };
  const ex = { date: "2026-08-14", taxa: 8.12, pu: 4427.13 };
  const depois = { date: "2026-08-17", taxa: 8.14, pu: 4425.3 };
  const comCupom = util.variacoesDoTitulo([antes, ex], { comCupom: true, vencimentoISO: venc });
  conferir(comCupom["1D"].puPct === null && comCupom["1D"].cupom === "2026-08-15", "janela com cupom: preço null e a data do cupom junto");
  conferir(perto(comCupom["1D"].taxaPP, 0, 1e-9), "a taxa atravessa o cupom normalmente");
  const semCupom = util.variacoesDoTitulo([antes, ex], { comCupom: false, vencimentoISO: venc });
  conferir(semCupom["1D"].puPct != null && semCupom["1D"].cupom === null, "título sem cupom nunca tem o preço suprimido");
  const passou = util.variacoesDoTitulo([antes, ex, depois], { comCupom: true, vencimentoISO: venc });
  conferir(passou["1D"].puPct != null && passou["1D"].cupom === null, "no pregão seguinte o preço volta");
  conferir(util.cupomNaJanela({ vencimentoISO: venc, deISO: "2026-08-14", ateISO: "2026-08-20" }) === null, "janela que começa na data-ex não contém a queda");
  conferir(util.cupomNaJanela({ vencimentoISO: venc, deISO: "2026-07-17", ateISO: "2026-08-17" }) === "2026-08-15", "janela de um mês enxerga o cupom do meio");

  // A REGRA CONTRA A REALIDADE. As checagens acima só dizem que a função faz o
  // que eu acho que ela deve fazer. Esta diz que o Tesouro concorda: em cada
  // pagamento que o histórico alcança, a queda do PU que a taxa NÃO explica
  // tem de estar exatamente na data-ex calculada.
  const hist = JSON.parse(await ler("dados/historico.json"));
  let conferidos = 0;
  const fora = [];
  for (const t of Object.values(hist.titulos || {})) {
    if (!t.comCupom) continue;
    const datas = Object.keys(t.serie).sort();
    if (datas.length < 8) continue;
    const residuo = (i) => {
      const [tx1, pu1] = t.serie[datas[i - 1]];
      const [tx2, pu2] = t.serie[datas[i]];
      if (tx1 == null || tx2 == null || !pu1 || !pu2) return null;
      const d = util.calcularDuration({ vencimentoISO: t.vencimento, comCupom: true, cupomAnual: t.cupomAnual ?? undefined, taxaReal: tx1 / 100, hojeISO: datas[i - 1] });
      if (d.modificada == null) return null;
      // Variação do preço menos o que a mudança de taxa explica.
      return ((pu2 - pu1) / pu1) * 100 + d.modificada * (tx2 - tx1);
    };
    let d = util.dataDeISO(t.vencimento);
    for (;;) {
      const cupom = d.toISOString().slice(0, 10);
      d = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() - 6, d.getUTCDate()));
      if (cupom <= datas[0]) break;
      if (cupom >= t.vencimento || cupom > datas[datas.length - 1]) continue;
      const i = datas.indexOf(util.dataExCupom(cupom));
      if (i < 1) continue; // sem preço naquele dia: nada a conferir
      let pior = null;
      for (let k = Math.max(1, i - 3); k <= Math.min(datas.length - 1, i + 3); k++) {
        const r = residuo(k);
        if (r != null && (pior == null || r < pior.r)) pior = { r, data: datas[k] };
      }
      conferidos++;
      if (!pior || pior.data !== datas[i] || pior.r > -1.5 || pior.r < -7) fora.push(`${t.tipo} ${t.vencimento} cupom ${cupom}`);
    }
  }
  if (conferidos === 0) avisar("histórico sem pagamentos de cupom para conferir a data-ex (arquivo-semente?)");
  else conferir(fora.length === 0, `data-ex bate com a queda do PU em ${conferidos} pagamentos reais${fora.length ? ` — fora: ${fora.slice(0, 3).join("; ")}` : ""}`);
}

console.log("\njanelas no payload");
{
  const tit = await datalayer.getTitulos();
  const itens = tit.categorias.flatMap((c) => c.itens);
  if (!itens.length) avisar("sem títulos no arquivo — payload das janelas não conferido");
  else {
    const ids = util.JANELAS_DO_TITULO.map((j) => j.id);
    conferir(itens.every((t) => t.variacoes && ids.every((id) => id in t.variacoes)), `todo título leva as ${ids.length} janelas`);
    conferir(
      itens.every((t) => (t.variacoes["1D"]?.taxaPP ?? null) === t.taxaVarPP && (t.variacoes["1D"]?.puPct ?? null) === t.puVarPct),
      "a variação do dia é a janela 1D, não uma segunda conta"
    );
    conferir(
      itens.every((t) => Object.values(t.variacoes).every((v) => !v || !v.cupom || v.puPct === null)),
      "onde há cupom na janela, o preço vai null"
    );
    conferir(itens.every((t) => t.comCupom || Object.values(t.variacoes).every((v) => !v || v.cupom === null)), "título sem cupom nunca acusa cupom");
  }
  // Os ids atravessam a linha server/src copiados à mão.
  const chipSrc = await ler("src/components/Chip.jsx");
  const bloco = chipSrc.slice(chipSrc.indexOf("export const PERIODOS"), chipSrc.indexOf("];", chipSrc.indexOf("export const PERIODOS")));
  const noCliente = [...bloco.matchAll(/id:\s*"([^"]+)"/g)].map((m) => m[1]);
  conferir(noCliente.join() === util.JANELAS_DO_TITULO.map((j) => j.id).join(), `PERIODOS (Chip.jsx) = JANELAS_DO_TITULO (util.js): ${noCliente.join(", ")}`);
  const painelSrc = await ler("src/components/Painel.jsx");
  const detSrc = await ler("src/components/Detalhe.jsx");
  conferir(/<ChipsDeVariacao/.test(painelSrc) && /<ChipsDeVariacao/.test(detSrc), "Painel e Detalhe usam o mesmo componente de chips (a regra do cupom vale nos dois)");
  conferir(!/puVarPct/.test(painelSrc) && !/puVarPct/.test(detSrc), "nenhuma das duas telas lê o preço do dia por fora da janela");
}

console.log("\na taxa de hoje dentro do período");
{
  const subindo = Array.from({ length: 20 }, (_, i) => i + 1);
  conferir(util.percentilDoUltimo(subindo) === 100, "hoje é a maior do período -> 100");
  conferir(util.percentilDoUltimo([...subindo].reverse()) === 0, "hoje é a menor -> 0");
  const meio = [...Array.from({ length: 19 }, (_, i) => i + 1), 10.5];
  conferir(perto(util.percentilDoUltimo(meio), (10 / 19) * 100, 1e-9), "conta só os OUTROS dias: 10 de 19 abaixo");
  conferir(util.percentilDoUltimo(Array(20).fill(7)) === 0, "empate não conta como abaixo");
  conferir(util.percentilDoUltimo(subindo.slice(0, util.MIN_PONTOS_PERCENTIL - 1)) === null, `menos de ${util.MIN_PONTOS_PERCENTIL} pontos -> null, não uma frase sobre quatro pregões`);
  conferir(util.percentilDoUltimo([null, ...subindo]) === 100 && util.percentilDoUltimo(null) === null, "nulos saem da conta; série ausente -> null");

  const tit = await datalayer.getTitulos();
  const algum = tit.categorias[0]?.itens[0];
  if (algum) {
    const det = await datalayer.getDetalhe(algum.slug, "1A");
    const p = det.estatisticas?.percentil;
    conferir(det.estatisticas && "percentil" in det.estatisticas, "getDetalhe leva o percentil nas estatísticas");
    conferir(p == null || (p >= 0 && p <= 100), `percentil entre 0 e 100 (${p == null ? "null" : p.toFixed(1)})`);
    // MAX é "sem corte". O valor dele em TF_DIAS é null, e um `??` lia esse
    // null como período desconhecido: o botão mostrava 1 ano e ninguém via,
    // porque um ano de gráfico não parece errado.
    const maisLongo = tit.categorias.flatMap((c) => c.itens).reduce((a, b) => (b.pontos > a.pontos ? b : a));
    const max = await datalayer.getDetalhe(maisLongo.slug, "MAX");
    const umAno = await datalayer.getDetalhe(maisLongo.slug, "1A");
    conferir(max.pontos.length === maisLongo.pontos, `MAX devolve a série inteira (${max.pontos.length} de ${maisLongo.pontos} pontos)`);
    if (maisLongo.pontos > 300) conferir(max.pontos.length > umAno.pontos.length, "MAX não é 1A com outro nome");
    const invalido = await datalayer.getDetalhe(maisLongo.slug, "XYZ");
    conferir(invalido.pontos.length === umAno.pontos.length, "período desconhecido continua caindo em 1A");
  }
}

// O imposto. As alíquotas são de lei — fixadas aqui para que uma mexida
// distraída na tabela falhe, em vez de mudar em silêncio um número que a
// pessoa lê como "é isso que vou receber".
console.log("\nimposto de renda no vencimento");
{
  const imp = await import("../src/impostos.js");
  conferir(
    JSON.stringify(imp.FAIXAS_IR.map((f) => [f.ateDias, f.aliquota])) === JSON.stringify([[180, 0.225], [360, 0.2], [720, 0.175], [null, 0.15]]),
    "tabela regressiva: 22,5% até 180 dias, 20% até 360, 17,5% até 720, 15% acima (Lei 11.033/2004)"
  );
  const bordas = [[1, 0.225], [180, 0.225], [181, 0.2], [360, 0.2], [361, 0.175], [720, 0.175], [721, 0.15], [9000, 0.15]];
  conferir(bordas.every(([d, a]) => imp.aliquotaIR(d) === a), "as bordas das faixas caem do lado certo (180/181, 360/361, 720/721)");
  conferir(imp.aliquotaIR(null) === null && imp.aliquotaIR(-1) === null, "prazo ausente ou negativo -> null");
  conferir(imp.diasCorridosEntre("2026-11-10", "2029-01-01") === 783, "prazo do imposto em dias CORRIDOS");
  conferir(/^\d{4}-\d{2}-\d{2}$/.test(imp.CONFERIDO_EM), `a data em que a regra foi conferida vai junto (${imp.CONFERIDO_EM})`);

  // Prefixado: R$ 1.000 a 10% por 3 anos = 1.331; 15% de 331 = 49,65.
  const pre = imp.liquidoNoVencimento({ investido: 1000, taxaAA: 0.1, anosUteis: 3, diasCorridos: 1095 });
  conferir(perto(pre.bruto, 1331, 1e-6) && perto(pre.imposto, 49.65, 1e-6) && perto(pre.liquido, 1281.35, 1e-6), `prefixado: 1.000 -> 1.331 bruto -> ${pre.liquido.toFixed(2)} líquido`);
  conferir(perto(1000 * Math.pow(1 + pre.taxaLiquidaAA, 3), pre.liquido, 1e-6), "a taxa líquida, composta pelo prazo, devolve o líquido");
  conferir(pre.taxaLiquidaAA < 0.1, "a taxa líquida fica abaixo da bruta");

  // IPCA+: o imposto é sobre o ganho NOMINAL. Conta refeita aqui, por fora.
  const r = 0.05, pi = 0.1, n = 2, dias = 730, V = 1000;
  const nominal = V * Math.pow(1 + r, n) * Math.pow(1 + pi, dias / 365);
  const esperado = (nominal - 0.15 * (nominal - V)) / Math.pow(1 + pi, dias / 365);
  const ipca = imp.liquidoNoVencimento({ investido: V, taxaAA: r, anosUteis: n, diasCorridos: dias, inflacaoAA: pi });
  conferir(perto(ipca.liquido, esperado, 1e-6), `IPCA+: imposto sobre o ganho nominal, resultado a preços de hoje (${ipca.liquido.toFixed(2)})`);
  conferir(perto(ipca.bruto, V * Math.pow(1 + r, n), 1e-6), "o bruto do IPCA+ continua a preços de hoje, igual ao cartão de cima");
  const semInflacao = imp.liquidoNoVencimento({ investido: V, taxaAA: r, anosUteis: n, diasCorridos: dias, inflacaoAA: 0 });
  const maisInflacao = imp.liquidoNoVencimento({ investido: V, taxaAA: r, anosUteis: n, diasCorridos: dias, inflacaoAA: 0.2 });
  conferir(semInflacao.liquido > ipca.liquido && ipca.liquido > maisInflacao.liquido, "mais inflação -> menos líquido real (a correção também é tributada)");
  const semInflacaoPre = imp.liquidoNoVencimento({ investido: V, taxaAA: r, anosUteis: n, diasCorridos: dias });
  conferir(perto(semInflacao.liquido, semInflacaoPre.liquido, 1e-9), "inflação zero reduz ao caso do prefixado");

  const negativa = imp.liquidoNoVencimento({ investido: 1000, taxaAA: -0.01, anosUteis: 2, diasCorridos: 730 });
  conferir(perto(negativa.imposto, 0, 1e-9) && perto(negativa.liquido, negativa.bruto, 1e-9), "sem ganho não há imposto (nem crédito)");
  conferir(imp.liquidoNoVencimento({ investido: 1000, taxaAA: 0.1, anosUteis: 0.05, diasCorridos: imp.PRAZO_IOF_DIAS - 1 }) === null, "menos de 30 dias: há IOF, a conta não sai");
  conferir(
    imp.liquidoNoVencimento({ investido: 0, taxaAA: 0.1, anosUteis: 3, diasCorridos: 1095 }) === null &&
      imp.liquidoNoVencimento({ investido: 1000, taxaAA: null, anosUteis: 3, diasCorridos: 1095 }) === null &&
      imp.liquidoNoVencimento({ investido: 1000, taxaAA: 0.1, anosUteis: 3, diasCorridos: 1095, inflacaoAA: NaN }) === null,
    "dado faltando -> null, nunca um líquido calculado com zero"
  );

  const calcFonte = await ler("src/components/Calculadora.jsx");
  conferir(/liquidoNoVencimento\(/.test(calcFonte), "a Calculadora usa a conta de impostos.js");
  conferir(/!t\.comCupom && !faltaInflacao/.test(calcFonte), "o líquido só sai para título SEM cupom e com a inflação informada");
  conferir(!/22[,.]5|17[,.]5|0[,.]20?\s*%/.test(calcFonte), "nenhuma alíquota escrita à mão na tela: os números vêm de impostos.js");
  conferir(/CONFERIDO_EM/.test(calcFonte), "a tela mostra a data em que a regra foi conferida");
}

// ---------------------------------------------------------------
// O valor de face e o que um título ainda paga — a base da Carteira. O VNA do
// IPCA+ não vem no arquivo do Tesouro: sai do PU e da taxa. O que prova que a
// conta está certa não é ela fechar consigo mesma, é TODOS os vencimentos
// darem o mesmo VNA — e a mesma conta devolver R$ 1.000 nos prefixados.
console.log("\nvalor de face e recebimentos futuros");
{
  const tit = await datalayer.getTitulos();
  const itens = tit.categorias.flatMap((c) => c.itens);
  if (!itens.length) avisar("sem títulos no arquivo — valor de face não conferido");
  else {
    const ipca = itens.filter((t) => t.tipo.startsWith("ipca") && t.face);
    const pre = itens.filter((t) => t.tipo.startsWith("prefixado"));
    const faces = ipca.map((t) => t.face.valor);
    const dispersao = faces.length ? ((Math.max(...faces) - Math.min(...faces)) / Math.min(...faces)) * 100 : null;
    conferir(
      faces.length >= 3 && dispersao < 0.2,
      `os ${faces.length} IPCA+ dão o mesmo VNA: ${Math.min(...faces).toFixed(2)} a ${Math.max(...faces).toFixed(2)} (dispersão ${dispersao?.toFixed(4)}%)`
    );
    conferir(ipca.every((t) => t.face.unidade === "hoje"), "a face de um IPCA+ é em reais de hoje");
    conferir(pre.every((t) => t.face?.valor === util.FACE_PREFIXADO && t.face.unidade === "nominal"), "a face de um prefixado é R$ 1.000, nominal");
    // O CONTROLE: a conta do VNA aplicada a quem tem face conhecida.
    const controle = pre
      .filter((t) => t.taxa != null && t.pu)
      .map((t) => (t.pu / util.precoPor100({ vencimentoISO: t.vencimento, comCupom: t.comCupom, cupomAnual: t.cupomAnual ?? undefined, taxaReal: t.taxa / 100, hojeISO: t.data })) * 100);
    conferir(
      controle.length > 0 && controle.every((v) => Math.abs(v - 1000) / 1000 < 0.0005),
      `controle: a mesma conta devolve 1.000 nos ${controle.length} prefixados (${Math.min(...controle).toFixed(3)} a ${Math.max(...controle).toFixed(3)})`
    );
    conferir(itens.filter((t) => t.tipo === "selic").every((t) => t.face === null && t.recebimentos === null), "LFT: sem face e sem recebimentos — rende a Selic que houver");

    const zero = itens.filter((t) => !t.comCupom && t.recebimentos);
    conferir(zero.every((t) => t.recebimentos.pagamentos === 0 && t.recebimentos.total === t.recebimentos.principal), "sem cupom: o que se recebe é o principal, uma vez");
    const cup = itens.filter((t) => t.comCupom && t.recebimentos);
    conferir(
      cup.length > 0 && cup.every((t) => perto(t.recebimentos.total, t.recebimentos.principal + t.recebimentos.cupom * t.recebimentos.pagamentos, 1e-6) && t.recebimentos.pagamentos >= 1),
      "com cupom: principal mais um cupom por pagamento restante"
    );
    conferir(
      cup.filter((t) => t.tipo.startsWith("prefixado")).every((t) => perto(t.recebimentos.cupom, 1000 * util.CUPOM_SEMESTRAL_NTNF, 1e-9)),
      "cupom da NTN-F: R$ 1.000 × a parcela do semestre"
    );

    // Os cupons já pagos.
    conferir(itens.every((t) => (t.comCupom ? Array.isArray(t.cuponsPagos) : t.cuponsPagos === undefined)), "cuponsPagos só nos títulos com cupom");
    const hoje = util.hojeISO();
    conferir(
      cup.every((t) => t.cuponsPagos.every((c, i, l) => c.ex < c.data && c.data <= hoje && c.data < t.vencimento && (i === 0 || l[i - 1].data < c.data))),
      "cupons pagos: em ordem, data-ex antes da data, nenhum no futuro nem no vencimento"
    );
    conferir(
      cup.filter((t) => t.tipo.startsWith("prefixado")).every((t) => t.cuponsPagos.every((c) => perto(c.valor, 1000 * util.CUPOM_SEMESTRAL_NTNF, 1e-9))),
      "cupons pagos da NTN-F têm o valor exato"
    );
    // O cupom de uma NTN-B é 2,9563% do VNA da data; como o VNA só cresce, o de
    // qualquer data passada fica abaixo do de hoje e acima da metade dele.
    const ntnb = cup.filter((t) => t.tipo.startsWith("ipca"));
    conferir(
      ntnb.every((t) => t.cuponsPagos.every((c) => c.valor == null || (c.valor < t.recebimentos.cupom * 1.001 && c.valor > t.recebimentos.cupom * 0.5))),
      "cupons pagos da NTN-B: do VNA de cada data, sempre abaixo do de hoje"
    );
  }

  // Fixture: a véspera sem preço deixa o valor null, nunca zero.
  const serie = [
    { date: "2026-01-05", taxa: 7, pu: 4300 },
    { date: "2026-08-13", taxa: 7, pu: 4500 },
    { date: "2026-08-14", taxa: 7, pu: 4370 },
    { date: "2026-11-06", taxa: 7, pu: 4400 },
  ];
  const pagos = util.cuponsPagos({ tipo: "ipca-juros", vencimentoISO: "2030-08-15", cupomAnual: 0.06, serie, hojeISO: "2026-11-10" });
  conferir(pagos.length === 2 && pagos[0].data === "2026-02-15" && pagos[1].data === "2026-08-15", `cupons dentro do alcance da série (${pagos.map((c) => c.data).join(", ")})`);
  conferir(pagos[0].valor === null && pagos[1].valor > 100, "sem preço perto da véspera o valor é null; com preço, sai do VNA");
  conferir(util.valorDeFace({ tipo: "ipca", vencimentoISO: "2035-05-15", comCupom: false, taxa: null, pu: 2500, dataISO: "2026-11-06" }) === null, "sem taxa não há face — null, não um chute");
}

// A carteira. As contas rodam no navegador, com o que a pessoa digitou; um
// erro aqui é o app dizendo a alguém que ela tem mais (ou menos) do que tem.
console.log("\ncarteira: registrar e avaliar");
{
  const pos = await import("../src/posicoes.js");
  const ltn = {
    slug: "prefixado-2029-01-01", tipo: "prefixado", vencimento: "2029-01-01", comCupom: false, data: "2026-11-06", pu: 750,
    recebimentos: { principal: 1000, cupom: 0, pagamentos: 0, total: 1000, unidade: "nominal" },
  };
  const ntnf = {
    slug: "prefixado-juros-2031-01-01", tipo: "prefixado-juros", vencimento: "2031-01-01", comCupom: true, data: "2026-11-06", pu: 900,
    recebimentos: { principal: 1000, cupom: 48.81, pagamentos: 9, total: 1439.29, unidade: "nominal" },
    cuponsPagos: [
      { data: "2025-07-01", ex: "2025-06-30", valor: 48.81 },
      { data: "2026-01-01", ex: "2025-12-30", valor: 48.81 },
      { data: "2026-07-01", ex: "2026-06-30", valor: 48.81 },
    ],
  };
  const lft = { slug: "selic-2031-03-01", tipo: "selic", vencimento: "2031-03-01", comCupom: false, data: "2026-11-06", pu: 20000, recebimentos: null };

  conferir(pos.numeroBR("1.234,56") === 1234.56 && pos.numeroBR("0,25") === 0.25 && pos.numeroBR("") === null && pos.numeroBR("abc") === null, "números digitados à brasileira; vazio e texto viram null");

  const bom = pos.montarLote({ slug: ltn.slug, data: "2025-02-03", quantidade: "6", valor: "3.900,00" }, ltn, "2026-11-10");
  conferir(bom.lote?.quantidade === 6 && bom.lote.valor === 3900 && typeof bom.lote.id === "string", "compra válida vira lote");
  const recusas = [
    [{ data: "2026-12-01", quantidade: "1", valor: "100" }, "data no futuro"],
    [{ data: "2029-06-01", quantidade: "1", valor: "100" }, "data depois do vencimento"],
    [{ data: "2025-02-03", quantidade: "0", valor: "100" }, "quantidade zero"],
    [{ data: "2025-02-03", quantidade: "1", valor: "" }, "valor vazio"],
    [{ data: "", quantidade: "1", valor: "100" }, "sem data"],
  ];
  conferir(recusas.every(([c]) => typeof pos.montarLote({ slug: ltn.slug, ...c }, ltn, "2026-11-10").erro === "string"), `recusa com mensagem: ${recusas.map((r) => r[1]).join(", ")}`);
  conferir(typeof pos.montarLote({ slug: "outro", data: "2025-02-03", quantidade: "1", valor: "100" }, ltn, "2026-11-10").erro === "string", "título que não confere com o escolhido é recusado");

  // LTN: 6 títulos por 3.900; hoje 750 cada.
  const a = pos.avaliarLote(bom.lote, ltn);
  conferir(a.valorHoje === 4500 && a.resultado === 600 && perto(a.resultadoPct, (600 / 3900) * 100), "vale hoje = quantidade × PU; resultado = hoje − investido");
  // 03/02/2025 -> 06/11/2026 são 641 dias: faixa de 17,5%.
  conferir(a.dias === 641 && a.seVender.aliquota === 0.175 && perto(a.seVender.imposto, 105) && perto(a.seVender.liquido, 4395), "se vender hoje: imposto pela faixa do tempo desde a compra, só sobre o ganho");
  conferir(a.noVencimento.valor === 6000 && a.noVencimento.unidade === "nominal", "se levar ao vencimento: R$ 1.000 por título, em reais nominais");
  // 03/02/2025 -> 01/01/2029 passa de 720 dias: 15% de (6.000 − 3.900).
  conferir(a.noVencimento.liquido.aliquota === 0.15 && perto(a.noVencimento.liquido.valor, 5685), "no prefixado sem cupom o líquido do vencimento sai exato");

  const perda = pos.avaliarLote({ ...bom.lote, valor: 5000 }, ltn);
  conferir(perda.resultado === -500 && perda.seVender.imposto === 0 && perda.seVender.liquido === 4500, "com prejuízo não há imposto na venda");
  const recente = pos.avaliarLote({ ...bom.lote, data: "2026-10-20" }, ltn);
  conferir(recente.iof === true && recente.seVender === null, "menos de 30 dias: há IOF, o líquido não sai");

  // NTN-F comprada em 10/03/2025: recebeu os três cupons. Comprada NA data-ex
  // de 30/06/2025, já não recebeu aquele.
  const c1 = pos.avaliarLote({ id: "c", slug: ntnf.slug, data: "2025-03-10", quantidade: 3, valor: 2650 }, ntnf, { desde: "2019-01-01" });
  conferir(perto(c1.cupons, 3 * 3 * 48.81) && perto(c1.resultado, 2700 + 439.29 - 2650), "com cupom: o resultado soma os cupons recebidos desde a compra");
  conferir(c1.seVender === null, "com cupom: o líquido da venda não é calculado");
  conferir(perto(c1.noVencimento.valor, 3 * 1439.29) && c1.noVencimento.pagamentos === 9 && !c1.noVencimento.liquido, "com cupom: no vencimento, principal mais os cupons que faltam, sem líquido");
  const c2 = pos.avaliarLote({ id: "c", slug: ntnf.slug, data: "2025-06-30", quantidade: 1, valor: 900 }, ntnf, { desde: "2019-01-01" });
  conferir(perto(c2.cupons, 2 * 48.81), "quem compra na data-ex já não recebe aquele cupom");
  const antigo = pos.avaliarLote({ id: "c", slug: ntnf.slug, data: "2018-05-10", quantidade: 1, valor: 900 }, ntnf, { desde: "2019-01-01" });
  conferir(!!antigo.cuponsDesconhecidos && antigo.cupons === 0, "compra anterior ao histórico: cupons desconhecidos, e a tela é avisada");
  const semValor = { ...ntnf, cuponsPagos: [{ data: "2026-07-01", ex: "2026-06-30", valor: null }] };
  conferir(!!pos.avaliarLote({ id: "c", slug: ntnf.slug, data: "2026-01-10", quantidade: 1, valor: 900 }, semValor, {}).cuponsDesconhecidos, "cupom de valor desconhecido não entra como zero em silêncio");

  const s = pos.avaliarLote({ id: "s", slug: lft.slug, data: "2025-01-10", quantidade: 0.5, valor: 9000 }, lft);
  conferir(s.valorHoje === 10000 && s.noVencimento === null && s.seVender != null, "LFT: vale hoje e líquido da venda, sem valor no vencimento");
  conferir(pos.avaliarLote(bom.lote, null).semTitulo === true, "título fora da lista (vencido): sem conta, sem quebrar");
  conferir(pos.avaliarLote(bom.lote, { ...ltn, pu: null }).valorHoje === null, "sem preço não há valor de hoje — null, não zero");

  const carteira = pos.resumirCarteira(
    [
      { id: "1", slug: lft.slug, data: "2025-01-10", quantidade: 0.5, valor: 9000 },
      bom.lote,
      { ...bom.lote, id: "2", data: "2024-01-10", quantidade: 4, valor: 2400 },
      { id: "3", slug: "ipca-2019-05-15", data: "2019-01-10", quantidade: 1, valor: 3000 },
    ],
    [ltn, ntnf, lft]
  );
  conferir(carteira.grupos.map((g) => g.slug).join() === [ltn.slug, lft.slug, "ipca-2019-05-15"].join(), "um grupo por título, na ordem do servidor; o vencido por último");
  const g = carteira.grupos[0];
  conferir(g.quantidade === 10 && g.investido === 6300 && g.valorHoje === 7500 && g.noVencimento.valor === 10000, "lotes do mesmo título somam");
  conferir(g.lotes[0].lote.data === "2024-01-10", "as compras de um título em ordem de data");
  conferir(carteira.total.investido === 15300 && carteira.total.valorHoje === 17500 && carteira.total.resultado === 2200, "o total soma investido, valor de hoje e resultado");
  conferir(!("noVencimento" in carteira.total), "o total NÃO soma o valor no vencimento: reais nominais e reais de hoje não se somam");
  conferir(carteira.total.foraDoTotal === 1, "o título sem preço fica fora da soma, e a tela é avisada de quantos");
  conferir(pos.resumirCarteira([], [ltn]).total === null, "carteira vazia: sem total");

  // SÓ NESTE APARELHO. O que a pessoa tem não pode ir para a rede: nem a
  // conta nem a tela importam o cliente de /api, e ele não sabe que posições
  // existem.
  const posSrc = await ler("src/posicoes.js");
  const cartSrc = await ler("src/components/Carteira.jsx");
  const apiFonte = await ler("src/api.js");
  conferir(!/api\.js|fetch\(|XMLHttpRequest|sendBeacon/.test(posSrc.replace(/\/\/.*$/gm, "")), "posicoes.js não fala com a rede");
  conferir(!/api\.js|fetch\(|XMLHttpRequest|sendBeacon/.test(cartSrc.replace(/\/\/.*$/gm, "")), "a tela da Carteira não fala com a rede");
  conferir(!/posic/i.test(apiFonte), "o cliente de /api não conhece as posições");
  const appFonte = await ler("src/App.jsx");
  conferir(/id: "carteira"/.test(appFonte) && /"Carteira"/.test(await ler("scripts/fumaca.mjs")), "a aba Carteira está no App e no teste de fumaça");
  conferir(/tesouro-tracker-posicoes/.test(await ler("scripts/fumaca.mjs")), "o teste de fumaça abre a Carteira COM posições");
}

// O RISCO, O CALENDÁRIO, O CDI, A CÓPIA E A PLANILHA — o que a Carteira
// ganhou em 11/2026. Tudo conta feita no aparelho, com fixtures.
console.log("\ncarteira: risco, calendário, CDI, cópia e planilha");
{
  const pos = await import("../src/posicoes.js");
  const plan = await import("../src/planilha.js");
  const d = (mac, mais, menos) => ({ macaulay: mac, variacaoPor1pp: mais, variacaoMenos1pp: menos });
  const ltn = {
    slug: "prefixado-2029-01-01", nome: "Prefixado 2029", tipo: "prefixado", vencimento: "2029-01-01", comCupom: false, data: "2026-11-06", pu: 750,
    duration: d(2, -1.8, 1.9), recebimentos: { principal: 1000, cupom: 0, pagamentos: 0, total: 1000, unidade: "nominal" },
  };
  const ntnb = {
    slug: "ipca-juros-2030-08-15", nome: "IPCA+ com juros 2030", tipo: "ipca-juros", vencimento: "2030-08-15", comCupom: true, data: "2026-11-06", pu: 4000,
    duration: d(3.5, -3.2, 3.4), recebimentos: { principal: 4775, cupom: 141.16, pagamentos: 8, total: 5904.28, unidade: "hoje" }, cuponsPagos: [],
  };
  const lft = { slug: "selic-2031-03-01", nome: "Selic 2031", tipo: "selic", vencimento: "2031-03-01", comCupom: false, data: "2026-11-06", pu: 20000, duration: null, recebimentos: null };
  const lotes = [
    { id: "a", slug: ltn.slug, data: "2025-02-03", quantidade: 4, valor: 2600 }, // vale 3.000
    { id: "b", slug: ntnb.slug, data: "2026-09-01", quantidade: 1, valor: 3900 }, // vale 4.000
    { id: "c", slug: lft.slug, data: "2026-01-12", quantidade: 0.15, valor: 2800 }, // vale 3.000
  ];
  const carteira = pos.resumirCarteira(lotes, [ltn, ntnb, lft], { desde: "2019-01-01" });

  const r = pos.riscoDaCarteira(carteira.grupos);
  conferir(r.total === 10000 && perto(r.porFamilia.reduce((s, f) => s + f.pct, 0), 100), "risco: as fatias por indexador somam 100% do valor de hoje");
  conferir(r.porFamilia.map((f) => `${f.id}:${f.pct}`).join() === "ipca:40,prefixado:30,selic:30", "risco: cada título na sua família");
  conferir(r.porAno.map((a) => a.ano).join() === "2029,2030,2031" && perto(r.porAno.reduce((s, a) => s + a.pct, 0), 100), "risco: por ano de vencimento, em ordem");
  // 30% × 2 + 40% × 3,5 + 30% × 0 (a LFT conta, com zero).
  conferir(perto(r.duration, 0.3 * 2 + 0.4 * 3.5), "risco: duration pesada pelo valor de hoje, com a LFT entrando como zero");
  conferir(perto(r.mais1pp.valor, 3000 * -0.018 + 4000 * -0.032) && perto(r.mais1pp.pct, (r.mais1pp.valor / 10000) * 100), "risco: +1 p.p. soma o efeito de cada título, sem mexer na LFT");
  conferir(r.menos1pp.valor > -r.mais1pp.valor, "risco: a queda de 1 p.p. ganha mais do que a alta perde (convexidade preservada)");
  const semCenario = pos.resumirCarteira(lotes, [{ ...ltn, duration: null }, ntnb, lft], {});
  conferir(pos.riscoDaCarteira(semCenario.grupos).mais1pp === null && pos.riscoDaCarteira(semCenario.grupos).duration === null, "risco: título sem cenário deixa o choque null — não uma soma com um pedaço a menos");
  conferir(pos.riscoDaCarteira([]) === null, "risco: carteira vazia não tem risco a mostrar");

  const cal = pos.calendarioDeRecebimentos(carteira.grupos, "2026-11-10");
  const anoDe = (a) => cal.linhas.find((l) => l.ano === a);
  conferir(cal.linhas.map((l) => l.ano).join() === "2027,2028,2029,2030", "calendário: um ano por linha, do primeiro pagamento ao último");
  conferir(anoDe("2029").nominal === 4000 && perto(anoDe("2029").hoje, 2 * 141.16), "calendário: o principal do prefixado em reais nominais, os cupons do IPCA+ a preços de hoje, sem somar um no outro");
  conferir(perto(anoDe("2030").hoje, 2 * 141.16 + 4775) && anoDe("2030").pagamentos.at(-1).principal === true, "calendário: no ano do vencimento, cupons mais o principal");
  conferir(cal.linhas.reduce((s, l) => s + l.pagamentos.filter((p) => p.unidade === "hoje").length, 0) === ntnb.recebimentos.pagamentos, "calendário: tantas datas de cupom quantas o servidor contou");
  conferir(cal.semValor.length === 1 && cal.semValor[0].nome === "Selic 2031", "calendário: a LFT fica fora, nomeada — o valor dela depende da Selic");

  // Um índice que rende 0,05% por dia útil, de 02/01/2025 em diante.
  const indice = [];
  {
    const { ehDiaUtil } = await import("../server/feriados.js");
    let v = 1;
    for (let t = Date.parse("2025-01-02T00:00Z"); t <= Date.parse("2026-11-09T00:00Z"); t += 86400000) {
      const dia = new Date(t);
      if (!ehDiaUtil(dia)) continue;
      v *= 1.0005;
      indice.push([dia.toISOString().slice(0, 10), v]);
    }
  }
  const { diasUteis } = await import("../server/feriados.js");
  // Compra em 03/02 rende de 03/02 em diante e, avaliada com o preço de 06/11,
  // até o dia 05/11: os dias úteis de [03/02, 05/11].
  const n = diasUteis("2025-02-02", "2026-11-05");
  conferir(perto(pos.fatorDoCdi(indice, "2025-02-03", "2026-11-06"), Math.pow(1.0005, n), 1e-9), `CDI: o fator entre duas datas é o produto dos dias do intervalo (${n} dias úteis)`);
  conferir(pos.fatorDoCdi(indice, "2024-06-01", "2026-11-06") === null, "CDI: compra anterior à série devolve null, não o período que der");
  conferir(pos.fatorDoCdi(indice, "2026-11-06", "2026-11-06") === null, "CDI: sem tempo decorrido não há comparação");
  const grupoLtn = carteira.grupos.find((g) => g.slug === ltn.slug);
  const c = pos.compararComCdi(grupoLtn.lotes, indice);
  conferir(perto(c.rendimento, 2600 * (Math.pow(1.0005, n) - 1), 1e-6) && perto(c.pctDoCdi, (400 / c.rendimento) * 100, 1e-6), "CDI: o mesmo dinheiro, das mesmas datas; e o resultado como fração dele");
  const todos = carteira.grupos.flatMap((g) => g.lotes);
  conferir(pos.compararComCdi(todos, indice) != null && pos.compararComCdi([...todos, { ...todos[0], lote: { ...todos[0].lote, data: "2020-01-10" } }], indice) === null, "CDI: um lote fora do alcance derruba a comparação inteira, em vez de comparar com parte da carteira");

  // A cópia de segurança.
  const texto = pos.exportarPosicoes(lotes, "2026-11-11T12:00:00.000Z");
  const lido = JSON.parse(texto);
  conferir(lido.app === "tesouro-tracker" && lido.versao === pos.VERSAO_DO_BACKUP && lido.posicoes.length === 3, "cópia: o arquivo diz o que é e traz só as compras");
  conferir(Object.keys(lido.posicoes[0]).sort().join() === "data,id,quantidade,slug,valor", "cópia: nada além dos campos da compra (nem preço, nem conta)");
  const volta = pos.lerBackup(texto, []);
  conferir(volta.novas.length === 3 && volta.repetidas === 0 && volta.invalidas === 0, "cópia: exportar e restaurar devolve a mesma lista");
  const soma = pos.lerBackup(texto, [lotes[0], { id: "z", slug: ltn.slug, data: "2026-03-03", quantidade: 1, valor: 700 }]);
  conferir(soma.novas.length === 2 && soma.repetidas === 1, "cópia: restaurar SOMA ao que existe e não repete compra igual");
  const idEmUso = pos.lerBackup(texto, [{ id: "b", slug: ltn.slug, data: "2026-03-03", quantidade: 1, valor: 700 }]);
  conferir(new Set(["b", ...idEmUso.novas.map((x) => x.id)]).size === 4, "cópia: id que já existe ganha outro (senão Apagar tiraria as duas)");
  const sujo = pos.lerBackup(JSON.stringify({ posicoes: [lotes[0], { slug: "x" }, null, "texto"] }), []);
  conferir(sujo.novas.length === 1 && sujo.invalidas === 3, "cópia: item ilegível é contado e pulado, sem levar os outros junto");
  conferir(typeof pos.lerBackup("não é json", []).erro === "string" && typeof pos.lerBackup("{}", []).erro === "string", "cópia: arquivo que não é cópia é recusado com mensagem");

  // A planilha colada.
  conferir(plan.numeroDaPlanilha("R$ 1.234,56") === 1234.56 && plan.numeroDaPlanilha("1,234.56") === 1234.56 && plan.numeroDaPlanilha("0,25") === 0.25 && plan.numeroDaPlanilha("1.000") === 1000 && plan.numeroDaPlanilha("12.5") === 12.5 && plan.numeroDaPlanilha("-") === null, "planilha: números à brasileira e à americana; traço é vazio");
  conferir(plan.dataDaPlanilha("03/02/2025") === "2025-02-03" && plan.dataDaPlanilha("3/2/25") === "2025-02-03" && plan.dataDaPlanilha("2025-02-03") === "2025-02-03" && plan.dataDaPlanilha("31/02/2025") === null, "planilha: datas nos três formatos; data que não existe é recusada");
  const lista = [ltn, ntnb, lft, { slug: "ipca-2030-08-15", nome: "IPCA+ 2030", tipo: "ipca", vencimento: "2030-08-15" }];
  conferir(plan.tituloDoNome("Tesouro Prefixado 2029", lista).titulo === ltn && plan.tituloDoNome("Tesouro IPCA+ com Juros Semestrais 2030", lista).titulo === ntnb && plan.tituloDoNome("Tesouro IPCA+ 2030", lista).titulo.slug === "ipca-2030-08-15" && plan.tituloDoNome("Tesouro Selic 2031", lista).titulo === lft, "planilha: o nome do produto acha o título — e 'com juros' não se confunde com o sem cupom do mesmo ano");
  conferir(!plan.tituloDoNome("Tesouro RendA+ 2040", lista).titulo && !plan.tituloDoNome("Tesouro Prefixado 2025", lista).titulo && !plan.tituloDoNome("CDB Banco X", lista).titulo, "planilha: RendA+, título vencido e o que não é Tesouro ficam de fora, com motivo");
  const colado = [
    "Extrato de movimentação",
    "Data\tMovimentação\tProduto\tQuantidade\tPreço unitário\tValor da Operação",
    "03/02/2025\tCompra\tTesouro Prefixado 2029\t4\tR$ 650,00\tR$ 2.600,00",
    "01/09/2026\tCompra\tTesouro IPCA+ com Juros Semestrais 2030\t1\tR$ 3.900,00\tR$ 3.900,00",
    "15/08/2026\tJuros\tTesouro IPCA+ com Juros Semestrais 2030\t1\t-\tR$ 141,16",
    "10/10/2026\tVenda\tTesouro Prefixado 2029\t1\tR$ 740,00\tR$ 740,00",
    "12/01/2026\tCompra\tTesouro RendA+ 2040\t2\tR$ 1.000,00\tR$ 2.000,00",
    "40/01/2026\tCompra\tTesouro Selic 2031\t0,15\tR$ 18.666,67\tR$ 2.800,00",
  ].join("\n");
  const p = plan.lerPlanilha(colado, lista, "2026-11-10");
  conferir(p.lotes.length === 2 && p.lotes[0].slug === ltn.slug && p.lotes[0].quantidade === 4 && p.lotes[0].valor === 2600 && p.lotes[0].data === "2025-02-03", "planilha: as compras entram com o VALOR DA OPERAÇÃO, não o preço unitário");
  conferir(p.ignoradas.length === 4 && p.ignoradas.every((i) => i.motivo && i.linha > 2), "planilha: cupom, venda, RendA+ e data ilegível ficam de fora, cada um com o motivo e a linha");
  conferir(p.colunas.valor === "Valor da Operação" && p.colunas.produto === "Produto", "planilha: a prévia diz quais colunas foram lidas");
  const csv = plan.lerPlanilha('Produto;Data da Negociação;Quantidade;Valor Total\n"Tesouro Prefixado 2029";03/02/2025;4;"2.600,00"', lista, "2026-11-10");
  conferir(csv.lotes?.length === 1 && csv.lotes[0].valor === 2600, "planilha: ponto e vírgula, aspas e outra ordem de colunas também");
  conferir(typeof plan.lerPlanilha("uma linha só", lista, "2026-11-10").erro === "string" && typeof plan.lerPlanilha("a\tb\n1\t2", lista, "2026-11-10").erro === "string", "planilha: sem cabeçalho reconhecível, recusa com mensagem em vez de adivinhar");
  const planFonte = (await ler("src/planilha.js")).replace(/\/\/.*$/gm, "");
  conferir(!/import |fetch\(|XMLHttpRequest|sendBeacon/.test(planFonte), "planilha.js é puro: sem imports, sem rede");
  // A prévia é o que segura um leitor escrito sem um arquivo real da B3.
  const cart = await ler("src/components/Carteira.jsx");
  conferir(/setPrevia\(/.test(cart) && /confirmar/.test(cart) && /previa\.ignoradas/.test(cart), "a importação mostra a prévia (e o que ficou de fora) antes de gravar");
}

// O CDI DA CARTEIRA. A série é a mesma para todo mundo: o servidor não pode
// passar a receber a data de uma compra para "fazer a conta lá".
console.log("\n/api/cdi não recebe nada de ninguém");
{
  conferir(datalayer.getCdi.length === 0, "getCdi() não aceita parâmetro");
  const rota = (await ler("api/cdi.js")).replace(/\/\/.*$/gm, "");
  conferir(!/req\.(query|body)/.test(rota), "api/cdi.js não lê query nem corpo");
  conferir(/getCdi = \(\) => getJSON\("\/api\/cdi"\)/.test(await ler("src/api.js")), "o cliente pede /api/cdi sem parâmetro");
  const app = await ler("src/App.jsx");
  conferir(/getCdi\(\)/.test(app) && !/getCdi\([^)]/.test(app), "o App pede o CDI sem argumento — e é ele, não a Carteira, quem fala com a rede");
  // O gatilho é abrir a aba. Se fosse a lista de compras, registrar a
  // primeira dispararia um pedido — vazio, mas que diria "este aparelho
  // acaba de registrar algo".
  const efeito = app.slice(app.indexOf("const naCarteira"), app.indexOf("[naCarteira, geracao]") + 22);
  conferir(/\[naCarteira, geracao\]/.test(efeito) && !/posicoes/.test(efeito.replace(/\/\/.*$/gm, "")), "o pedido do CDI depende de abrir a Carteira, não de haver compras");
}

// O QUE O DI EMBUTE PARA O COPOM. A conta é conferida contra um caminho
// CONHECIDO: monta-se a curva que uma escada de CDI produziria, dia a dia, e
// a função tem de devolver a escada.
console.log("\nSelic implícita no DI");
{
  const selic = await import("../server/selic.js");
  const { ehDiaUtil, diasUteis } = await import("../server/feriados.js");
  const ref = "2026-11-10";
  const passos = { "2026-12-09": 13.4, "2027-01-27": 13.15, "2027-03-17": 13.15, "2027-04-28": 12.65 };
  const vencs = ["2026-12-01", "2027-01-04", "2027-02-01", "2027-03-01", "2027-04-01", "2027-05-03", "2027-06-01", "2027-07-01"];
  const prox = (iso) => {
    let dia = new Date(Date.parse(`${iso}T00:00Z`) + 864e5);
    while (!ehDiaUtil(dia)) dia = new Date(dia.getTime() + 864e5);
    return dia.toISOString().slice(0, 10);
  };
  // A taxa do pernoite que TERMINA em `fim`: a nova vale a partir do dia útil
  // seguinte à decisão.
  const taxaNoDia = (fim) => {
    let x = 13.65;
    for (const [m, v] of Object.entries(passos)) if (prox(m) < fim) x = v;
    return x;
  };
  const fatorAte = (venc) => {
    let fator = 1;
    for (let t = Date.parse(`${ref}T00:00Z`) + 864e5; t <= Date.parse(`${venc}T00:00Z`); t += 864e5) {
      const dia = new Date(t);
      if (ehDiaUtil(dia)) fator *= Math.pow(1 + taxaNoDia(dia.toISOString().slice(0, 10)) / 100, 1 / 252);
    }
    return fator;
  };
  const vertices = vencs.map((v) => ({ vencimento: v, taxa: (Math.pow(fatorAte(v), 252 / diasUteis(ref, v)) - 1) * 100 }));
  const r = selic.caminhoDaSelic({ dataRef: ref, vertices, cdiHoje: 99 });
  conferir(r.origemDaPartida === "curva" && perto(r.cdiDePartida, 13.65, 1e-6), "a partida sai da própria curva quando o primeiro vencimento chega antes da reunião (e ignora o CDI publicado)");
  // A curva sintética alcança também a reunião de junho/2027, que não está em
  // `passos`: nela nada muda, e a conta tem de dizer isso (a última taxa).
  conferir(r.reunioes.length === 5 && r.reunioes.every((m) => perto(m.cdiDepois, passos[m.data] ?? 12.65, 1e-6)), `recupera a escada conhecida, reunião a reunião (${r.reunioes.map((m) => m.cdiDepois.toFixed(2)).join(" · ")})`);
  conferir(perto(r.reunioes[2].variacaoPP, 0, 1e-6) && perto(r.reunioes[4].variacaoPP, 0, 1e-6) && perto(r.reunioes.at(-1).acumuladoPP, -1, 1e-6), "reunião sem mudança dá zero; o acumulado é a soma dos degraus");
  // Dois vencimentos com duas reuniões no meio: não dá para separar.
  const ralo = selic.caminhoDaSelic({ dataRef: ref, vertices: vertices.filter((v) => ["2026-12-01", "2027-04-01"].includes(v.vencimento)), cdiHoje: 13.65 });
  conferir(ralo.reunioes.length === 0 && ralo.parouEm === "2026-12-09" && /duas reuniões/.test(ralo.motivoDaParada), "duas reuniões entre dois vencimentos: a conta PARA, não reparte no chute");
  const semPartida = selic.caminhoDaSelic({ dataRef: ref, vertices: vertices.slice(1), cdiHoje: null });
  conferir(semPartida.reunioes.length === 0 && /partida/.test(semPartida.motivoDaParada), "sem vencimento antes da reunião e sem CDI publicado, não há partida — e não se inventa uma");
  conferir(selic.caminhoDaSelic({ dataRef: null, vertices: [] }).reunioes.length === 0, "sem dados, lista vazia");

  // O calendário: de fonte, em ordem, em dia útil, oito por ano.
  const cal = selic.REUNIOES_COPOM;
  conferir(cal.every((m, i) => i === 0 || m > cal[i - 1]) && cal.every((m) => ehDiaUtil(new Date(`${m}T00:00:00Z`)) && new Date(`${m}T00:00:00Z`).getUTCDay() === 3), "reuniões do Copom em ordem, todas numa quarta-feira útil");
  const porAno = cal.reduce((o, m) => ({ ...o, [m.slice(0, 4)]: (o[m.slice(0, 4)] || 0) + 1 }), {});
  conferir(Object.values(porAno).every((q) => q === 8), `oito reuniões por ano (${Object.keys(porAno).join(", ")})`);
  conferir(selic.CALENDARIO_ATE === cal.at(-1) && /^\d{4}-\d{2}-\d{2}$/.test(selic.CALENDARIO_CONFERIDO_EM), "o calendário diz até onde vai e quando foi conferido");
  // Envelhece sozinho: avisa quando faltar pouco, sem derrubar o CI.
  const faltam = cal.filter((m) => m > new Date().toISOString().slice(0, 10)).length;
  if (faltam < 4) avisar(`só ${faltam} reunião(ões) do Copom à frente no calendário de server/selic.js — acrescente o do ano seguinte`);
  else ok(`${faltam} reuniões do Copom à frente no calendário`);

  // O que vai para a tela: poucas reuniões, e o nível a partir da META.
  const contratos = Object.fromEntries(vertices.map((v, i) => [`DI1X${i}`, { ativo: "DI1", vencimento: v.vencimento, serie: { [ref]: [v.taxa, 0] } }]));
  const tela = datalayer.selicImplicitaDe({ contratos }, { cdiHoje: 13.65, metaHoje: 13.75 });
  conferir(tela.dataRef === ref && tela.reunioes.length === 4 && perto(tela.reunioes[0].metaImplicita, 13.75 - 0.25, 1e-6), "selicImplicitaDe: o nível mostrado é a meta de hoje mais o que os preços embutem");
  conferir(tela.calendarioAte === selic.CALENDARIO_ATE && typeof tela.fonte === "string", "o payload leva a fonte e até onde vai o calendário");
  const absurdo = { ...contratos, DI1X1: { ...contratos.DI1X1, serie: { [ref]: [20, 0] } } };
  conferir(datalayer.selicImplicitaDe({ contratos: absurdo }, { cdiHoje: 13.65, metaHoje: 13.75 }).reunioes.length === 0, "um degrau implausível (vértice sem liquidez) corta a lista ali, em vez de ir para a tela");
  conferir(datalayer.selicImplicitaDe({ contratos: {} }, {}) === null && datalayer.selicImplicitaDe(null, {}) === null, "sem DI coletado não há seção");
  const merc = await ler("src/components/Mercado.jsx");
  conferir(/[Nn]ão é previsão/.test(merc), "a tela diz que a Selic implícita não é previsão");
}

// O RESUMO DO DIA, escrito por um modelo. O que protege a tela não é o
// pedido: é a conferência do que volta.
console.log("\nresumo do dia (IA)");
{
  const res = await import("../server/resumo.js");
  const item = (nome, tipo, taxa, pp, extra = {}) => ({ nome, tipo, taxa, data: "2026-11-10", variacoes: { "1D": { taxaPP: pp, puPct: -pp * 3 }, "1M": { taxaPP: 0.31 } }, ...extra });
  const titulos = {
    categorias: [
      { nome: "IPCA+", itens: [item("IPCA+ 2035", "ipca", 7.62, 0.04, { destaque: true }), item("IPCA+ 2045", "ipca", 7.4, -0.02)] },
      { nome: "Prefixado", itens: [item("Prefixado 2029", "prefixado", 13.91, 0.12, { destaque: true })] },
    ],
    macro: { indicadores: { selic: { valor: 13.75 }, ipca: { acumulado12m: 4.68 }, usdbrl: { valor: 5.4321, changePct: 0.35 } } },
  };
  const fatos = res.montarFatos({
    titulos,
    selicImplicita: { dataRef: "2026-11-10", reunioes: [{ data: "2026-12-09", variacaoPP: -0.25, acumuladoPP: -0.25 }] },
    manchetes: [{ titulo: "Dólar sobe com exterior" }],
  });
  const tudo = fatos.linhas.join("\n");
  conferir(fatos.dataDosPrecos === "2026-11-10" && /7,62%/.test(tudo) && /\+0,12 p\.p\./.test(tudo) && /−0,25 p\.p\./.test(tudo) && /Dólar sobe/.test(tudo), "os fatos levam os números já como o app os escreve");
  conferir(/taxa real/.test(tudo) && /nominal/.test(tudo), "cada taxa vai com a sua unidade — real e nominal não chegam ao modelo como a mesma coisa");
  conferir(res.montarFatos({ titulos: { categorias: [] } }) === null, "sem títulos não há fatos");
  const parado = { categorias: [{ nome: "IPCA+", itens: [{ nome: "IPCA+ 2035", tipo: "ipca", taxa: 7.6, data: "2026-11-10", variacoes: {} }] }] };
  conferir(res.montarFatos({ titulos: parado }) === null, "sem variação do dia não há resumo do dia");
  // NADA DA PESSOA vai no pedido: os fatos saem do payload público.
  conferir(!/posic|carteira|alerta/i.test(tudo) && !/posicoes|localStorage/.test((await ler("server/resumo.js")).replace(/\/\/.*$/gm, "")), "nada de carteira, alerta ou aparelho entra nos fatos");

  const pedido = res.montarPedido(fatos);
  conferir(pedido.model === res.MODELO && pedido.thinking?.type === "adaptive" && pedido.output_config?.effort === res.ESFORCO && pedido.max_tokens === res.MAX_TOKENS, "o pedido leva modelo, raciocínio adaptativo e esforço explícitos");
  conferir(!("temperature" in pedido) && !("budget_tokens" in (pedido.thinking || {})), "sem temperature nem budget_tokens, que este modelo recusa");
  conferir(pedido.messages.length === 1 && pedido.messages[0].content.includes(tudo) && pedido.system === res.INSTRUCAO, "os fatos vão inteiros na mensagem; a instrução, no system");

  const bom = "As taxas subiram nesta sessão. O Prefixado 2029 foi a 13,91%, alta de 0,12 p.p., e o IPCA+ 2035 fechou em 7,62%.\n\nOs preços do DI embutem queda de 0,25 p.p. na reunião de 09/12.";
  conferir(res.validarResumo(bom, fatos).ok === true, "um resumo só com números dos fatos passa");
  const recusa = (t) => res.validarResumo(t, fatos);
  conferir(!recusa("O Prefixado 2029 foi a 13,95%.").ok && /13\.95/.test(recusa("O Prefixado 2029 foi a 13,95%.").motivo), "um número que não está nos fatos derruba o resumo, e o motivo diz qual");
  conferir(!recusa("A taxa subiu 0,16 p.p. somando os dois dias.").ok, "número DERIVADO (uma soma que o modelo fez) também é recusado");
  conferir(!recusa("O IPCA+ 2035 a 7,62% é uma oportunidade.").ok && !recusa("É hora de comprar o Prefixado 2029.").ok, "linguagem de recomendação é recusada");
  conferir(!recusa("**Resumo**: taxas em alta.").ok && !recusa("- taxas em alta").ok, "formatação é recusada");
  conferir(!recusa("").ok && !recusa(Array(res.MAX_PALAVRAS + 5).fill("taxa").join(" ")).ok, "vazio e longo demais são recusados");
  conferir(res.numerosDe("caiu −0,12 p.p. no 2.035 e 13,75%.").join() === "0.12,2035,13.75", "os números são comparados sem sinal e sem ponto de milhar");

  const arq = res.montarArquivo({ texto: bom, fatos, modelo: "modelo-x", agora: "2026-11-11T12:00:00.000Z" });
  conferir(arq.dataDosPrecos === "2026-11-10" && /IA/.test(arq.geradoPor) && arq.texto === bom && Array.isArray(arq.fatos), "o arquivo diz de que preços é, que foi um modelo que escreveu, e guarda os fatos usados");
  const semente = JSON.parse(await ler("dados/resumo.json"));
  conferir(Object.keys(arq).every((k) => k in semente), "dados/resumo.json tem os campos que o coletor escreve");

  // Só chega à tela o resumo DOS PREÇOS QUE ESTÃO NA TELA.
  const dl = (await ler("server/datalayer.js")).replace(/\/\/.*$/gm, "");
  conferir(/dataDosPrecos\s*!==?\s*\w+|dataDosPrecos\s*===?\s*\w+/.test(dl.slice(dl.indexOf("function resumoDoDia"), dl.indexOf("function resumoDoDia") + 900)), "getTitulos só devolve o resumo se for da mesma data dos preços");
  const painel = await ler("src/components/Painel.jsx");
  conferir(/gerado por IA/.test(painel) && /resumo\?\.texto/.test(painel), "o Painel marca o resumo como gerado por IA, na tela, e some sem resumo");

  // O SDK é do coletor. Nada em src/, server/ ou api/ pode importá-lo: iria
  // para o pacote do app ou para uma função da Vercel, e com ele a ideia de
  // que a chave poderia morar ali.
  const fontes = [];
  for (const dir of ["src", "src/components", "server", "server/providers", "api"]) {
    for (const f of await readdir(join(RAIZ, dir))) if (/\.(js|jsx|mjs)$/.test(f)) fontes.push(`${dir}/${f}`);
  }
  const comSdk = [];
  for (const f of fontes) if (/@anthropic-ai\/sdk|ANTHROPIC_API_KEY/.test(await ler(f))) comSdk.push(f);
  conferir(comSdk.length === 0, `o SDK e a chave só aparecem no coletor${comSdk.length ? ` (achados em ${comSdk.join(", ")})` : ""}`);
  const pkg = JSON.parse(await ler("package.json"));
  conferir(!!pkg.devDependencies["@anthropic-ai/sdk"] && Object.keys(pkg.dependencies).sort().join() === "react,react-dom", "o SDK é devDependency; em runtime continuam só react e react-dom");

  const wf = await ler(".github/workflows/coletar-tesouro.yml");
  conferir(/git add[^\n]*dados\/resumo\.json/.test(wf), "o workflow versiona dados/resumo.json");
  conferir(/TEM_CHAVE: \$\{\{ secrets\.ANTHROPIC_API_KEY != '' \}\}/.test(wf) && (wf.match(/env\.TEM_CHAVE == 'true'/g) || []).length >= 2, "os passos do resumo só rodam com a chave configurada");
  const passo = wf.slice(wf.indexOf("Escrever o resumo do dia"), wf.indexOf("Escrever o resumo do dia") + 500);
  conferir(/continue-on-error: true/.test(passo), "o resumo nunca derruba a coleta (continue-on-error)");
  conferir(wf.indexOf("gerar-resumo.mjs") > wf.indexOf("coletar-tesouro.mjs"), "o resumo roda DEPOIS da coleta, em outro processo");
  const gerador = await ler(".github/scripts/gerar-resumo.mjs");
  conferir(/stop_reason === "refusal"/.test(gerador) && /validarResumo/.test(gerador) && !/console\.log\([^)]*ANTHROPIC_API_KEY\]/.test(gerador), "o coletor confere por que o modelo parou e passa o texto pela conferência antes de gravar");
  conferir(/require\("\.\.\/dados\/resumo\.json"\)/.test(await ler("server/cache.js")), "cache.js carrega dados/resumo.json com caminho literal");
}

console.log("\nordem da lista de títulos");
{
  const o = await import("../src/ordem.js");
  const lista = [
    { slug: "a", vencimento: "2030-01-01", taxa: 7.2, taxaVarPP: -0.3, variacoes: { "1D": { taxaPP: -0.3 } } },
    { slug: "b", vencimento: "2028-01-01", taxa: null, taxaVarPP: null, variacoes: {} },
    { slug: "c", vencimento: "2035-01-01", taxa: 7.9, taxaVarPP: 0.05, variacoes: { "1D": { taxaPP: 0.05 } } },
  ];
  const ids = (l) => l.map((t) => t.slug).join("");
  conferir(ids(o.ordenar(lista, o.ORDEM_PADRAO)) === "bac", "padrão: vencimento, do mais próximo ao mais distante");
  conferir(ids(o.ordenar(lista, { por: "taxa", desc: true })) === "cab", "taxa da maior para a menor, sem dado no fim");
  conferir(ids(o.ordenar(lista, { por: "taxa", desc: false })) === "acb", "invertida, quem não tem dado CONTINUA no fim");
  conferir(ids(o.ordenar(lista, { por: "variacao", desc: true })) === "acb", "variação (celular): pelo tamanho do movimento, não pelo sinal");
  conferir(ids(o.ordenar(lista, { por: "dia", desc: true })) === "cab", "coluna Dia (tabela): com sinal");
  conferir(o.ordenar(lista, { por: "inexistente", desc: true }) === lista, "chave desconhecida devolve a lista como veio");
  conferir(o.COLUNAS.filter((c) => c.crescente).map((c) => c.id).join() === "vencimento", "só a data começa do menor para o maior");
  const titSrc = await ler("src/components/Titulos.jsx");
  conferir(/useTelaLarga\(\)/.test(titSrc) && /larga \? \(\s*<Tabela/.test(titSrc), "a tabela monta só em tela larga; no celular fica a lista");
  conferir(/aria-sort=/.test(titSrc), "o cabeçalho diz ao leitor de tela por onde a tabela está ordenada");
}

// O tema claro. Duas coisas quebram em silêncio: os dois blocos de tokens
// divergirem (um tema para quem deixou em "auto", outro para quem escolheu à
// mão), e uma cor ser trocada por outra de contraste insuficiente — que no
// monitor de quem escreve o código parece ótima.
console.log("\ntema claro e escuro");
{
  const css = (await ler("src/styles.css")).replace(/\/\*[\s\S]*?\*\//g, "");
  const bloco = (re) => css.match(re)?.[1] ?? null;
  const escuro = bloco(/:root\s*\{([^}]*)\}/);
  const claroAuto = bloco(/@media \(prefers-color-scheme: light\)\s*\{\s*:root:not\(\[data-tema="escuro"\]\)\s*\{([^}]*)\}/);
  const claroMao = bloco(/:root\[data-tema="claro"\]\s*\{([^}]*)\}/);
  const tokens = (b) => Object.fromEntries([...(b || "").matchAll(/(--[a-z0-9-]+|color-scheme)\s*:\s*([^;]+);/g)].map((m) => [m[1], m[2].trim()]));
  const [E, CA, CM] = [tokens(escuro), tokens(claroAuto), tokens(claroMao)];
  conferir(!!claroAuto && !!claroMao, "o tema claro existe para o modo automático e para a escolha à mão");
  conferir(JSON.stringify(CA) === JSON.stringify(CM) && Object.keys(CA).length > 10, `os dois blocos do tema claro são idênticos (${Object.keys(CA).length} tokens)`);
  // Toda cor do escuro tem a sua no claro. "Cor" = o valor é um hex ou rgba.
  const cores = Object.keys(E).filter((k) => /^#|^rgba?\(/.test(E[k]));
  const faltando = cores.filter((k) => !(k in CA));
  conferir(faltando.length === 0, `toda cor do tema escuro tem par no claro${faltando.length ? ` — faltam ${faltando.join(", ")}` : ` (${cores.length})`}`);
  conferir(CA["--on-accent"] && CA["color-scheme"] === "light" && E["color-scheme"] === "dark", "o claro redefine o texto sobre o acento e diz o esquema ao navegador");

  // Nenhuma cor escrita à mão fora dos blocos de tokens.
  const semTokens = css.replace(escuro, "").replace(claroAuto, "").replace(claroMao, "");
  const soltas = semTokens.match(/#[0-9a-fA-F]{3,8}\b|rgba?\(/g) || [];
  conferir(soltas.length === 0, `nenhuma cor literal fora dos tokens no styles.css${soltas.length ? ` (${soltas.slice(0, 4).join(", ")})` : ""}`);

  // Contraste (WCAG): texto comum pede 4,5:1.
  const rgb = (h) => [0, 2, 4].map((i) => parseInt(h.replace("#", "").slice(i, i + 2), 16) / 255);
  const lum = (h) => {
    const [r, g, b] = rgb(h).map((c) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)));
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  const contraste = (a, b) => {
    const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
    return (x + 0.05) / (y + 0.05);
  };
  const misturar = (a, b, p) => `#${rgb(a).map((c, i) => Math.round((c * p + rgb(b)[i] * (1 - p)) * 255).toString(16).padStart(2, "0")).join("")}`;
  for (const [nome, T0] of [["escuro", E], ["claro", { ...E, ...CA }]]) {
    const T = { ...T0, "--on-accent": T0["--on-accent"].startsWith("var(") ? T0["--bg"] : T0["--on-accent"] };
    const pares = [
      ["--text", "--bg"], ["--text", "--surface"], ["--muted", "--bg"], ["--muted", "--surface"], ["--muted", "--surface-2"],
      ["--up", "--surface"], ["--up", "--bg"], ["--down", "--surface"], ["--down", "--bg"],
      ["--accent", "--surface"], ["--accent", "--bg"], ["--accent", "--surface-2"], ["--on-accent", "--accent"], ["--warn", "--warn-bg"],
    ];
    const ruins = pares.map(([a, b]) => [a, b, contraste(T[a], T[b])]).filter(([, , c]) => c < 4.5);
    // Os fundos derivados: o número verde/coral sobre o chip tingido, e o
    // texto azul sobre o chip ativo.
    const derivados = [
      ["alta no chip", contraste(T["--up"], misturar(T["--up"], T["--surface"], 0.12))],
      ["baixa no chip", contraste(T["--down"], misturar(T["--down"], T["--surface"], 0.12))],
      ["chip ativo", contraste(T["--accent"], misturar(T["--accent"], T["--surface"], 0.16))],
    ].filter(([, c]) => c < 4.5);
    const pior = Math.min(...pares.map(([a, b]) => contraste(T[a], T[b])));
    conferir(
      ruins.length === 0 && derivados.length === 0,
      `tema ${nome}: todo texto com contraste ≥ 4,5:1 (pior par ${pior.toFixed(2)})${ruins.length ? ` — ${ruins.map(([a, b, c]) => `${a}/${b} ${c.toFixed(2)}`).join(", ")}` : ""}${derivados.length ? ` — ${derivados.map(([n, c]) => `${n} ${c.toFixed(2)}`).join(", ")}` : ""}`
    );
  }

  // A chave do tema e a cor da barra moram em dois lugares cada.
  const tema = await import("../src/tema.js");
  const html = await ler("index.html");
  conferir(html.includes(`localStorage.getItem("${tema.CHAVE}")`), `o index.html lê a mesma chave de tema que src/tema.js (${tema.CHAVE})`);
  conferir(tema.COR_DA_BARRA.escuro === E["--bg"] && tema.COR_DA_BARRA.claro === CA["--bg"], "a cor da barra do navegador é o --bg de cada tema");
  conferir(
    html.includes(`data-padrao="${E["--bg"]}"`) && html.includes(`data-padrao="${CA["--bg"]}"`),
    "as duas <meta theme-color> do index.html trazem o --bg de cada tema"
  );
  // aplicarTema, com um documento de mentira.
  const metas = [{ a: { "data-padrao": "#080b14", content: "#080b14" } }, { a: { "data-padrao": "#f3f5fa", content: "#f3f5fa" } }].map((m) => ({
    getAttribute: (k) => m.a[k] ?? null,
    setAttribute: (k, v) => void (m.a[k] = v),
    a: m.a,
  }));
  const raiz = { attrs: {}, setAttribute(k, v) { this.attrs[k] = v; }, removeAttribute(k) { delete this.attrs[k]; } };
  const docFalso = { documentElement: raiz, querySelectorAll: () => metas };
  tema.aplicarTema("claro", docFalso);
  conferir(raiz.attrs["data-tema"] === "claro" && metas.every((m) => m.a.content === tema.COR_DA_BARRA.claro), "escolher um tema põe o atributo e acerta a barra do navegador");
  tema.aplicarTema("auto", docFalso);
  conferir(!("data-tema" in raiz.attrs) && metas[0].a.content === "#080b14" && metas[1].a.content === "#f3f5fa", "voltar a \"auto\" tira o atributo e devolve cada cor");
  conferir(tema.TEMAS.map((t) => t.id).join() === "auto,claro,escuro", "três posições: auto, claro, escuro");
}

console.log("\nchaves de localStorage, as quatro");
{
  const chaves = {
    alertas: (await import("../src/alertas.js")).CHAVE,
    destaques: (await import("../src/destaques.js")).CHAVE,
    posicoes: (await import("../src/posicoes.js")).CHAVE,
    tema: (await import("../src/tema.js")).CHAVE,
  };
  conferir(new Set(Object.values(chaves)).size === 4, `chaves distintas (${Object.values(chaves).join(", ")})`);
  const guia = await ler("CLAUDE.md");
  for (const [nome, chave] of Object.entries(chaves)) conferir(guia.includes(chave), `CLAUDE.md documenta a chave de ${nome} (${chave})`);
}

// Casas decimais fixas por tipo de número. Um zero à direita que some não dá
// erro nenhum — só desalinha a vírgula numa coluna de tabular-nums e faz duas
// cotações com a mesma precisão parecerem ter precisões diferentes. É o tipo
// de coisa que volta numa mexida distraída no formatador.
console.log("\ncasas decimais");
conferir(fmt.num(5.15, 4) === "5,1500" && fmt.num(1.178, 4) === "1,1780", `câmbio sempre com 4 casas (${fmt.num(5.15, 4)})`);
conferir(fmt.num(1.1464, 4) === "1,1464", "4 casas não arredondam a cotação cheia");
conferir(fmt.reais(4321) === "R$ 4.321,00" && fmt.reais(4321.5) === "R$ 4.321,50", `PU sempre com 2 casas (${fmt.reais(4321.5)})`);
conferir(fmt.reais(4321.456) === "R$ 4.321,46", "PU arredonda na segunda casa, não trunca");
conferir(fmt.num(139512, 0) === "139.512", `índice em pontos segue sem decimais (${fmt.num(139512, 0)})`);
// Duration com UMA casa, que é o que o call site sempre pediu. Enquanto a
// escada de formatadores engolia qualquer `casas` fora de {0,2,3,4}, ela saía
// com duas — "2,65 a" onde o código dizia anos(v, 1). Vale fixar porque o
// sintoma de uma regressão aqui é só um dígito a mais, que ninguém estranha.
conferir(fmt.anos(2.6548) === "2,7 a" && fmt.anos(18.6658) === "18,7 a", `duration com uma casa (${fmt.anos(2.6548)})`);
conferir(fmt.num(8.3961, 1) === "8,4", `qualquer casas é respeitado, não só 0/2/4 (${fmt.num(8.3961, 1)})`);
conferir(fmt.pp(0.5, 1) === "+0,5 p.p." && fmt.pp(0.25) === "+0,25 p.p.", "p.p. segue as casas pedidas em cada tela");
conferir(fmt.num(null, 4) === "—" && fmt.num(Infinity, 2) === "—", "ausente e não-finito continuam '—'");
// Pedido fora do intervalo do Intl não pode estourar no meio de uma tabela.
conferir(fmt.num(1.23456, 30) !== "—" && fmt.num(1.5, -1) === "2", "casas fora do intervalo são presas, não explodem");

const { PERIODICIDADE } = await import("../src/format.js");
const mesmasChaves =
  Object.keys(util.ROTULO_PERIODICIDADE).length === Object.keys(PERIODICIDADE).length &&
  Object.entries(util.ROTULO_PERIODICIDADE).every(([k, v]) => PERIODICIDADE[k] === v);
conferir(mesmasChaves, "ROTULO_PERIODICIDADE (util.js) = PERIODICIDADE (format.js)");

console.log(falhas === 0 ? "\ntudo certo\n" : `\n${falhas} verificação(ões) falharam\n`);
process.exit(falhas === 0 ? 0 : 1);
