// components/CurvaChart.jsx — a curva de juros reais, sem dependências.
//
// Diferente do AreaChart: aqui o eixo X é o PRAZO em anos, que não é
// igualmente espaçado (há vencimentos em 3, 9 e 34 anos). Então o X é escalado
// de verdade, não por índice — senão a curva mentiria sobre a forma dela, que é
// justamente o que se quer ler.

const L = 34; // espaço à esquerda para os rótulos do eixo Y
const B = 18; // espaço abaixo para os rótulos do eixo X

export function CurvaChart({ series, height = 220, width = 366 }) {
  const comDados = (series || []).filter((s) => s.pontos && s.pontos.length >= 2);
  if (!comDados.length) return <svg className="curva" viewBox={`0 0 ${width} ${height}`} aria-hidden="true" />;

  const todos = comDados.flatMap((s) => s.pontos);
  const anosMin = Math.min(...todos.map((p) => p.anos));
  const anosMax = Math.max(...todos.map((p) => p.anos));
  const taxaMin = Math.min(...todos.map((p) => p.taxa));
  const taxaMax = Math.max(...todos.map((p) => p.taxa));
  const dx = anosMax - anosMin || 1;
  // Uma folga de 6% no eixo Y evita a linha encostar na borda do quadro.
  const folga = (taxaMax - taxaMin || 1) * 0.06;
  const yMin = taxaMin - folga;
  const yMax = taxaMax + folga;

  const px = (anos) => L + ((anos - anosMin) / dx) * (width - L - 6);
  const py = (taxa) => 6 + (1 - (taxa - yMin) / (yMax - yMin)) * (height - B - 12);

  const marcasY = [yMin + (yMax - yMin) * 0.15, (yMin + yMax) / 2, yMax - (yMax - yMin) * 0.15];
  const marcasX = [anosMin, (anosMin + anosMax) / 2, anosMax];

  return (
    <svg className="curva" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Curva de juros reais por prazo">
      {marcasY.map((t, i) => (
        <g key={i}>
          <line x1={L} y1={py(t)} x2={width - 6} y2={py(t)} stroke="var(--text)" strokeOpacity="0.06" />
          <text x={4} y={py(t) + 3} fontSize="9" fill="var(--muted)" fontFamily="var(--mono)">
            {t.toFixed(2)}%
          </text>
        </g>
      ))}
      {marcasX.map((a, i) => (
        <text key={i} x={px(a)} y={height - 4} fontSize="9" fill="var(--muted)" fontFamily="var(--mono)" textAnchor="middle">
          {a.toFixed(0)}a
        </text>
      ))}
      {comDados.map((s) => {
        const d = s.pontos.map((p, i) => `${i ? "L" : "M"}${px(p.anos).toFixed(1)} ${py(p.taxa).toFixed(1)}`).join(" ");
        return (
          <g key={s.id}>
            <path
              d={d}
              fill="none"
              stroke={s.cor}
              strokeWidth={s.forte ? 2 : 1.4}
              strokeDasharray={s.tracejado ? "4 3" : undefined}
              strokeLinejoin="round"
              strokeLinecap="round"
              opacity={s.forte ? 1 : 0.75}
            />
            {s.forte &&
              s.pontos.map((p, i) => (
                <circle key={i} cx={px(p.anos)} cy={py(p.taxa)} r={p.destaque ? 3.4 : 2} fill={p.destaque ? "var(--accent)" : s.cor} />
              ))}
          </g>
        );
      })}
    </svg>
  );
}
