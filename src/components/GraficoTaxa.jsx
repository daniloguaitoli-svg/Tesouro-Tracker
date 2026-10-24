// components/GraficoTaxa.jsx — a série histórica da taxa, com eixos.
//
// POR QUE SUBSTITUIU O AreaChart (que saiu do repo com ele): aquele desenhava
// com `preserveAspectRatio="none"` e era `aria-hidden` — uma forma, não um
// gráfico que se lê. Esticar o viewBox na horizontal distorce qualquer texto
// dentro dele, então rótulo de eixo ali sairia achatado ou gordo conforme a
// largura da tela. Aqui a proporção é mantida e o SVG tem rótulo acessível.
//
// O que os eixos acrescentam: antes a linha subia e descia sem escala nenhuma
// — dava para ver que a taxa tinha caído, não de quanto para quanto, nem
// quando. Três coisas respondem isso: os rótulos de taxa à esquerda, as datas
// embaixo e a linha tracejada da MÉDIA do período, que é a referência contra a
// qual "está cara ou barata" faz sentido.
import { taxa as fmtTaxa, dataCurtaBR } from "../format.js";

// Em janela curta a data útil é o dia; em janela longa, o mês. "15/10" repetido
// três vezes num gráfico de cinco anos não diz nada, e "10/26" num gráfico de
// um mês esconde que os três rótulos são do mesmo mês.
function rotuloData(iso, porMes) {
  if (!iso) return "";
  const [ano, mes] = String(iso).slice(0, 10).split("-");
  return porMes ? `${mes}/${ano.slice(2)}` : dataCurtaBR(iso);
}

const L = 42; // sobra à esquerda para os rótulos de taxa
const B = 20; // sobra embaixo para as datas
const T = 8; // respiro no topo, para o ponto do máximo não encostar na borda

export function GraficoTaxa({ pontos, media = null, height = 190, width = 366, rotulo }) {
  const serie = (pontos || []).filter((p) => p?.taxa != null && Number.isFinite(p.taxa));
  if (serie.length < 2) {
    return <svg className="grafico-taxa" viewBox={`0 0 ${width} ${height}`} aria-hidden="true" />;
  }

  const valores = serie.map((p) => p.taxa);
  const min = Math.min(...valores);
  const max = Math.max(...valores);
  // Uma folga de 8% impede que o mínimo e o máximo fiquem colados nas bordas,
  // onde o ponto marcado sai pela metade.
  const folga = (max - min || 0.1) * 0.08;
  const yMin = min - folga;
  const yMax = max + folga;

  const px = (i) => L + (i / (serie.length - 1)) * (width - L - 6);
  const py = (v) => T + (1 - (v - yMin) / (yMax - yMin)) * (height - B - T);

  const linha = serie.map((p, i) => `${i ? "L" : "M"}${px(i).toFixed(1)} ${py(p.taxa).toFixed(1)}`).join(" ");
  const area = `${linha} L${px(serie.length - 1).toFixed(1)} ${height - B} L${L} ${height - B} Z`;

  // Três marcas de taxa, nos mesmos lugares de sempre (15%, 50%, 85% da
  // altura) em vez de em números redondos: números redondos podem cair fora
  // da faixa observada e deixar o quadro com uma linha só.
  const marcasY = [yMin + (yMax - yMin) * 0.15, (yMin + yMax) / 2, yMax - (yMax - yMin) * 0.15];
  // Três datas: começo, meio e fim. Mais do que isso não cabe em 390px sem
  // sobrepor, e menos não diz qual é o intervalo.
  const marcasX = [0, Math.floor((serie.length - 1) / 2), serie.length - 1];

  // Mais de meio ano na tela: rótulo por mês.
  const diasNaTela = (Date.parse(serie[serie.length - 1].date) - Date.parse(serie[0].date)) / 864e5;
  const porMes = !Number.isFinite(diasNaTela) || diasNaTela > 180;

  const iMin = valores.indexOf(min);
  const iMax = valores.indexOf(max);
  const iHoje = serie.length - 1;

  return (
    <svg className="grafico-taxa" viewBox={`0 0 ${width} ${height}`} role="img" aria-label={rotulo}>
      <defs>
        <linearGradient id="gt-area" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="var(--accent)" stopOpacity="0.22" />
          <stop offset="1" stopColor="var(--accent)" stopOpacity="0" />
        </linearGradient>
      </defs>

      {marcasY.map((v, i) => (
        <g key={i}>
          <line x1={L} y1={py(v)} x2={width - 6} y2={py(v)} stroke="var(--text)" strokeOpacity="0.06" />
          <text x={0} y={py(v) + 3} fontSize="9" fill="var(--muted)" fontFamily="var(--mono)">
            {fmtTaxa(v)}
          </text>
        </g>
      ))}

      {/* A média do período, tracejada. Ponta reta (butt) de propósito: a
          redonda come o vão do tracejado e a linha vira sólida — o mesmo
          detalhe que a legenda da Curva aprendeu. */}
      {media != null && media >= yMin && media <= yMax && (
        <g>
          <line
            x1={L}
            y1={py(media)}
            x2={width - 6}
            y2={py(media)}
            stroke="var(--muted)"
            strokeWidth="1"
            strokeDasharray="5 4"
            strokeLinecap="butt"
            opacity="0.75"
          />
          <text x={width - 6} y={py(media) - 4} fontSize="9" fill="var(--muted)" fontFamily="var(--mono)" textAnchor="end">
            média
          </text>
        </g>
      )}

      <path d={area} fill="url(#gt-area)" />
      <path d={linha} fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />

      {/* Mínimo e máximo como anéis, hoje como disco cheio: três pontos que
          respondem "onde estamos dentro do que já foi" sem precisar de legenda. */}
      <circle cx={px(iMin)} cy={py(min)} r="3" fill="var(--surface)" stroke="var(--accent)" strokeWidth="1.5" />
      <circle cx={px(iMax)} cy={py(max)} r="3" fill="var(--surface)" stroke="var(--accent)" strokeWidth="1.5" />
      <circle cx={px(iHoje)} cy={py(serie[iHoje].taxa)} r="4" fill="var(--accent)" />

      {marcasX.map((i, k) => (
        <text
          key={i}
          x={px(i)}
          y={height - 5}
          fontSize="9"
          fill="var(--muted)"
          fontFamily="var(--mono)"
          // A primeira e a última encostariam na borda com âncora central.
          textAnchor={k === 0 ? "start" : k === marcasX.length - 1 ? "end" : "middle"}
        >
          {rotuloData(serie[i].date, porMes)}
        </text>
      ))}
    </svg>
  );
}
