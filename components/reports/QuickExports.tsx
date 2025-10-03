"use client";

import { useMemo, useState } from "react";

function iso(d: Date) {
  return d.toISOString().slice(0, 10);
}

export default function QuickExports({ orgId }: { orgId: string }) {
  const today = useMemo(() => new Date(), []);
  const firstDay = useMemo(() => {
    const d = new Date(today);
    d.setDate(1);
    return d;
  }, [today]);
  const [from, setFrom] = useState(iso(firstDay));
  const [to, setTo] = useState(iso(today));
  const [tag, setTag] = useState("");

  const base = typeof window !== "undefined" ? window.location.origin : "";

  return (
    <section className="rounded-2xl border p-4 space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
        <div>
          <label className="block text-sm mb-1">Desde</label>
          <input
            type="date"
            className="rounded border px-3 py-2 w-full"
            value={from}
            onChange={(e: any) => setFrom(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm mb-1">Hasta</label>
          <input
            type="date"
            className="rounded border px-3 py-2 w-full"
            value={to}
            onChange={(e: any) => setTo(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm mb-1">Tag (métricas por tag)</label>
          <input
            className="rounded border px-3 py-2 w-full"
            value={tag}
            onChange={(e: any) => setTag(e.target.value)}
            placeholder="opcional"
          />
        </div>
        <div className="text-sm text-slate-600">
          Periodo seleccionado: <strong>{from}</strong> → <strong>{to}</strong>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <a
          href={`${base}/api/export/pacientes/xlsx?org_id=${orgId}&from=${from}&to=${to}&page=1&pageSize=5000`}
          className="inline-flex items-center justify-center rounded-xl border px-4 py-3 hover:bg-gray-50"
        >
          Descargar Pacientes XLSX
        </a>
        <a
          href={`${base}/api/export/agenda/xlsx?org_id=${orgId}&from=${from}&to=${to}`}
          className="inline-flex items-center justify-center rounded-xl border px-4 py-3 hover:bg-gray-50"
        >
          Descargar Agenda XLSX
        </a>
        <a
          href={`${base}/api/export/metrics/monthly/xlsx?org_id=${orgId}&from=${from}&to=${to}`}
          className="inline-flex items-center justify-center rounded-xl border px-4 py-3 hover:bg-gray-50"
        >
          Métricas mensuales XLSX
        </a>
        <a
          href={`${base}/api/export/metrics/by-tag/xlsx?org_id=${orgId}&from=${from}&to=${to}${tag ? `&tag=${encodeURIComponent(tag)}` : ""}`}
          className="inline-flex items-center justify-center rounded-xl border px-4 py-3 hover:bg-gray-50"
        >
          Métricas por tag XLSX
        </a>
        <a
          href={`${base}/api/export/cohortes/xlsx?org_id=${orgId}&from=${from}&to=${to}`}
          className="inline-flex items-center justify-center rounded-xl border px-4 py-3 hover:bg-gray-50"
        >
          Cohortes XLSX
        </a>
      </div>

      <p className="text-xs text-slate-500">
        Los archivos se generan al momento. Si un reporte no tiene datos para el rango elegido, la
        hoja se entrega vacía.
      </p>
    </section>
  );
}
