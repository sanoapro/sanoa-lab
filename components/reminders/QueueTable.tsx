// components/reminders/QueueTable.tsx
"use client";

import * as React from "react";
import { getActiveOrg } from "@/lib/org-local";

type Item = {
  id: string;
  assignment_id: string | null;
  channel: "whatsapp" | "sms";
  template_slug: string;
  status: "scheduled" | "retrying" | "sent" | "failed" | "canceled";
  attempt_count: number;
  next_attempt_at: string | null;
  sent_at: string | null;
  last_error: string | null;
  created_at: string;
  payload: any;
};

export default function QueueTable() {
  const org = getActiveOrg();
  const [items, setItems] = React.useState<Item[]>([]);
  const [loading, setLoading] = React.useState(false);

  async function load() {
    if (!org.id) return;
    setLoading(true);
    const url = new URL("/api/reminders/logs", window.location.origin); // ya existe tu endpoint, lo reutilizamos
    url.searchParams.set("org_id", org.id);
    // Si tu /api/reminders/logs no lista queue, ajusta a /api/search/query o agrega ruta propia.
    const r = await fetch(url.toString(), { cache: "no-store" });
    const j = await r.json();
    setLoading(false);
    if (j?.ok && Array.isArray(j.data)) {
      setItems(j.data as Item[]);
    } else {
      // fallback: intentar leer directamente si existe /rpc o vista; si no, mostramos vacío
      setItems([]);
    }
  }

  React.useEffect(() => { load(); /* eslint-disable-next-line */ }, [org.id]);

  return (
    <div className="rounded-2xl border bg-white/95 dark:bg-slate-900/60">
      <div className="p-4 flex items-center justify-between">
        <h3 className="font-semibold">Últimos recordatorios</h3>
        {loading && <span className="text-sm text-slate-500">Cargando…</span>}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-t border-b bg-slate-50/60 dark:bg-slate-800/40">
              <th className="text-left p-2">Fecha</th>
              <th className="text-left p-2">Estado</th>
              <th className="text-left p-2">Canal</th>
              <th className="text-left p-2">Plantilla</th>
              <th className="text-left p-2">Intentos</th>
              <th className="text-left p-2">Próximo intento</th>
              <th className="text-left p-2">Error</th>
            </tr>
          </thead>
          <tbody>
            {items.map(i => (
              <tr key={i.id} className="border-b">
                <td className="p-2">{new Date(i.created_at).toLocaleString()}</td>
                <td className="p-2">{i.status}</td>
                <td className="p-2">{i.channel}</td>
                <td className="p-2">{i.template_slug}</td>
                <td className="p-2">{i.attempt_count}</td>
                <td className="p-2">{i.next_attempt_at ? new Date(i.next_attempt_at).toLocaleString() : "—"}</td>
                <td className="p-2 max-w-[280px] truncate" title={i.last_error ?? ""}>{i.last_error ?? "—"}</td>
              </tr>
            ))}
            {items.length === 0 && !loading && (
              <tr><td className="p-4 text-slate-500" colSpan={7}>Sin datos de cola por ahora.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
