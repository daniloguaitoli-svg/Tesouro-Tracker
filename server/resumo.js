// server/resumo.js — o resumo do dia, escrito por um modelo de IA.
//
// O QUE É: uma vez por dia de preço novo, o coletor junta os FATOS que o
// próprio app já calcula (o que cada título acompanhado fez, quem mais mexeu
// em cada família, o que o DI embute para o Copom, as manchetes) e pede a um
// modelo dois ou três parágrafos em português dizendo o que aconteceu. O
// texto é gravado em dados/resumo.json e o Painel o mostra, marcado como
// gerado por IA.
//
// O RISCO, e o que este arquivo faz com ele. Um modelo de linguagem erra
// número com a maior naturalidade — e este app existe para dar número certo.
// Então:
//   1. O modelo recebe os números prontos, e é instruído a não usar nenhum
//      outro. Ele escreve a prosa; a conta é do app.
//   2. validarResumo() confere, depois: TODO número que aparece no texto tem
//      de estar entre os fatos enviados. Um que não esteja derruba o resumo
//      inteiro — ele não é publicado, e o Painel fica sem resumo naquele dia.
//      Sem resumo é melhor que resumo com um número inventado.
//   3. Nada de conselho: o texto descreve, não recomenda. A instrução diz, e
//      validarResumo() recusa as palavras de recomendação mais óbvias.
//   4. Nada do que é da PESSOA entra: os fatos saem do catálogo e dos
//      arquivos públicos de dados/. Carteira, alertas e estrelas ficam no
//      aparelho e este código roda no coletor, que nunca os viu.
//
// Este arquivo é PURO (nenhuma chamada de rede): monta os fatos, o pedido e
// a conferência, e o verificar.mjs exercita os três. Quem fala com a API é o
// coletor (.github/scripts/coletar-tesouro.mjs), pelo SDK oficial.

// O modelo e os parâmetros do pedido, num lugar só.
export const MODELO = "claude-opus-5-5";
export const ESFORCO = "medium";
export const MAX_TOKENS = 16000;

const num = (v, casas = 2) => (v == null || !Number.isFinite(v) ? null : Number(v).toFixed(casas).replace(".", ","));
// O sinal sai do número JÁ ARREDONDADO: −0,004 é "0,00", não "−0,00".
const sinalizado = (v, casas = 2) => {
  if (v == null || !Number.isFinite(v)) return null;
  const arredondado = Number(v.toFixed(casas));
  return `${arredondado > 0 ? "+" : arredondado < 0 ? "−" : ""}${num(Math.abs(arredondado), casas)}`;
};
const dataBR = (iso) => (iso ? iso.slice(0, 10).split("-").reverse().join("/") : null);

const UNIDADE = {
  ipca: "a.a. acima do IPCA (taxa real)",
  "ipca-juros": "a.a. acima do IPCA (taxa real)",
  prefixado: "a.a. nominal",
  "prefixado-juros": "a.a. nominal",
  selic: "a.a. de ágio/deságio sobre a Selic",
};

// Os fatos do dia, já em texto com os números formatados como o app os
// mostra. `titulos` é o payload de getTitulos(); `selicImplicita`, o de
// server/selic.js; `manchetes`, [{ titulo, fonte }].
//
// Devolve { dataDosPrecos, linhas: [string] } — e null quando não há o que
// dizer (sem títulos, ou sem variação do dia).
export function montarFatos({ titulos, selicImplicita = null, manchetes = [] }) {
  const itens = (titulos?.categorias || []).flatMap((c) => c.itens);
  if (!itens.length) return null;
  const dataDosPrecos = itens.reduce((m, t) => (t.data && t.data > m ? t.data : m), "");
  if (!dataDosPrecos) return null;

  const linhas = [`Data dos preços: ${dataBR(dataDosPrecos)}.`];
  const linhaDoTitulo = (t) => {
    const dia = t.variacoes?.["1D"];
    const mes = t.variacoes?.["1M"];
    const partes = [`${t.nome}: taxa de ${num(t.taxa, t.tipo === "selic" ? 4 : 2)}%${UNIDADE[t.tipo] ? ` ${UNIDADE[t.tipo]}` : ""}`];
    if (dia?.taxaPP != null) partes.push(`variação da taxa no dia de ${sinalizado(dia.taxaPP)} p.p.`);
    if (dia?.puPct != null) partes.push(`preço no dia ${sinalizado(dia.puPct)}%`);
    if (mes?.taxaPP != null) partes.push(`taxa em 1 mês ${sinalizado(mes.taxaPP)} p.p.`);
    return partes.join("; ") + ".";
  };

  const destaques = itens.filter((t) => t.destaque && t.data === dataDosPrecos);
  if (destaques.length) {
    linhas.push("", "Títulos de referência do app:");
    for (const t of destaques) linhas.push(`- ${linhaDoTitulo(t)}`);
  }

  // Por família, quem mais mexeu no dia — pelo tamanho do movimento.
  const porFamilia = [];
  for (const c of titulos.categorias) {
    const comDia = c.itens.filter((t) => t.data === dataDosPrecos && t.variacoes?.["1D"]?.taxaPP != null);
    if (!comDia.length) continue;
    const maior = comDia.reduce((a, b) => (Math.abs(b.variacoes["1D"].taxaPP) > Math.abs(a.variacoes["1D"].taxaPP) ? b : a));
    const media = comDia.reduce((s, t) => s + t.variacoes["1D"].taxaPP, 0) / comDia.length;
    porFamilia.push(`- ${c.nome}: variação média da taxa no dia de ${sinalizado(media)} p.p.; a maior foi em ${maior.nome}, ${sinalizado(maior.variacoes["1D"].taxaPP)} p.p.`);
  }
  if (!porFamilia.length) return null; // sem variação do dia não há resumo do dia
  linhas.push("", "Por família (taxa que sobe é preço que cai):", ...porFamilia);

  const m = titulos.macro?.indicadores || {};
  const macro = [];
  if (m.selic?.valor != null) macro.push(`- Meta da Selic: ${num(m.selic.valor)}% a.a.`);
  if (m.ipca?.acumulado12m != null) macro.push(`- IPCA acumulado em 12 meses: ${num(m.ipca.acumulado12m)}%.`);
  if (m.usdbrl?.valor != null) macro.push(`- Dólar (PTAX): R$ ${num(m.usdbrl.valor, 4)}${m.usdbrl.changePct != null ? `, ${sinalizado(m.usdbrl.changePct)}% no dia` : ""}.`);
  if (macro.length) linhas.push("", "Cenário:", ...macro);

  const reunioes = selicImplicita?.reunioes || [];
  if (reunioes.length) {
    linhas.push("", `O que o DI futuro embute para o Copom (preços de ${dataBR(selicImplicita.dataRef)}; inclui prêmio de risco, não é previsão):`);
    for (const r of reunioes) linhas.push(`- Reunião de ${dataBR(r.data)}: ${sinalizado(r.variacaoPP)} p.p.; acumulado desde hoje ${sinalizado(r.acumuladoPP)} p.p.`);
  }

  const titulosDasManchetes = manchetes.map((x) => x?.titulo).filter(Boolean).slice(0, 8);
  if (titulosDasManchetes.length) {
    linhas.push("", "Manchetes do dia (contexto; podem não ter relação com os movimentos acima):");
    for (const t of titulosDasManchetes) linhas.push(`- ${t}`);
  }

  return { dataDosPrecos, linhas };
}

export const INSTRUCAO = `Você escreve o "resumo do dia" de um aplicativo que acompanha títulos do Tesouro Direto. Quem lê é um investidor pessoa física brasileiro que abre o app para saber o que aconteceu com as taxas.

Escreva de dois a três parágrafos curtos, em português do Brasil, em texto corrido, sem títulos, listas ou negrito. No máximo 110 palavras no total.

Regras, e o motivo de cada uma:

- Use somente os números que estão nos fatos fornecidos, exatamente como estão escritos (com vírgula decimal). Não calcule, arredonde, some nem derive nenhum número novo: o texto é conferido por um programa que rejeita o resumo inteiro se encontrar um número que não esteja nos fatos. Datas e anos de vencimento que aparecem nos fatos podem ser usados.
- Descreva o que aconteceu; não recomende. Não diga que é hora de comprar ou vender, não chame nada de oportunidade, barato ou caro. O app é informativo e não pode dar conselho de investimento.
- Só relacione um movimento a uma manchete se a ligação for evidente pelo próprio título da manchete. Na dúvida, descreva o movimento sem explicar a causa: uma causa inventada é pior que nenhuma.
- A taxa de um IPCA+ é real (acima da inflação), a de um Prefixado é nominal e a do Tesouro Selic é um ágio sobre a Selic. Não compare o nível de uma com o de outra.
- Quando a taxa sobe, o preço do título cai, e vice-versa. Se mencionar preço, mantenha esse sentido.
- O que o DI embute para o Copom é uma leitura de preços, com prêmio de risco: escreva "o mercado embute" ou "os preços embutem", nunca "o Copom vai".
- Se o dia foi parado, diga isso em uma frase em vez de inflar o texto.

Responda apenas com o texto do resumo.`;

// O pedido, pronto para o SDK. Fica aqui (e não no coletor) para o
// verificar.mjs conferir a forma sem chamar a API.
//
// - `fallbacks: "default"` (beta): se o modelo principal recusar o pedido por
//   uma classificação de segurança, a própria API o refaz num modelo de
//   reserva, na mesma chamada. Sem isso uma recusa espúria custaria o resumo
//   do dia.
// - O raciocínio adaptativo é o padrão deste modelo; `effort` vai explícito
//   porque o padrão dele não é o mesmo em todos os modelos.
export function montarPedido(fatos) {
  return {
    model: MODELO,
    max_tokens: MAX_TOKENS,
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    thinking: { type: "adaptive" },
    output_config: { effort: ESFORCO },
    system: INSTRUCAO,
    messages: [{ role: "user", content: `Fatos do dia:\n\n${fatos.linhas.join("\n")}` }],
  };
}

// Todos os números de um texto, normalizados: "13,75", "−0,12", "2.035" e
// "2035" viram "13.75", "0.12", "2035" e "2035". O sinal sai — quem diz o
// sentido é a frase ("subiu", "caiu"), e exigir o sinal igual recusaria
// "caiu 0,12 p.p." diante de um fato "−0,12".
export function numerosDe(texto) {
  const achados = String(texto || "").match(/\d[\d.]*(?:,\d+)?/g) || [];
  return achados.map((n) => {
    const [inteiro, decimal] = n.replace(/\.$/, "").split(",");
    const limpo = inteiro.replace(/\./g, "");
    return decimal != null ? `${Number(limpo)}.${decimal}` : String(Number(limpo));
  });
}

// Palavras que fazem de uma descrição uma recomendação.
const CONSELHO = /\b(recomend\w+|aproveit\w+|oportunidade\w*|vale a pena|hora de (comprar|vender|investir)|dever(ia|iam) (comprar|vender)|compre|venda já)\b/i;

export const MAX_PALAVRAS = 160; // a instrução pede 110; a folga é para não recusar por dez palavras

// Confere o texto contra os fatos. Devolve { ok, motivo, texto }.
export function validarResumo(texto, fatos) {
  const limpo = String(texto || "").trim();
  if (!limpo) return { ok: false, motivo: "texto vazio" };
  const palavras = limpo.split(/\s+/).length;
  if (palavras > MAX_PALAVRAS) return { ok: false, motivo: `texto longo demais (${palavras} palavras)` };
  if (/[*#_`]|^\s*[-•]\s/m.test(limpo)) return { ok: false, motivo: "veio com formatação (lista, negrito ou título)" };
  if (CONSELHO.test(limpo)) return { ok: false, motivo: `linguagem de recomendação ("${limpo.match(CONSELHO)[0]}")` };

  const permitidos = new Set(numerosDe(fatos.linhas.join("\n")));
  // Dia e mês soltos de uma data dos fatos ("10/11") também valem.
  for (const d of fatos.linhas.join("\n").match(/\d{2}\/\d{2}\/\d{4}/g) || []) {
    const [dia, mes, ano] = d.split("/");
    for (const p of [dia, mes, ano]) permitidos.add(String(Number(p)));
  }
  const estranhos = numerosDe(limpo).filter((n) => !permitidos.has(n));
  if (estranhos.length) return { ok: false, motivo: `número que não está nos fatos: ${[...new Set(estranhos)].slice(0, 5).join(", ")}` };
  return { ok: true, motivo: null, texto: limpo };
}

// O que vai para dados/resumo.json. `geradoPor` diz à tela (e a quem ler o
// arquivo) que aquilo não é dado: é texto de modelo.
export function montarArquivo({ texto, fatos, modelo, agora }) {
  return {
    geradoEm: agora,
    dataDosPrecos: fatos.dataDosPrecos,
    geradoPor: `modelo de IA (${modelo})`,
    aviso: "Texto gerado automaticamente a partir dos números do app. Descreve, não recomenda — e pode errar a leitura mesmo com os números certos.",
    texto,
    fatos: fatos.linhas,
  };
}
