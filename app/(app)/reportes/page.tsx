"use client";
import { useEffect, useMemo, useState } from "react";
import { getActiveOrg } from "@/lib/org-local";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type KV = { metric: string; value: number };
type Pt = { month_start: string; total: number };

function Bar({ value, max }: { value: number; max: number }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return <div className="h-2 w-full bg-gray-100 dark:bg-white/10 rounded"><div className="h-2 rounded" style={{ width: `${pct}%`, background: "#D97A66" }} /></div>;
}

export default function ReportsPage() {
  const org = getActiveOrg();
  const [overview, setOverview] = useState<KV[]>([]);
  const [series, setSeries] = useState<{patients:Pt[];notes:Pt[];files:Pt[]}>({patients:[],notes:[],files:[]});
  const [months, setMonths] = useState(12);
  const [loading, setLoading] = useState(false);

  async function load() {
    if (!org.id) return;
    setLoading(true);
    try {
      const [ov, se] = await Promise.all([
        fetch(`/api/reports/overview?org=${org.id}`).then(r=>r.json()),
        fetch(`/api/reports/series?org=${org.id}&months=${months}`).then(r=>r.json()),
      ]);
      setOverview(ov.metrics || []);
      setSeries(se);
    } finally { setLoading(false); }
  }
  useEffect(()=>{ void load(); }, [org.id, months]);

  const maxPts = useMemo(()=> Math.max(0, ...series.patients.map(x=>x.total)), [series]);
  const maxNotes = useMemo(()=> Math.max(0, ...series.notes.map(x=>x.total)), [series]);
  const maxFiles = useMemo(()=> Math.max(0, ...series.files.map(x=>x.total)), [series]);
  const kv = (k: string) => overview.find(x=>x.metric===k)?.value ?? 0;
  const fmt = (m: string) => new Date(m).toLocaleDateString(undefined, { month:"short", year:"2-digit" });

  return (
    <div className="max-w-5xl mx-auto p-4 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">Reportes</h1>
        <div className="flex items-center gap-3">
          <label className="text-sm text-slate-600 dark:text-slate-200">Meses
            <Input className="ml-2 w-20 inline-block" type="number" value={months} onChange={(e)=>setMonths(Number(e.target.value||12))} />
          </label>
          <Button variant="secondary" onClick={()=>void load()} disabled={loading}>Actualizar</Button>
        </div>
      </div>

      <section className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <Card title="Pacientes totales" value={kv('patients_total')} />
        <Card title="Notas (30d)" value={kv('notes_30d')} />
        <Card title="Archivos (30d)" value={kv('files_30d')} />
        <Card title="Tareas abiertas" value={kv('work_open')} />
      </section>

      <Series title={`Pacientes nuevos (últimos ${months}m)`} rows={series.patients} max={maxPts} fmt={fmt} />
      <Series title={`Notas creadas (últimos ${months}m)`} rows={series.notes} max={maxNotes} fmt={fmt} />
      <Series title={`Archivos subidos (últimos ${months}m)`} rows={series.files} max={maxFiles} fmt={fmt} />

      <Cohorts />
    </div>
  );
}

function Card({ title, value }: { title: string; value: number }) {
  return (
    <div className="p-4 glass rounded-xl">
      <div className="text-sm text-slate-600 dark:text-slate-200">{title}</div>
      <div className="text-2xl font-semibold text-slate-900 dark:text-white">{Number(value).toLocaleString()}</div>
    </div>
  );
}

function Series({ title, rows, max, fmt }:{ title:string; rows:Pt[]; max:number; fmt:(s:string)=>string }) {
  return (
    <section className="space-y-2">
      <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{title}</h2>
      <div className="glass rounded-xl divide-y divide-black/5 dark:divide-white/10">
        {rows.map(p=>(
          <div key={p.month_start} className="p-3">
            <div className="flex items-center justify-between">
              <div className="text-sm text-slate-600 dark:text-slate-300">{fmt(p.month_start)}</div>
              <div className="text-sm text-slate-900 dark:text-white">{p.total}</div>
            </div>
            <Bar value={p.total} max={max} />
          </div>
        ))}
        {rows.length===0 && <div className="p-4 text-sm text-slate-600 dark:text-slate-300">Sin datos.</div>}
      </div>
    </section>
  );
}

function Cohorts() {
  const org = getActiveOrg();
  const [rows, setRows] = useState<any[]>([]);
  useEffect(()=>{ (async()=>{ if(!org.id) return; const j=await fetch(`/api/reports/cohorts?org=${org.id}`).then(r=>r.json()); setRows(j.cohorts||[]); })(); }, [org.id]);
  return (
    <section className="space-y-2">
      <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Cohortes (retención por mes de alta)</h2>
      <div className="glass rounded-xl overflow-auto">
        <table className="min-w-[640px] w-full text-sm">
          <thead className="bg-black/5 dark:bg-white/10">
            <tr>
              <th className="text-left p-2">Cohorte</th>
              <th className="text-right p-2">Usuarios</th>
              <th className="text-right p-2">Retorno 30d</th>
              <th className="text-right p-2">Retorno 90d</th>
              <th className="text-right p-2">Retorno 180d</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r:any)=>(
              <tr key={r.cohort_month} className="border-t border-black/5 dark:border-white/10">
                <td className="p-2">{new Date(r.cohort_month).toLocaleDateString(undefined,{month:"short", year:"numeric"})}</td>
                <td className="p-2 text-right">{r.users}</td>
                <td className="p-2 text-right">{r.returned_30}</td>
                <td className="p-2 text-right">{r.returned_90}</td>
                <td className="p-2 text-right">{r.returned_180}</td>
              </tr>
            ))}
            {rows.length===0 && <tr><td colSpan={5} className="p-3 text-slate-600 dark:text-slate-300">Sin datos.</td></tr>}
          </tbody>
        </table>
      </div>
    </section>
  );
}
