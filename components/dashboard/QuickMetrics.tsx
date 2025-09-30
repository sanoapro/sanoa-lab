"use client";

import Sparkline from "./Sparkline";
import Skeleton from "@/components/ui/Skeleton";

type MetricCardProps = {
  title: string;
  value: string | number;
  hint?: string;
  trend?: number[]; // puntos para sparkline
};

function MetricCard({ title, value, hint, trend }: MetricCardProps) {
  return (
    <div className="rounded-3xl border bg-white/95 p-6 hover:shadow-sm transition">
      <p className="text-sm text-slate-600">{title}</p>
      <div className="mt-2 flex items-end justify-between gap-3">
        <p className="text-3xl tracking-tight">{value}</p>
        {trend && trend.length > 1 ? (
          <div className="text-blue-600">
            <Sparkline points={trend} width={160} height={40} />
          </div>
        ) : null}
      </div>
      {hint && <p className="text-xs text-slate-500 mt-2">{hint}</p>}
    </div>
  );
}

export default function QuickMetrics({
  loading,
  nextAppointments,
  activePatients,
  monthIncomeMXN,
  incomeTrend,
}: {
  loading: boolean;
  nextAppointments?: number | null;
  activePatients?: number | null;
  monthIncomeMXN?: number | null;
  incomeTrend?: number[] | null;
}) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
      </div>
    );
  }
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <MetricCard
        title="Próximas citas (7 días)"
        value={nextAppointments ?? "—"}
        hint="Confirmadas en la última semana."
      />
      <MetricCard
        title="Pacientes activos"
        value={activePatients ?? "—"}
        hint="Con actividad en los últimos 90 días."
      />
      <MetricCard
        title="Ingresos del mes"
        value={
          typeof monthIncomeMXN === "number"
            ? monthIncomeMXN.toLocaleString("es-MX", { style: "currency", currency: "MXN" })
            : "—"
        }
        trend={incomeTrend ?? undefined}
        hint="Evolución reciente."
      />
    </div>
  );
}
