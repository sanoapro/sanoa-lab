"use client";

type Props = {
  points: number[];       // valores en orden temporal
  width?: number;         // px
  height?: number;        // px
  strokeWidth?: number;
  ariaLabel?: string;
};

export default function Sparkline({
  points,
  width = 220,
  height = 64,
  strokeWidth = 2,
  ariaLabel = "Tendencia",
}: Props) {
  const w = Math.max(10, width);
  const h = Math.max(10, height);
  const data = points.length ? points : [0];
  const min = Math.min(...data);
  const max = Math.max(...data);
  const span = max - min || 1;
  const stepX = data.length > 1 ? w / (data.length - 1) : w;

  const d = data
    .map((v, i) => {
      const x = i * stepX;
      const y = h - ((v - min) / span) * h;
      return `${i === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(" ");

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-label={ariaLabel} role="img">
      <path d={d} fill="none" stroke="currentColor" strokeWidth={strokeWidth} />
    </svg>
  );
}
