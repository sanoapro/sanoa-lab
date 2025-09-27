"use client";

import { useEffect, useMemo, useState } from "react";
import { isE164, normalizeE164 } from "@/lib/templates";

type Row = {
  patient_key: string;
  patient_name: string;
  total: number;
  no_show: number;
  completed: number;
  cancelled: number;
  ns_rate: number;
  ns_streak: number;
  days_since_attended: number | null;
  risk_score: number;
  risk_band: "low"|"med"|"high";
};

function iso(d: Date) { return d.toISOString().slice(0,10); }

export default function AgendaPatientRisk({ orgId }: { orgId: string }) {
  const today = useMemo(()=> new Date(), []);
  const first = useMemo(()=> { const d=new Date(today); d.setMonth(d.getMonth()-1); d.setDate(1); return d; }, [today]);
  const [from, setFrom] = useState(iso(first));
  const [to, setTo] = useState(iso(today));
  const [tz, setTz] = useState("America/Mexico_City");
  const [minN, setMinN] = useState(3);
  const [top, setTop] = useState(50);
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);

  // vistas guardadas
  const scope = "risk_patients";
  const [views, setViews] = useState<{ id:string; name:string; filters:any }[]>([]);
  const [viewName, setViewName] = useState("");

  async function load() {
    setLoading(true);
    const p = new URLSearchParams({ org_id: orgId, from, to, tz, min_n:String(minN), top:String(top) });
    const r = await fetch(`/api/reports/agenda/risk/patients/json?${p.toString()}`);
    const j = await r.json();
    setRows(j?.ok ? j.data : []);
    setLoading(false);
  }

  async function loadViews() {
    const p = new URLSearchParams({ org_id: orgId, scope });
    const r = await fetch(`/api/saved-views/list?${p.toString()}`);
    const j = await r.json();
    setViews(j?.ok ? j.data : []);
  }

  useEffect(()=>{ load(); loadViews(); }, [orgId]);

  function applyView(v: any) {
    const f = v.filters || {};
    if (f.from) setFrom(f.from);
    if (f.to) setTo(f.to);
    if (f.tz) setTz(f.tz);
    if (typeof f.min_n === "number") setMinN(f.min_n);
    if (typeof f.top === "number") setTop(f.top);
  }

  async function saveView() {
    if (!viewName.trim()) { alert("Ponle un nombre a la vista"); return; }
    const body = { org_id: orgId, scope, name: viewName.trim(), filters: { from, to, tz, min_n: minN, top } };
    const r = await fetch("/api/saved-views/upsert", { method:"POST", headers:{ "content-type":"application/json" }, body: JSON.stringify(body) });
    const j = await r.json();
    if (!j.ok) alert(j.error?.message ?? "No se pudo guardar"); else loadViews();
  }

  async function sendReminder(phone: string, name: string) {
    const norm = normalizeE164(phone);
    if (!isE164(norm)) { alert("Teléfono inválido (usa formato E.164: +52...)"); return; }
    const body = {
      org_id: orgId,
      item: {
        channel: "whatsapp",
        target: norm,
        template: "recordatorio_riesgo",
        schedule_at: new Date().toISOString(),
        meta: { message: `Hola ${name}, te esperamos en tu próxima cita. Si necesitas reagendar, contesta este mensaje.` }
      }
    };
    const r = await fetch("/api/reminders/schedule", { method:"POST", headers:{ "content-type":"application/json" }, body: JSON.stringify(body) });
    const j = await r.json();
    if (!j.ok) alert(j.error?.message ?? "No se pudo enviar");
  }

  const base = typeof window !== "undefined" ? window.location.origin : "";

  return (
    <section className="rounded-2xl border p-4 space-y-4">
      {/* Filtros */}
      <div className="grid grid-cols-1 md:grid-cols-7 gap-3 items-end">
        <div><label className="block text-sm mb-1">Desde</label><input type="date" className="rounded border px-3 py-2 w-full" value={from} onChange={e=>setFrom(e.target.value)} /></div>
        <div><label className="block text-sm mb-1">Hasta</label><input type="date" className="rounded border px-3 py-2 w-full" value={to} onChange={e=>setTo(e.target.value)} /></div>
        <div><label className="block text-sm mb-1">TZ</label><input className="rounded border px-3 py-2 w-full" value={tz} onChange={e=>setTz(e.target.value)} /></div>
        <div><label className="block text-sm mb-1">Mín citas</label><input type="number" min={1} className="rounded border px-3 py-2 w-full" value={minN} onChange={e=>setMinN(Math.max(1, parseInt(e.target.value||"1",10)))} /></div>
        <div><label className="block text-sm mb-1">Top N</label><input type="number" min={1} className="rounded border px-3 py-2 w-full" value={top} onChange={e=>setTop(Math.max(1, parseInt(e.target.value||"1",10)))} /></div>
        <div className="flex gap-2">
          <button className="rounded px-4 py-2 border w-full" onClick={load}>Aplicar</button>
          <a
            href={`${base}/api/export/agenda/risk/patients/xlsx?org_id=${orgId}&from=${from}&to=${to}&tz=${encodeURIComponent(tz)}&min_n=${minN}&top=${top}`}
            className="rounded px-4 py-2 border w-full text-center"
          >XLSX</a>
        </div>
        <div className="flex gap-2">
          <select className="rounded border px-3 py-2 w-full" onChange={e=>{
            const v = views.find(x=>x.id===e.target.value);
            if (v) applyView(v);
          }}>
            <option value="">Vistas guardadas…</option>
            {views.map(v=> <option key={v.id} value={v.id}>{v.name}</option>)}
          </select>
        </div>
      </div>

      {/* Guardar vista */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
        <div className="md:col-span-3">
          <label className="block text-sm mb-1">Nombre de la vista</label>
          <input className="rounded border px-3 py-2 w-full" value={viewName} onChange={e=>setViewName(e.target.value)} placeholder="Ej. Últimos 90 días, Top 100" />
        </div>
        <div>
          <button className="rounded px-4 py-2 border w-full" onClick={saveView}>Guardar vista</button>
        </div>
      </div>

      {/* Tabla */}
      <div className="rounded-2xl border overflow-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <Th>Riesgo</Th><Th>Paciente</Th><Th>Citas</Th><Th>No-show</Th><Th>Tasa</Th><Th>Racha NS</Th><Th>Días desde atendida</Th><Th>Acciones</Th>
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={8} className="px-3 py-6 text-center">Procesando…</td></tr>}
            {!loading && rows.length === 0 && <tr><td colSpan={8} className="px-3 py-6 text-center">Sin resultados para el rango seleccionado.</td></tr>}
            {rows.map(r => (
              <tr key={r.patient_key} className="border-t hover:bg-gray-50">
                <td className="px-3 py-2">
                  <span
                    className={
                      "inline-flex items-center gap-2 px-2 py-1 rounded-full text-xs " +
                      (r.risk_band === "high" ? "bg-rose-100 text-rose-800" :
                       r.risk_band === "med" ? "bg-amber-100 text-amber-800" :
                       "bg-emerald-100 text-emerald-800")
                    }
                    aria-label={`Riesgo ${r.risk_band}`}
                  >
                    ● {Math.round(r.risk_score*100)}%
                  </span>
                </td>
                <td className="px-3 py-2">{r.patient_name}</td>
                <Td>{r.total}</Td>
                <Td>{r.no_show}</Td>
                <Td>{Math.round(r.ns_rate*100)}%</Td>
                <Td>{r.ns_streak}</Td>
                <Td>{r.days_since_attended ?? "—"}</Td>
                <td className="px-3 py-2">
                  <div className="flex flex-wrap gap-2 items-center">
                    <input
                      aria-label="Teléfono para recordatorio"
                      placeholder="+52..."
                      className="rounded border px-2 py-1 w-36"
                      id={`tel-${r.patient_key}`}
                      onKeyDown={(e)=>{
                        if (e.key === "Enter") {
                          const val = (e.target as HTMLInputElement).value;
                          sendReminder(val, r.patient_name);
                        }
                      }}
                    />
                    <button className="rounded px-3 py-1 border" onClick={()=>{
                      const val = (document.getElementById(`tel-${r.patient_key}`) as HTMLInputElement)?.value || "";
                      sendReminder(val, r.patient_name);
                    }}>Recordar WA</button>
                    <a className="rounded px-3 py-1 border" href={`/pacientes?q=${encodeURIComponent(r.patient_name)}`}>Ver paciente</a>
                    <a className="rounded px-3 py-1 border" href={`/agenda`}>Reagendar</a>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-slate-500">
        Nota: el score es heurístico (proporción de no-shows, racha y recencia). Úsalo como apoyo para prevención, no como diagnóstico.
      </p>
    </section>
  );
}

function Th({ children }: { children: React.ReactNode }) { return <th className="text-left px-3 py-2">{children}</th>; }
function Td({ children }: { children: React.ReactNode }) { return <td className="px-3 py-2">{children}</td>; }
