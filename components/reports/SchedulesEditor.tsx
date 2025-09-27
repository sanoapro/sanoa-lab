"use client";

import { useEffect, useState } from "react";
import { isE164, isEmail, normalizeE164 } from "@/lib/templates";

type Item = {
  id: string;
  org_id: string;
  name: string;
  report: string;
  channel: "whatsapp"|"sms"|"email";
  target: string;
  frequency: "daily"|"weekly";
  at_hour: number;
  at_minute: number;
  dow: number[] | null; // 0..6 Sunday..Saturday
  tz: string;
  params: Record<string, any> | null;
  is_active: boolean;
  last_run_at: string | null;
  updated_at: string;
};

export default function SchedulesEditor({ orgId }: { orgId: string }) {
  const [list, setList] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<Partial<Item>>({
    name: "Resumen diario",
    report: "daily_summary",
    channel: "whatsapp",
    target: "+5215512345678",
    frequency: "daily",
    at_hour: 9,
    at_minute: 0,
    dow: [1,2,3,4,5],
    tz: "America/Mexico_City",
    is_active: true,
  });

  function load() {
    setLoading(true);
    fetch(`/api/reports/schedules?org_id=${orgId}`)
      .then(r=>r.json())
      .then(j=>{ if (j.ok) setList(j.data); })
      .finally(()=> setLoading(false));
  }
  useEffect(()=>{ load(); }, [orgId]);

  function validateTarget(): { ok: boolean; msg: string } {
    const ch = form.channel ?? "whatsapp";
    const t = (form.target ?? "").trim();
    if (!t) return { ok: false, msg: "Destino requerido" };
    if (ch === "email") {
      return isEmail(t) ? { ok: true, msg: "Email válido" } : { ok: false, msg: "Email inválido" };
    }
    const norm = normalizeE164(t);
    return isE164(norm) ? { ok: true, msg: "E.164 válido" } : { ok: false, msg: "Usa formato +<código><número>" };
  }

  async function save() {
    const vt = validateTarget();
    if (!vt.ok) { alert(`Destino inválido: ${vt.msg}`); return; }
    const body = { ...form, org_id: orgId };
    const r = await fetch("/api/reports/schedules", {
      method:"POST", headers:{ "content-type":"application/json" },
      body: JSON.stringify(body)
    });
    const j = await r.json();
    if (j.ok) { load(); }
    else { alert(j.error?.message ?? "No se pudo guardar"); }
  }

  return (
    <section className="grid grid-cols-1 md:grid-cols-5 gap-6">
      {/* Lista */}
      <div className="md:col-span-3">
        <div className="rounded-2xl border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-3 py-2">Nombre</th>
                <th className="text-left px-3 py-2">Canal</th>
                <th className="text-left px-3 py-2">Frecuencia</th>
                <th className="text-left px-3 py-2">Horario</th>
                <th className="text-left px-3 py-2">Activo</th>
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={5} className="px-3 py-6 text-center">Cargando…</td></tr>}
              {!loading && list.length===0 && <tr><td colSpan={5} className="px-3 py-6 text-center">Sin programaciones.</td></tr>}
              {list.map(it => (
                <tr key={it.id} className="border-t hover:bg-gray-50">
                  <td className="px-3 py-2">
                    <button className="underline underline-offset-2" onClick={()=>setForm(it)}>{it.name}</button>
                  </td>
                  <td className="px-3 py-2">{it.channel.toUpperCase()}</td>
                  <td className="px-3 py-2">
                    {it.frequency === "daily" ? "Diaria" : `Semanal (${(it.dow ?? []).join(",")})`}
                  </td>
                  <td className="px-3 py-2">{String(it.at_hour).padStart(2,"0")}:{String(it.at_minute).padStart(2,"0")} ({it.tz})</td>
                  <td className="px-3 py-2">{it.is_active ? "Sí" : "No"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Editor */}
      <div className="md:col-span-2 space-y-3">
        <div>
          <label className="block text-sm mb-1">Nombre</label>
          <input className="rounded border px-3 py-2 w-full" value={form.name ?? ""} onChange={e=>setForm(f=>({ ...f, name: e.target.value }))} />
        </div>

        <div>
          <label className="block text-sm mb-1">Reporte</label>
          <select className="rounded border px-3 py-2 w-full" value={form.report ?? "daily_summary"} onChange={e=>setForm(f=>({ ...f, report: e.target.value }))}>
            <option value="daily_summary">Resumen diario</option>
          </select>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div>
            <label className="block text-sm mb-1">Canal</label>
            <select className="rounded border px-3 py-2 w-full" value={form.channel ?? "whatsapp"} onChange={e=>setForm(f=>({ ...f, channel: e.target.value as any }))}>
              <option value="whatsapp">WhatsApp</option>
              <option value="sms">SMS</option>
              <option value="email">Email</option>
            </select>
          </div>
          <div className="col-span-2">
            <label className="block text-sm mb-1">Destino</label>
            <input className="rounded border px-3 py-2 w-full" placeholder="+52... o correo" value={form.target ?? ""} onChange={e=>setForm(f=>({ ...f, target: e.target.value }))} />
            {/* Feedback de validación */}
            <p className={`text-xs mt-1 ${
              (form.target ?? "").trim()
                ? (form.channel === "email"
                    ? (isEmail((form.target ?? "").trim()) ? "text-green-700" : "text-rose-700")
                    : (isE164(normalizeE164((form.target ?? "").trim())) ? "text-green-700" : "text-rose-700"))
                : "text-slate-500"
              }`}>
              {!(form.target ?? "").trim()
                ? "Introduce el destino"
                : form.channel === "email"
                  ? (isEmail((form.target ?? "").trim()) ? "Email válido" : "Email inválido")
                  : (isE164(normalizeE164((form.target ?? "").trim())) ? "E.164 válido (+...)" : "Formato inválido: +<código><número>")}
            </p>
          </div>
        </div>

        <div>
          <label className="block text-sm mb-1">Frecuencia</label>
          <select className="rounded border px-3 py-2 w-full" value={form.frequency ?? "daily"} onChange={e=>setForm(f=>({ ...f, frequency: e.target.value as any }))}>
            <option value="daily">Diaria</option>
            <option value="weekly">Semanal</option>
          </select>
        </div>

        {form.frequency === "weekly" && (
          <div>
            <label className="block text-sm mb-1">Días (0=Dom .. 6=Sáb)</label>
            <input className="rounded border px-3 py-2 w-full" placeholder="Ej: 1,2,3,4,5" value={(form.dow ?? []).join(",")} onChange={e=>{
              const arr = e.target.value.split(",").map(s=>parseInt(s,10)).filter(n=>Number.isFinite(n)&&n>=0&&n<=6);
              setForm(f=>({ ...f, dow: arr }));
            }} />
          </div>
        )}

        <div className="grid grid-cols-3 gap-2">
          <div>
            <label className="block text-sm mb-1">Hora</label>
            <input type="number" min={0} max={23} className="rounded border px-3 py-2 w-full" value={form.at_hour ?? 9} onChange={e=>setForm(f=>({ ...f, at_hour: Math.max(0, Math.min(23, parseInt(e.target.value||"0",10))) }))} />
          </div>
          <div>
            <label className="block text-sm mb-1">Minuto</label>
            <input type="number" min={0} max={59} className="rounded border px-3 py-2 w-full" value={form.at_minute ?? 0} onChange={e=>setForm(f=>({ ...f, at_minute: Math.max(0, Math.min(59, parseInt(e.target.value||"0",10))) }))} />
          </div>
          <div>
            <label className="block text-sm mb-1">Zona horaria (IANA)</label>
            <input className="rounded border px-3 py-2 w-full" value={form.tz ?? "America/Mexico_City"} onChange={e=>setForm(f=>({ ...f, tz: e.target.value }))} />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-sm">
            <input type="checkbox" className="mr-2" checked={!!form.is_active} onChange={e=>setForm(f=>({ ...f, is_active: e.target.checked }))} />
            Activo
          </label>
          <button className="rounded px-4 py-2 border ml-auto" onClick={save}>Guardar</button>
        </div>
      </div>
    </section>
  );
}
