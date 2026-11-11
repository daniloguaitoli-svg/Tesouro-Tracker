// .github/scripts/gerar-resumo.mjs — escreve o resumo do dia com um modelo de IA.
//
// Roda no workflow de coleta, DEPOIS do coletor e num processo à parte. O
// processo à parte não é capricho: server/cache.js lê os arquivos de dados/
// uma vez, na carga do módulo, e o coletor já o carregou com os dados de
// ontem. Aqui, num node novo, getTitulos() enxerga o que acabou de ser
// gravado — que é sobre o que o resumo tem de falar.
//
// O QUE ESTE SCRIPT FAZ é só a parte que fala com a rede. O que vai no pedido,
// e a conferência do que volta, moram em server/resumo.js (puro, exercitado
// pelo verificar.mjs). A regra da conferência: um número no texto que não
// esteja nos fatos derruba o resumo. Ver o cabeçalho de lá.
//
// NUNCA DERRUBA A COLETA. Sem chave configurada sai em silêncio (código 0): o
// app funciona inteiro sem resumo. Com chave e erro de verdade (chave
// inválida, API fora do ar) sai com código 1 para o passo aparecer marcado no
// log — o workflow o declara `continue-on-error`, então os dados do dia são
// versionados do mesmo jeito.
//
// Uso:
//   node .github/scripts/gerar-resumo.mjs            gera e grava
//   node .github/scripts/gerar-resumo.mjs --dry-run  mostra os fatos e o
//                                                    pedido; não chama a API
//
// A chave vem de ANTHROPIC_API_KEY (segredo do repositório). O SDK a lê do
// ambiente — ela não aparece em nenhum lugar deste código nem do log.

import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

import * as cache from "../../server/cache.js";
import { getTitulos, selicImplicitaDe } from "../../server/datalayer.js";
import { manchetes, REGIOES } from "../../server/providers/noticias.js";
import { montarFatos, montarPedido, validarResumo, montarArquivo } from "../../server/resumo.js";

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const ARQUIVO = join(RAIZ, "dados", "resumo.json");
const SECO = process.argv.includes("--dry-run");

// ---------- Os fatos ----------

const titulos = await getTitulos();
const ind = titulos.macro?.indicadores || {};
const selicImplicita = selicImplicitaDe(cache.futuros(), {
  cdiHoje: ind.cdi?.valor ?? null,
  metaHoje: ind.selic?.valor ?? null,
});

// Só as manchetes do Brasil: é o mercado de que o resumo fala. Melhor esforço —
// sem manchete o resumo sai do mesmo jeito, só sem contexto.
let doBrasil = [];
try {
  const regiao = REGIOES.find((r) => r.id === "brasil") || REGIOES[0];
  doBrasil = await manchetes(regiao);
} catch (e) {
  console.warn(`aviso: manchetes indisponíveis (${String(e.message).slice(0, 80)}) — o resumo segue sem elas`);
}

const fatos = montarFatos({ titulos, selicImplicita, manchetes: doBrasil });
if (!fatos) {
  console.log("Sem variação do dia nos dados — não há resumo a escrever.");
  process.exit(0);
}

console.log(`Fatos do dia (${fatos.linhas.length} linhas, preços de ${fatos.dataDosPrecos}):\n`);
console.log(fatos.linhas.join("\n"));

if (SECO) {
  const { system, messages, ...parametros } = montarPedido(fatos);
  console.log("\n--dry-run: a API não foi chamada. Parâmetros do pedido:");
  console.log(JSON.stringify(parametros, null, 2));
  process.exit(0);
}

// UM RESUMO POR DIA DE PREÇO. A coleta roda cinco vezes por dia e o preço
// muda uma: sem isto seriam cinco chamadas pagas para escrever a mesma coisa.
try {
  const atual = JSON.parse(await readFile(ARQUIVO, "utf-8"));
  if (atual?.texto && atual.dataDosPrecos === fatos.dataDosPrecos) {
    console.log(`\nJá existe resumo para os preços de ${fatos.dataDosPrecos} — nada a fazer.`);
    process.exit(0);
  }
} catch {
  /* arquivo ausente ou ilegível: gera */
}

if (!process.env.ANTHROPIC_API_KEY) {
  console.log("\nANTHROPIC_API_KEY não está configurada — resumo não gerado. (Não é erro: o app funciona sem ele.)");
  process.exit(0);
}

// ---------- A chamada ----------

// Import dinâmico: se a instalação das dependências falhou no workflow, o
// erro aparece aqui com uma mensagem que diz o que houve, e não como um
// "Cannot find package" no topo do arquivo antes de qualquer log.
let Anthropic;
try {
  ({ default: Anthropic } = await import("@anthropic-ai/sdk"));
} catch (e) {
  console.error(`\nO SDK da Anthropic não está instalado (${String(e.message).slice(0, 100)}). O passo "npm ci" rodou?`);
  process.exit(1);
}
const cliente = new Anthropic();

// Pede o texto e devolve { texto, modelo } — ou lança, com a causa.
async function pedir(pedido) {
  const resposta = await cliente.beta.messages.create(pedido);
  // Sempre conferir por que o modelo parou ANTES de ler o conteúdo.
  if (resposta.stop_reason === "refusal") {
    throw new Error(`o modelo recusou o pedido (${resposta.stop_details?.category ?? "sem categoria"})`);
  }
  if (resposta.stop_reason === "max_tokens") {
    throw new Error("a resposta foi cortada no limite de tokens");
  }
  const texto = resposta.content
    .filter((bloco) => bloco.type === "text")
    .map((bloco) => bloco.text)
    .join("")
    .trim();
  console.log(`\nResposta de ${resposta.model} — ${resposta.usage?.input_tokens ?? "?"} tokens de entrada, ${resposta.usage?.output_tokens ?? "?"} de saída.`);
  return { texto, modelo: resposta.model };
}

try {
  const pedido = montarPedido(fatos);
  let { texto, modelo } = await pedir(pedido);
  let conferido = validarResumo(texto, fatos);

  // UMA segunda tentativa, dizendo ao modelo o que a conferência recusou.
  // Não mais que uma: se ele errar duas vezes o mesmo dia fica sem resumo, que
  // é o comportamento certo — insistir até passar seria ensinar o texto a
  // driblar a conferência.
  if (!conferido.ok) {
    console.warn(`\nResumo recusado pela conferência: ${conferido.motivo}. Tentando uma vez mais.`);
    const segundo = {
      ...pedido,
      messages: [
        ...pedido.messages,
        { role: "assistant", content: texto || "(vazio)" },
        {
          role: "user",
          content: `Esse texto foi recusado pela conferência automática: ${conferido.motivo}. Reescreva o resumo respeitando todas as regras — em especial, use só números que estejam nos fatos, escritos exatamente como lá.`,
        },
      ],
    };
    ({ texto, modelo } = await pedir(segundo));
    conferido = validarResumo(texto, fatos);
  }

  if (!conferido.ok) {
    console.warn(`\nResumo recusado de novo (${conferido.motivo}). Nada foi gravado: hoje o app fica sem resumo.`);
    console.warn(`Texto recusado:\n${texto}`);
    process.exit(0);
  }

  const arquivo = montarArquivo({ texto: conferido.texto, fatos, modelo, agora: new Date().toISOString() });
  await writeFile(ARQUIVO, JSON.stringify(arquivo, null, 2) + "\n");
  console.log(`\nResumo gravado em dados/resumo.json:\n\n${conferido.texto}`);
} catch (e) {
  // Do mais específico para o mais geral, pelas classes do SDK.
  if (e instanceof Anthropic.AuthenticationError) {
    console.error("\nA chave da API foi recusada (ANTHROPIC_API_KEY inválida ou revogada).");
  } else if (e instanceof Anthropic.PermissionDeniedError) {
    console.error(`\nA chave não tem permissão para este pedido: ${e.message}`);
  } else if (e instanceof Anthropic.RateLimitError) {
    console.error("\nLimite de uso da API atingido — o resumo fica para a próxima coleta.");
  } else if (e instanceof Anthropic.APIConnectionError) {
    console.error(`\nNão foi possível falar com a API: ${e.message}`);
  } else if (e instanceof Anthropic.APIError) {
    console.error(`\nErro da API (${e.status}): ${e.message}`);
  } else {
    console.error(`\nResumo não gerado: ${e.message}`);
  }
  process.exit(1);
}
