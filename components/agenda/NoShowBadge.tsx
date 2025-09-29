// components/agenda/NoShowBadge.tsx
"use client";
export default function NoShowBadge({ score }: { score: number }) {
  const color =
    score >= 70
      ? "bg-rose-100 text-rose-700 border-rose-200"
      : score >= 40
        ? "bg-amber-100 text-amber-700 border-amber-200"
        : "bg-emerald-100 text-emerald-700 border-emerald-200";
  const label = score >= 70 ? "Alto" : score >= 40 ? "Medio" : "Bajo";
  return (
    <span
      className={`inline-flex items-center gap-1 text-xs border rounded-full px-2 py-1 ${color}`}
      aria-label={`Riesgo no-show: ${label}`}
    >
      Riesgo: <strong>{label}</strong> ({score})
    </span>
  );
}
