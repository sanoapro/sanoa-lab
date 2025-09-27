"use client";

import { useEffect, useState } from "react";

type Props = { orgId: string; defaultFrom: string; defaultTo: string };
type Schedule = {
  id?: string;
  org_id: string;
  scope: "bank_flow" | "bank_pl";
  params: { from?: string; to?: string };
  channel: "email" | "whatsapp";
  target: string;
  schedule_kind: "daily" | "weekly" | "monthly";
  dow?: number[] | null;
  at_hour: number;
  at_minute: number;
  tz: string;
  is_active: boolean;
};

export default function ScheduleForm({ orgId, defaultFrom, defaultTo }: Props) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState<Schedule>({
    org_id: orgId,
    scope: "bank_flow",
    params: { from: defaultFrom, to: defaultTo },
    channel: "email",
    target: "",
    schedule_kind: "daily",
    dow: null,
    at_hour: 9,
    at_minute: 0,
    tz: "America/Mexico_City",
    is_active: true,
  });

  useEffect(() => {
    let alive = true;
    setLoading(true);
    fetch(`/api/reports/schedules?org_id=${orgId}`)
      .then(r => r.json())
      .then(j => { if (!alive) return; if (j.ok) setItems(j.data); })
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, [orgId]);

  function updateField<K extends keyof Schedule>(k: K, v: Schedule[K]) {
    setForm(f => ({ ...f, [k]: v }));
  }

  async function save() {
    const res = await fetch("/api/reports/schedules", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ org_id: orgId, item: form }),
    });
    const j = await res.json();
    if (j.ok) {
      setItems((prev) => [j.data[0], ...prev]);
      // reset parcial
      setForm(f => ({ ...f, target: "" }));
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
        <div>
          <label className="block text-sm mb-1">Reporte</label>
          <select className="rounded border px-3 py-2" value={form.scope} onChange={e => updateField("scope", e.target.value as any)}>
            <option value="bank_flow">Flujo mensual</option>
            <option value="bank_pl">P&amp;L por categoría</option>
          </select>
        </div>
        <div>
          <label className="block text-sm mb-1">Canal</label>
          <select className="rounded border px-3 py-2" value={form.channel} onChange={e => updateField("channel", e.target.value as any)}>
            <option value="email">Email</option>
            <option value="whatsapp">WhatsApp</option>
          </select>
        </div>
        <div>
          <label className="block text-sm mb-1">{form.channel === "email" ? "Correo destino" : "Teléfono (E.164)"}</label>
          <input className="rounded border px-3 py-2" value={form.target} onChange={e => updateField("target", e.target.value)} />
        </div>
        <div>
          <label className="block text-sm mb-1">Horario (TZ)</label>
          <div className="flex gap-2">
            <input type="number" className="w-20 rounded border px-3 py-2" min={0} max={23} value={form.at_hour} onChange={e => updateField("at_hour", Number(e.target.value || 0))} />
            <input type="number" className="w-20 rounded border px-3 py-2" min={0} max={59} value={form.at_minute} onChange={e => updateField("at_minute", Number(e.target.value || 0))} />
          </div>
          <p className="text-xs text-slate-500 mt-1">{form.tz}</p>
        </div>
        <div>
          <label className="block text-sm mb-1">Frecuencia</label>
          <select className="rounded border px-3 py-2" value={form.schedule_kind} onChange={e => updateField("schedule_kind", e.target.value as any)}>
            <option value="daily">Diario</option>
            <option value="weekly">Semanal</option>
            <option value="monthly">Mensual</option>
          </select>
          {form.schedule_kind === "weekly" && (
            <div className="mt-1 grid grid-cols-7 gap-1 text-xs">
              {["D","L","M","M","J","V","S"].map((lbl, idx) => {
                const map = [0,1,2,3,4,5,6];
                const active = form.dow?.includes(map[idx]) ?? false;
                return (
                  <button type="button" key={idx}
                    className={`px-2 py-1 rounded border ${active ? "bg-white" : "opacity-60"}`}
                    onClick={() => {
                      const arr = new Set(form.dow ?? []);
                      if (arr.has(map[idx])) arr.delete(map[idx]); else arr.add(map[idx]);
                      updateField("dow", Array.from(arr).sort());
                    }}>
                    {lbl}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div>
          <label className="block text-sm mb-1">Desde</label>
          <input type="date" className="rounded border px-3 py-2"
                 value={form.params.from ?? ""} onChange={e => setForm(f => ({ ...f, params: { ...f.params, from: e.target.value } }))} />
        </div>
        <div>
          <label className="block text-sm mb-1">Hasta</label>
          <input type="date" className="rounded border px-3 py-2"
                 value={form.params.to ?? ""} onChange={e => setForm(f => ({ ...f, params: { ...f.params, to: e.target.value } }))} />
        </div>
        <div className="flex items-end">
          <button className="rounded px-4 py-2 border" onClick={save}>Guardar programación</button>
        </div>
      </div>

      <div className="rounded border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-3 py-2">Reporte</th>
              <th className="text-left px-3 py-2">Canal</th>
              <th className="text-left px-3 py-2">Destino</th>
              <th className="text-left px-3 py-2">Frecuencia</th>
              <th className="text-left px-3 py-2">Horario</th>
              <th className="text-left px-3 py-2">Último envío</th>
            </tr>
          </thead>
          <tbody>
            {loading && (<tr><td className="px-3 py-6 text-center" colSpan={6}>Cargando…</td></tr>)}
            {!loading && items.length === 0 && (<tr><td className="px-3 py-6 text-center" colSpan={6}>Sin programaciones.</td></tr>)}
            {!loading && items.map((it: any) => (
              <tr key={it.id} className="border-t">
                <td className="px-3 py-2">{it.scope === "bank_flow" ? "Flujo mensual" : "P&L por categoría"}</td>
                <td className="px-3 py-2">{it.channel}</td>
                <td className="px-3 py-2">{it.target}</td>
                <td className="px-3 py-2">{it.schedule_kind}{it.schedule_kind === "weekly" && it.dow ? ` (${it.dow.join(",")})` : ""}</td>
                <td className="px-3 py-2">{String(it.at_hour).padStart(2,"0")}:{String(it.at_minute).padStart(2,"0")} {it.tz}</td>
                <td className="px-3 py-2">{it.last_sent_at ? new Date(it.last_sent_at).toLocaleString() : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
