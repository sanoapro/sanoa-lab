// components/work/AssignmentsTable.tsx
"use client";

import * as React from "react";
import { getActiveOrg } from "@/lib/org-local";

type Row = {
  id: string;
  org_id: string;
  patient_id: string;
  provider_id: string;
  module: "mente" | "equilibrio" | "sonrisa" | "pulso" | "general";
  template_id: string | null;
  title: string;
  details: any;
  due_at: string | null;
  status: "active" | "completed" | "canceled";
  last_done_at: string | null;
  created_at: string;
};

export default function AssignmentsTable() {
  const org = getActiveOrg();
  const [rows, setRows] = React.useState<Row[]>([]);
  const [status, setStatus] = React.useState<string>("");
  const [module, setModule] = React.useState<string>("");
  const [loading, setLoading] = React.useState(false);
  const [sel, setSel] = React.useState<string[]>([]);

  async function load() {
    if (!org.id) return;
    setLoading(true);
    const url = new URL("/api/work/assignments", window.location.origin);
    url.searchParams.set("org_id", org.id);
    if (status) url.searchParams.set("status", status);
    if (module) url.searchParams.set("module", module);
    url.searchParams.set("limit", "100");
    const r = await fetch(url.toString(), { cache: "no-store" });
    const j = await r.json();
    setLoading(false);
    if (j?.ok) setRows(j.data as Row[]);
    else setRows([]);
    setSel([]);
  }

  React.useEffect(() => {
    load();  
  }, [org.id, status, module]);

  function toggle(id: string) {
    setSel((prev: any) => (prev.includes(id) ? prev.filter((x: any) => x !== id) : [...prev, id]));
  }

  async function bulk(set: any) {
    if (!sel.length || !org.id) return;
    const r = await fetch("/api/work/assignments/bulk", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ org_id: org.id, ids: sel, set }),
    });
    const j = await r.json();
    if (!j?.ok) return alert(j?.error?.message || "Error");
    load();
  }

  return (
    <div className="rounded-2xl border bg-white/95 dark:bg-slate-900/60">
      <div className="p-4 flex flex-wrap items-center gap-2">
        <h3 className="font-semibold mr-auto">Asignaciones</h3>
        <select
          value={module}
          onChange={(e: any) => setModule(e.target.value)}
          className="rounded-lg border px-2 py-1 bg-white dark:bg-slate-900"
        >
          <option value="">Todos</option>
          <option value="mente">mente</option>
          <option value="equilibrio">equilibrio</option>
          <option value="sonrisa">sonrisa</option>
          <option value="pulso">pulso</option>
          <option value="general">general</option>
        </select>
        <select
          value={status}
          onChange={(e: any) => setStatus(e.target.value)}
          className="rounded-lg border px-2 py-1 bg-white dark:bg-slate-900"
        >
          <option value="">Todos</option>
          <option value="active">active</option>
          <option value="completed">completed</option>
          <option value="canceled">canceled</option>
        </select>
        <button
          onClick={() => bulk({ status: "completed", last_done_at: new Date().toISOString() })}
          className="px-3 py-1 rounded-lg border"
        >
          Marcar hecho
        </button>
        <button
          onClick={() => bulk({ status: "canceled" })}
          className="px-3 py-1 rounded-lg border"
        >
          Cancelar
        </button>
        {loading && <span className="text-sm text-slate-500">Cargando…</span>}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-t border-b bg-slate-50/60 dark:bg-slate-800/40">
              <th className="p-2">
                <input
                  type="checkbox"
                  onChange={(e: any) => setSel(e.target.checked ? rows.map((r: any) => r.id) : [])}
                  checked={sel.length === rows.length && rows.length > 0}
                />
              </th>
              <th className="p-2 text-left">Título</th>
              <th className="p-2 text-left">Módulo</th>
              <th className="p-2 text-left">Paciente</th>
              <th className="p-2 text-left">Estado</th>
              <th className="p-2 text-left">Vence</th>
              <th className="p-2 text-left">Creación</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r: any) => (
              <tr key={r.id} className="border-b">
                <td className="p-2">
                  <input
                    type="checkbox"
                    checked={sel.includes(r.id)}
                    onChange={() => toggle(r.id)}
                  />
                </td>
                <td className="p-2">{r.title}</td>
                <td className="p-2">{r.module}</td>
                <td className="p-2">{r.patient_id.slice(0, 8)}…</td>
                <td className="p-2">{r.status}</td>
                <td className="p-2">{r.due_at ? new Date(r.due_at).toLocaleString() : "—"}</td>
                <td className="p-2">{new Date(r.created_at).toLocaleString()}</td>
              </tr>
            ))}
            {rows.length === 0 && !loading && (
              <tr>
                <td className="p-4 text-slate-500" colSpan={7}>
                  Sin asignaciones.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
