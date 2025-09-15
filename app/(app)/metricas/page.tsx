"use client";

import { useEffect, useMemo, useState } from "react";
import { metricsPatientsByTag, metricsNewPatientsByMonth, metricsNotesByMonth, type TagMetric, type MonthMetric } from "@/lib/metrics";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

function Bar({ value, max }: { value: number; max: number }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return <div className="h-2 w-full bg-gray-100 rounded"><div className="h-2 rounded" style={{ width: `${pct}%`, background: "#D97A66" }} /></div>;
}

export default function MetricsPage() {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [onlyOrg, setOnlyOrg] = useState(true);

  const [byTag, setByTag] = useState<TagMetric[]>([]);
  const [ptByMonth, setPtByMonth] = useState<MonthMetric[]>([]);
  const [notesByMonth, setNotesByMonth] = useState<MonthMetric[]>([]);
  const [loading, setLoading] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const [t, p, n] = await Promise.all([
        metricsPatientsByTag(from || undefined, to || undefined, onlyOrg),
        metricsNewPatientsByMonth(12, onlyOrg),
        metricsNotesByMonth(12, onlyOrg),
      ]);
      setByTag(t); setPtByMonth(p); setNotesByMonth(n);
    } finally { setLoading(false); }
  }

  useEffect(() => { void load(); }, []);

  const maxTag = useMemo(() => Math.max(0, ...byTag.map(x => Number(x.total))), [byTag]);

  return (
    <div className="max-w-5xl mx-auto p-4 space-y-6">
      <h1 className="text-2xl font-semibold">Métricas</h1>

      <div className="border rounded-xl p-4 bg-white grid grid-cols-1 sm:grid-cols-6 gap-3">
        <div className="sm:col-span-2">
          <span className="block text-sm text-gray-600">Desde</span>
          <Input type="date" value={from} onChange={(e)=>setFrom(e.target.value)} />
        </div>
        <div className="sm:col-span-2">
          <span className="block text-sm text-gray-600">Hasta</span>
          <Input type="date" value={to} onChange={(e)=>setTo(e.target.value)} />
        </div>
        <label className="text-sm flex items-center gap-2 justify-center">
          <input type="checkbox" checked={onlyOrg} onChange={(e)=>setOnlyOrg(e.target.checked)} />
          Sólo org activa
        </label>
        <Button onClick={()=>void load()} disabled={loading}>Actualizar</Button>
      </div>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Pacientes por etiqueta</h2>
        <div className="border rounded-xl divide-y bg-white">
          {byTag.length === 0 && <div className="p-4 text-sm text-gray-600">{loading ? "Cargando…" : "Sin datos."}</div>}
          {byTag.map(row => (
            <div key={row.tag_id} className="p-3">
              <div className="flex items-center justify-between">
                <div className="font-medium">{row.tag_name}</div>
                <div className="text-sm text-gray-600">{row.total}</div>
              </div>
              <Bar value={Number(row.total)} max={maxTag} />
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Pacientes nuevos por mes (12m)</h2>
        <div className="border rounded-xl p-4 bg-white grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
          {ptByMonth.map(m => (
            <div key={m.month_start} className="text-center">
              <div className="text-xs text-gray-600">{new Date(m.month_start).toLocaleDateString(undefined,{ month:"short", year:"2-digit"})}</div>
              <div className="text-lg font-semibold">{m.total}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Notas creadas por mes (12m)</h2>
        <div className="border rounded-xl p-4 bg-white grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
          {notesByMonth.map(m => (
            <div key={m.month_start} className="text-center">
              <div className="text-xs text-gray-600">{new Date(m.month_start).toLocaleDateString(undefined,{ month:"short", year:"2-digit"})}</div>
              <div className="text-lg font-semibold">{m.total}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}