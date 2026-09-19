// src/format.js — formatação pt-BR de números, taxas e datas.

// `casas` é EXATO: mínimo e máximo iguais, um formatador por número de casas,
// criados sob demanda e reaproveitados (Intl.NumberFormat é caro de instanciar
// e isto roda por célula de tabela).
//
// Exato importa dos dois lados. O zero à direita não é enfeite numa coluna de
// tabular-nums: com mínimo 2, uma PTAX de 5,1500 saía "5,15" e um EUR/USD de
// 1,1780 saía "1,178", a vírgula desalinhava da linha de cima e duas cotações
// de mesma precisão apareciam com precisões diferentes. E do outro lado havia
// uma escada de formatadores fixos (0, 2, 3, 4) onde qualquer outro pedido caía
// calado no de 2 casas: `num(v, 1)` devolvia duas casas, então a duration
// aparecia como "2,65 a" enquanto o código pedia "2,7 a" — e nada nisso dava
// erro, só ruído na tela.
const formatadores = new Map();
function formatador(casas) {
  let f = formatadores.get(casas);
  if (!f) {
    f = new Intl.NumberFormat("pt-BR", { minimumFractionDigits: casas, maximumFractionDigits: casas });
    formatadores.set(casas, f);
  }
  return f;
}

export function num(v, casas = 2) {
  if (v == null || !Number.isFinite(v)) return "—";
  // Intl aceita 0..20; um pedido fora disso é bug de quem chamou, e prender no
  // intervalo é melhor que estourar RangeError no meio de uma tabela.
  const n = Math.min(20, Math.max(0, Math.trunc(Number(casas) || 0)));
  return formatador(n).format(v);
}

export function reais(v, casas = 2) {
  if (v == null || !Number.isFinite(v)) return "—";
  return `R$ ${num(v, casas)}`;
}

// Taxa real ao ano. O sufixo "% a.a." é sempre explícito porque a taxa da NTN-B
// é REAL (acima do IPCA) — omitir a unidade convida ao erro de lê-la como
// nominal.
export function taxa(v, casas = 2) {
  if (v == null || !Number.isFinite(v)) return "—";
  return `${num(v, casas)}%`;
}

// Percentual com sinal (variação de preço).
export function pct(v, casas = 2) {
  if (v == null || !Number.isFinite(v)) return "—";
  return `${v > 0 ? "+" : ""}${num(v, casas)}%`;
}

// Variação de TAXA se mede em pontos percentuais, não em porcentagem: sair de
// 6,00% para 6,10% é +0,10 p.p. (e não +1,67%).
export function pp(v, casas = 2) {
  if (v == null || !Number.isFinite(v)) return "—";
  return `${v > 0 ? "+" : ""}${num(v, casas)} p.p.`;
}

export function anos(v, casas = 1) {
  if (v == null || !Number.isFinite(v)) return "—";
  return `${num(v, casas)} a`;
}

export function sinal(v) {
  if (v == null || !Number.isFinite(v) || v === 0) return "flat";
  return v > 0 ? "up" : "down";
}

// Para a TAXA, o sinal semântico é invertido em relação ao preço: taxa subindo
// é preço caindo. Quem compra hoje ganha com taxa alta, quem já tem posição
// perde. Aqui a cor segue o PREÇO (a marcação a mercado da posição), que é o
// que o app mostra ao lado.
export function sinalTaxa(v) {
  if (v == null || !Number.isFinite(v) || v === 0) return "flat";
  return v > 0 ? "down" : "up";
}

// "2026-08-20T22:04..." ou "2026-08-20" -> "20/08/2026"
export function dataBR(iso) {
  if (!iso) return "";
  const d = String(iso).slice(0, 10).split("-");
  if (d.length !== 3) return String(iso);
  return `${d[2]}/${d[1]}/${d[0]}`;
}

// "vigente desde" ou "a partir de", conforme a data já chegou ou não.
//
// O BCE anuncia a mudança ANTES de ela valer: a taxa nova entra no início do
// próximo período de manutenção de reservas, e a série do ECB Data Portal já
// publica essa linha com a data de efeito à frente. A tela mostra a taxa nova
// de propósito — é a que o mercado já preçou e a que vale para quem for
// investir —, mas escrever "vigente desde 16/09" num dia 13/09 é uma
// contradição. O Copom e o Fed caem sempre no primeiro ramo.
//
// Compara em São Paulo, não em UTC: depois das 21h o `toISOString()` já virou
// o dia e uma taxa que passou a valer hoje apareceria como futura.
export function hojeSP() {
  return new Date().toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" });
}

export function vigencia(iso, hoje = hojeSP()) {
  if (!iso) return "";
  const dia = String(iso).slice(0, 10);
  return `${dia > hoje ? "a partir de" : "vigente desde"} ${dataBR(dia)}`;
}

// "2026-08" -> "08/2026". O mês de REFERÊNCIA de um dado mensal não é uma data:
// escrever "01/08/2026" sugeriria um dia que o número não tem.
export function mesBR(iso) {
  const m = String(iso ?? "").match(/^(\d{4})-(\d{2})/);
  return m ? `${m[2]}/${m[1]}` : "";
}

export function dataCurtaBR(iso) {
  const cheia = dataBR(iso);
  return cheia ? cheia.slice(0, 5) : "";
}

export function horaBR(iso) {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo" });
  } catch {
    return "";
  }
}

// Rótulo da periodicidade, para explicar por que um número "parado" é normal.
// DUPLICADO DE PROPÓSITO: espelha ROTULO_PERIODICIDADE em server/util.js.
// server/ e src/ nunca se importam (o cliente só vê JSON), então os dois lados
// são copiados à mão — e scripts/verificar.mjs confere que continuam iguais.
export const PERIODICIDADE = { diaria: "diário", mensal: "mensal" };

// Normaliza texto para busca: sem acento, minúsculo. Assim "2035" acha o de
// 2035 e "juros" acha os com cupom, mesmo digitado sem acentuação.
export function normalizarBusca(txt) {
  return String(txt ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

// Rótulo da taxa por família. A MESMA porcentagem significa coisas diferentes:
// na NTN-B é real (acima do IPCA), no Prefixado é nominal cheia, e na LFT nem
// é taxa — é o ágio/deságio sobre a Selic. Mostrar o número sem esse rótulo é
// induzir a comparação errada.
export const UNIDADE_TAXA = {
  ipca: "a.a. + IPCA",
  "ipca-juros": "a.a. + IPCA",
  prefixado: "a.a. (nominal)",
  "prefixado-juros": "a.a. (nominal)",
  selic: "sobre a Selic",
};

export function unidadeTaxa(tipo) {
  return UNIDADE_TAXA[tipo] || "a.a.";
}

// "há 2 h", "ontem", "20/08" — para manchetes.
export function relativoBR(iso) {
  if (!iso) return "";
  const ms = Date.now() - new Date(iso).getTime();
  if (!Number.isFinite(ms) || ms < 0) return dataCurtaBR(iso);
  const h = ms / 36e5;
  if (h < 1) return `há ${Math.max(1, Math.round(ms / 6e4))} min`;
  if (h < 24) return `há ${Math.round(h)} h`;
  if (h < 48) return "ontem";
  return dataCurtaBR(iso);
}
