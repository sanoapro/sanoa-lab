"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Row = { month: string; income_cents: number; expense_cents: number; net_cents: number };

function fmtMoney(cents: number, currency: any = "MXN") {
  return new Intl.NumberFormat("es-MX", { style: "currency", currency }).format((cents || 0) / 100);
}

export default function ReportFlow({
  orgId,
  from,
  to,
}: {
  orgId: string;
  from: string;
  to: string;
}) {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    fetch(`/api/bank/report/flow?org_id=${orgId}&from=${from}&to=${to}`)
      .then((r: any) => r.json())
      .then((j: any) => {
        if (!alive) return;
        if (j.ok) setRows(j.data);
      })
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [orgId, from, to]);

  if (loading) return <p className="text-sm text-slate-500">Cargando…</p>;
  if (!rows.length)
    return (
      <div className="mx-auto max-w-lg space-y-3 rounded-2xl border border-dashed border-white/60 bg-white/60 p-4 text-center text-sm text-contrast/80">
        <p className="font-medium text-contrast">Sin datos en el rango seleccionado.</p>
        <p>
          Ajusta las fechas o importa nuevos movimientos para analizar el flujo mensual de tu organización.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-2 text-sm font-medium">
          <Link href="/banco/tx" className="inline-flex items-center gap-2 rounded-xl border px-3 py-1.5 hover:bg-white/80">
            <span className="emoji">👀</span> Revisar transacciones
          </Link>
          <Link
            href="/banco/depositar"
            className="inline-flex items-center gap-2 rounded-xl border px-3 py-1.5 hover:bg-white/80"
          >
            <span className="emoji">➕</span> Registrar depósito
          </Link>
        </div>
      </div>
    );

  // Simple bar chart SVG (net by month)
  const max = Math.max(...rows.map((r: any) => Math.abs(r.net_cents)));
  const width = 480,
    height = 180,
    pad = 24;
  const barW = (width - pad * 2) / rows.length - 8;

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto">
        <svg width={width} height={height} role="img" aria-label="Flujo neto por mes">
          <line
            x1={pad}
            y1={height - pad}
            x2={width - pad}
            y2={height - pad}
            stroke="currentColor"
            opacity={0.2}
          />
          {rows.map((r: any, i: any) => {
            const x = pad + i * ((width - pad * 2) / rows.length);
            const h = max ? Math.round((Math.abs(r.net_cents) / max) * (height - pad * 2)) : 0;
            const isPos = r.net_cents >= 0;
            const y = isPos ? height - pad - h : height - pad;
            return (
              <g key={r.month}>
                <rect x={x} y={y} width={barW} height={h} rx={4} />
              </g>
            );
          })}
        </svg>
      </div>

      <table className="w-full text-sm">
        <thead className="bg-gray-50">
          <tr>
            <th className="text-left px-3 py-2">Mes</th>
            <th className="text-right px-3 py-2">Ingresos</th>
            <th className="text-right px-3 py-2">Gastos</th>
            <th className="text-right px-3 py-2">Neto</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r: any) => (
            <tr key={r.month} className="border-t">
              <td className="px-3 py-2">{r.month}</td>
              <td className="px-3 py-2 text-right">{fmtMoney(r.income_cents)}</td>
              <td className="px-3 py-2 text-right">{fmtMoney(r.expense_cents)}</td>
              <td
                className={`px-3 py-2 text-right ${r.net_cents >= 0 ? "text-emerald-700" : "text-rose-700"}`}
              >
                {fmtMoney(r.net_cents)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
