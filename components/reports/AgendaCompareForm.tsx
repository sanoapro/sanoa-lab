"use client";

import { useMemo, useState } from "react";

type Sum = {
  totals: {
    total: number;
    completed: number;
    no_show: number;
    cancelled: number;
    other: number;
    avg_duration_min: number;
    avg_lead_time_h: number;
  };
  by_day: any[];
  by_resource: any[];
};
type Resp = { ok: boolean; data: { A: Sum; B: Sum; delta_pct: Record<string, number> } };

function iso(d: Date) {
  return d.toISOString().slice(0, 10);
}
function Box({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-xl border px-4 py-3 bg-white/60">
      <div className="text-xs text-slate-500">{label}</div>
      <div className="text-xl font-semibold">{value}</div>
    </div>
  );
}

export default function AgendaCompareForm({ orgId }: { orgId: string }) {
  const today = useMemo(() => new Date(), []);
  const first = useMemo(() => {
    const d = new Date(today);
    d.setDate(1);
    return d;
  }, [today]);
  const prevFirst = useMemo(() => {
    const d = new Date(first);
    d.setMonth(d.getMonth() - 1);
    return d;
  }, [first]);
  const prevLast = useMemo(() => {
    const d = new Date(first);
    d.setDate(0);
    return d;
  }, [first]);

  const [fromA, setFromA] = useState(iso(first));
  const [toA, setToA] = useState(iso(today));
  const [fromB, setFromB] = useState(iso(prevFirst));
  const [toB, setToB] = useState(iso(prevLast));
  const [tz, setTz] = useState("America/Mexico_City");
  const [resource, setResource] = useState("");
  const [data, setData] = useState<Resp["data"] | null>(null);
  const [loading, setLoading] = useState(false);

  async function load() {
    setLoading(true);
    const p = new URLSearchParams({ org_id: orgId, fromA, toA, fromB, toB, tz });
    if (resource) p.set("resource", resource);
    const r = await fetch(`/api/reports/agenda/compare/json?${p.toString()}`);
    const j: Resp = await r.json();
    setData(j.ok ? j.data : null);
    setLoading(false);
  }

  const base = typeof window !== "undefined" ? window.location.origin : "";

  return (
    <section className="rounded-2xl border p-4 space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-6 gap-3 items-end">
        <div>
          <label className="block text-sm mb-1">A: Desde</label>
          <input
            type="date"
            className="rounded border px-3 py-2 w-full"
            value={fromA}
            onChange={(e: any) => setFromA(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm mb-1">A: Hasta</label>
          <input
            type="date"
            className="rounded border px-3 py-2 w-full"
            value={toA}
            onChange={(e: any) => setToA(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm mb-1">B: Desde</label>
          <input
            type="date"
            className="rounded border px-3 py-2 w-full"
            value={fromB}
            onChange={(e: any) => setFromB(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm mb-1">B: Hasta</label>
          <input
            type="date"
            className="rounded border px-3 py-2 w-full"
            value={toB}
            onChange={(e: any) => setToB(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm mb-1">Recurso (opcional)</label>
          <input
            className="rounded border px-3 py-2 w-full"
            value={resource}
            onChange={(e: any) => setResource(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm mb-1">Zona horaria</label>
          <input
            className="rounded border px-3 py-2 w-full"
            value={tz}
            onChange={(e: any) => setTz(e.target.value)}
          />
        </div>
      </div>

      <div className="flex gap-2">
        <button className="rounded px-4 py-2 border" onClick={load}>
          Comparar
        </button>
        <a
          href={`${base}/api/reports/agenda/compare/xlsx?org_id=${orgId}&fromA=${fromA}&toA=${toA}&fromB=${fromB}&toB=${toB}&tz=${encodeURIComponent(tz)}${resource ? `&resource=${encodeURIComponent(resource)}` : ""}`}
          className="rounded px-4 py-2 border"
        >
          Descargar XLSX
        </a>
      </div>

      {loading && <p className="py-4 text-center">Procesando…</p>}
      {data && !loading && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
            <Box label="Total A" value={data.A.totals.total} />
            <Box label="Total B" value={data.B.totals.total} />
            <Box label="Δ Total %" value={`${data.delta_pct.total}%`} />
            <Box label="No-show A" value={data.A.totals.no_show} />
            <Box label="No-show B" value={data.B.totals.no_show} />
            <Box label="Δ No-show %" value={`${data.delta_pct.no_show}%`} />
          </div>

          <div className="rounded-2xl border overflow-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <Th>Periodo</Th>
                  <Th>Recurso</Th>
                  <Th>T</Th>
                  <Th>Comp.</Th>
                  <Th>No-show</Th>
                  <Th>Cancel</Th>
                  <Th>Otras</Th>
                </tr>
              </thead>
              <tbody>
                {data.A.by_resource.map((r: any) => (
                  <tr key={`A-${r.resource}`} className="border-t">
                    <Td>A</Td>
                    <Td>{r.resource}</Td>
                    <Td>{r.total}</Td>
                    <Td>{r.completed}</Td>
                    <Td>{r.no_show}</Td>
                    <Td>{r.cancelled}</Td>
                    <Td>{r.other}</Td>
                  </tr>
                ))}
                {data.B.by_resource.map((r: any) => (
                  <tr key={`B-${r.resource}`} className="border-t">
                    <Td>B</Td>
                    <Td>{r.resource}</Td>
                    <Td>{r.total}</Td>
                    <Td>{r.completed}</Td>
                    <Td>{r.no_show}</Td>
                    <Td>{r.cancelled}</Td>
                    <Td>{r.other}</Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="text-left px-3 py-2">{children}</th>;
}
function Td({ children }: { children: React.ReactNode }) {
  return <td className="px-3 py-2">{children}</td>;
}
