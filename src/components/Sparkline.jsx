// components/Sparkline.jsx — minigráfico de tendência, sem dependências.
// Decorativo (oculto para leitores de tela); a taxa e a variação ao lado
// carregam a informação real.
//
// A cor segue a direção do PREÇO, não da taxa: numa renda fixa, taxa subindo é
// preço caindo. Por isso `inverter` — as séries de taxa passam com ele ligado.

const COR = { up: "var(--up)", down: "var(--down)", flat: "var(--muted)" };

export function Sparkline({ points, width = 60, height = 22, pad = 3, inverter = false }) {
  if (!points || points.length < 2) {
    return <svg className="spark" width={width} height={height} aria-hidden="true" />;
  }
  const vals = points.map((p) => (typeof p === "number" ? p : p.taxa ?? p.close));
  const limpos = vals.filter((v) => v != null && Number.isFinite(v));
  if (limpos.length < 2) {
    return <svg className="spark" width={width} height={height} aria-hidden="true" />;
  }
  const min = Math.min(...limpos);
  const max = Math.max(...limpos);
  const range = max - min || 1;
  const innerH = height - pad * 2;
  const n = limpos.length;
  const d = limpos
    .map((c, i) => `${i ? "L" : "M"}${((i / (n - 1)) * width).toFixed(1)} ${(pad + (innerH - ((c - min) / range) * innerH)).toFixed(1)}`)
    .join(" ");
  const subiu = limpos[n - 1] > limpos[0];
  const desceu = limpos[n - 1] < limpos[0];
  let dir = subiu ? "up" : desceu ? "down" : "flat";
  if (inverter && dir !== "flat") dir = dir === "up" ? "down" : "up";
  return (
    <svg className="spark" width={width} height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" aria-hidden="true">
      <path d={d} fill="none" stroke={COR[dir]} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
