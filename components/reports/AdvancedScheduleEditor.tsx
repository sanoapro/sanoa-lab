"use client";

import { useEffect, useState } from "react";

type Item = {
  id?: string;
  org_id: string;
  name: string;
  report: string; // "agenda_alerts"
  channel: "whatsapp" | "sms" | "email";
  target: string;
  frequency: "daily" | "weekly";
  at_hour: number;
  at_minute: number;
  dow: number[] | null;
  tz: string;
  params: any;
  is_active: boolean;
};

const DEFAULT_PARAMS = {
  window_days: 7,
  threshold: 0.15,
  min_n: 10,
  scope: "resource",
  resource_ids: [],
  message:
    "Alerta: {{name}} no-show {{rate_pct}}% ({{count_ns}}/{{count_total}}) últimos {{window_days}}d",
};

export default function AdvancedScheduleEditor({ orgId }: { orgId: string }) {
  const [list, setList] = useState<Item[]>([]);
  const [form, setForm] = useState<Item>({
    org_id: orgId,
    name: "Alertas no-show (7d, ≥15%)",
    report: "agenda_alerts",
    channel: "email",
    target: "equipo@tuclinica.mx",
    frequency: "daily",
    at_hour: 8,
    at_minute: 0,
    dow: null,
    tz: "America/Mexico_City",
    params: DEFAULT_PARAMS,
    is_active: true,
  });

  function load() {
    fetch(`/api/reports/schedules?org_id=${orgId}`)
      .then((r) => r.json())
      .then((j) => setList(j.ok ? j.data.filter((x: any) => x.report === "agenda_alerts") : []));
  }
  useEffect(() => {
    load();
  }, [orgId]);

  async function save() {
    const r = await fetch("/api/reports/schedules", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(form),
    });
    const j = await r.json();
    if (!j.ok) alert(j.error?.message ?? "No se pudo guardar");
    load();
  }

  return (
    <section className="grid grid-cols-1 md:grid-cols-5 gap-6">
      <div className="md:col-span-3">
        <div className="rounded-2xl border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-3 py-2">Nombre</th>
                <th className="text-left px-3 py-2">Frecuencia</th>
                <th className="text-left px-3 py-2">Horario</th>
                <th className="text-left px-3 py-2">Activo</th>
              </tr>
            </thead>
            <tbody>
              {list.map((it) => (
                <tr key={it.id} className="border-t hover:bg-gray-50">
                  <td className="px-3 py-2 underline cursor-pointer" onClick={() => setForm(it)}>
                    {it.name}
                  </td>
                  <td className="px-3 py-2">{it.frequency}</td>
                  <td className="px-3 py-2">
                    {String(it.at_hour).padStart(2, "0")}:{String(it.at_minute).padStart(2, "0")} (
                    {it.tz})
                  </td>
                  <td className="px-3 py-2">{it.is_active ? "Sí" : "No"}</td>
                </tr>
              ))}
              {list.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-3 py-6 text-center">
                    Sin alertas configuradas.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="md:col-span-2 space-y-3">
        <div>
          <label className="block text-sm mb-1">Nombre</label>
          <input
            className="rounded border px-3 py-2 w-full"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          />
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div>
            <label className="block text-sm mb-1">Canal</label>
            <select
              className="rounded border px-3 py-2 w-full"
              value={form.channel}
              onChange={(e) => setForm((f) => ({ ...f, channel: e.target.value as any }))}
            >
              <option value="email">Email</option>
              <option value="whatsapp">WhatsApp</option>
              <option value="sms">SMS</option>
            </select>
          </div>
          <div className="col-span-2">
            <label className="block text-sm mb-1">Destino</label>
            <input
              className="rounded border px-3 py-2 w-full"
              value={form.target}
              onChange={(e) => setForm((f) => ({ ...f, target: e.target.value }))}
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div>
            <label className="block text-sm mb-1">Frecuencia</label>
            <select
              className="rounded border px-3 py-2 w-full"
              value={form.frequency}
              onChange={(e) => setForm((f) => ({ ...f, frequency: e.target.value as any }))}
            >
              <option value="daily">Diaria</option>
              <option value="weekly">Semanal</option>
            </select>
          </div>
          <div>
            <label className="block text-sm mb-1">Hora</label>
            <input
              type="number"
              min={0}
              max={23}
              className="rounded border px-3 py-2 w-full"
              value={form.at_hour}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  at_hour: Math.max(0, Math.min(23, parseInt(e.target.value || "0", 10))),
                }))
              }
            />
          </div>
          <div>
            <label className="block text-sm mb-1">Minuto</label>
            <input
              type="number"
              min={0}
              max={59}
              className="rounded border px-3 py-2 w-full"
              value={form.at_minute}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  at_minute: Math.max(0, Math.min(59, parseInt(e.target.value || "0", 10))),
                }))
              }
            />
          </div>
        </div>

        <div>
          <label className="block text-sm mb-1">Zona horaria</label>
          <input
            className="rounded border px-3 py-2 w-full"
            value={form.tz}
            onChange={(e) => setForm((f) => ({ ...f, tz: e.target.value }))}
          />
        </div>

        <div>
          <label className="block text-sm mb-1">Params (JSON)</label>
          <textarea
            className="rounded border px-3 py-2 w-full min-h-[160px]"
            value={JSON.stringify(form.params, null, 2)}
            onChange={(e) => {
              try {
                const v = JSON.parse(e.target.value);
                setForm((f) => ({ ...f, params: v }));
              } catch {
                /* ignore */
              }
            }}
          />
          <p className="text-xs text-slate-500 mt-1">
            window_days, threshold (0–1), min_n, scope (&quot;org&quot;|&quot;resource&quot;|&quot;patient&quot;),
            resource_ids[], message
          </p>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-sm">
            <input
              type="checkbox"
              className="mr-2"
              checked={!!form.is_active}
              onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))}
            />
            Activo
          </label>
          <button className="rounded px-4 py-2 border ml-auto" onClick={save}>
            Guardar
          </button>
        </div>
      </div>
    </section>
  );
}
