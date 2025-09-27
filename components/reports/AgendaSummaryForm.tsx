"use client";

import { useEffect, useMemo, useState } from "react";

type Summary = {
  org_id: string;
  from: string;
  to: string;
  tz: string;
  totals: { total:number; completed:number; no_show:number; cancelled:number; other:number; avg_duration_min:number; avg_lead_time_h:number; };
  by_day: Array<{ date:string; total:number; completed:number; no_show:number; cancelled:number; other:number; avg_duration_min:number; avg_lead_time_h:number; }>;
  by_resource: Array<{ resource:string; total:number; completed:number; no_show:number; cancelled:number; other:number; }>;
};

function iso(d: Date) { return d.toISOString().slice(0,10); }

export default function AgendaSummaryForm({ orgId }: { orgId: string }) {
  const today = useMemo(()=> new Date(),[]);
  const first = useMemo(()=> { const d=new Date(today); d.setDate(1); return d; },[today]);
  const [from, setFrom] = useState(iso(first));
  const [to, setTo] = useState(iso(today));
  const [tz, setTz] = useState("America/Mexico_City");
  const [resource, setResource] = useState("");
  const [sum, setSum] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(false);

  async function load() {
    setLoading(true);
    const p = new URLSearchParams({ org_id: orgId, from, to, tz });
    if (resource) p.set("resource", resource);
    const r = await fetch(`/api/reports/agenda/summary/json?${p.toString()}`);
    const j = await r.json();
    setSum(j?.ok ? j.data : null);
    setLoading(false);
  }

  const base = typeof window !== "undefined" ? window.location.origin : "";

  return (
    <section className="rounded-2xl border p-4 space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
        <div>
          <label className="block text-sm mb-1">Desde</label>
          <input type="date" className="rounded border px-3 py-2 w-full" value={from} onChange={e=>setFrom(e.target.value)} />
        </div>
        <div>
          <label className="block text-sm mb-1">Hasta</label>
          <input type="date" className="rounded border px-3 py-2 w-full" value={to} onChange={e=>setTo(e.target.value)} />
        </div>
        <div>
          <label className="block text-sm mb-1">Recurso (opcional)</label>
          <input className="rounded border px-3 py-2 w-full" value={resource} onChange={e=>setResource(e.target.value)} placeholder="ID o nombre" />
        </div>
        <div>
          <label className="block text-sm mb-1">Zona horaria</label>
          <input className="rounded border px-3 py-2 w-full" value={tz} onChange={e=>setTz(e.target.value)} />
        </div>
        <div className="flex gap-2">
          <button className="rounded px-4 py-2 border w-full" onClick={load}>Previsualizar</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <a
          href={`${base}/api/reports/agenda/summary/pdf?org_id=${orgId}&from=${from}&to=${to}&tz=${encodeURIComponent(tz)}${resource?`&resource=${encodeURIComponent(resource)}`:""}`}
          className="inline-flex items-center justify-center rounded-xl border px-4 py-3 hover:bg-gray-50"
        >
          Descargar PDF
        </a>
        <a
          href={`${base}/api/reports/agenda/summary/xlsx?org_id=${orgId}&from=${from}&to=${to}&tz=${encodeURIComponent(tz)}${resource?`&resource=${encodeURIComponent(resource)}`:""}`}
          className="inline-flex items-center justify-center rounded-xl border px-4 py-3 hover:bg-gray-50"
        >
          Descargar XLSX
        </a>
      </div>

      {loading && <p className="text-center py-6">Procesando…</p>}

      {sum && !loading && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Metric label="Total" value={sum.totals.total} />
            <Metric label="Completadas" value={sum.totals.completed} />
            <Metric label="No-show" value={sum.totals.no_show} />
            <Metric label="Canceladas" value={sum.totals.cancelled} />
            <Metric label="Duración prom. (min)" value={sum.totals.avg_duration_min} />
            <Metric label="Lead-time prom. (h)" value={sum.totals.avg_lead_time_h} />
          </div>

          <div className="rounded-2xl border overflow-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <Th>Fecha</Th><Th>T</Th><Th>Comp.</Th><Th>No-show</Th><Th>Cancel</Th><Th>Otras</Th><Th>Dur (min)</Th><Th>Lead (h)</Th>
                </tr>
              </thead>
              <tbody>
                {sum.by_day.map((d)=>(
                  <tr key={d.date} className="border-t">
                    <Td>{d.date}</Td><Td>{d.total}</Td><Td>{d.completed}</Td><Td>{d.no_show}</Td><Td>{d.cancelled}</Td><Td>{d.other}</Td><Td>{d.avg_duration_min}</Td><Td>{d.avg_lead_time_h}</Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="rounded-2xl border overflow-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <Th>Recurso</Th><Th>T</Th><Th>Comp.</Th><Th>No-show</Th><Th>Cancel</Th><Th>Otras</Th>
                </tr>
              </thead>
              <tbody>
                {sum.by_resource.map((r)=>(
                  <tr key={r.resource} className="border-t">
                    <Td>{r.resource}</Td><Td>{r.total}</Td><Td>{r.completed}</Td><Td>{r.no_show}</Td><Td>{r.cancelled}</Td><Td>{r.other}</Td>
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

function Metric({ label, value }: { label:string; value:number|string }) {
  return (
    <div className="rounded-xl border px-4 py-3 bg-white/60">
      <div className="text-xs text-slate-500">{label}</div>
      <div className="text-xl font-semibold">{value}</div>
    </div>
  );
}
function Th({ children }: { children: React.ReactNode }) {
  return <th className="text-left px-3 py-2">{children}</th>;
}
function Td({ children }: { children: React.ReactNode }) {
  return <td className="px-3 py-2">{children}</td>;
}
