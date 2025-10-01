// components/reminders/QueueTable.tsx
"use client";

import * as React from "react";
import { getActiveOrg } from "@/lib/org-local";

import Skeleton from "@/components/ui/Skeleton";

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
  const [status, setStatus] = React.useState<string>("");
  const [loading, setLoading] = React.useState(false);
  const skeletonRows = React.useMemo(() => Array.from({ length: 5 }), []);

  async function load() {
    if (!org.id) {
      setItems([]);
      return;
    }
    setLoading(true);
    try {
      const url = new URL("/api/reminders/queue/list", window.location.origin);
      url.searchParams.set("org_id", org.id);
      if (status) url.searchParams.set("status", status);
      url.searchParams.set("limit", "100");

      const r = await fetch(url.toString(), { cache: "no-store" });
      const j = await r.json().catch(() => null);
      if (j?.ok && Array.isArray(j.data)) {
        setItems(j.data as Item[]);
      } else if (Array.isArray(j?.items)) {
        setItems(j.items as Item[]);
      } else {
        setItems([]);
      }
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [org.id, status]);

  return (
    <div className="rounded-2xl border bg-white/95 dark:bg-slate-900/60">
      <div className="p-4 flex items-center justify-between gap-3">
        <h3 className="font-semibold">Cola de recordatorios</h3>
        <div className="flex items-center gap-2">
          <select
            className="rounded-lg border px-2 py-1 bg-white dark:bg-slate-900"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="">Todos</option>
            <option value="scheduled">scheduled</option>
            <option value="retrying">retrying</option>
            <option value="sent">sent</option>
            <option value="failed">failed</option>
            <option value="canceled">canceled</option>
          </select>
          <button onClick={load} className="px-3 py-1 rounded-lg border">
            Refrescar
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm" aria-busy={loading}>
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
            {loading &&
              skeletonRows.map((_, idx) => (
                <tr key={`queue-skeleton-${idx}`} className={idx === 0 ? undefined : "border-b"}>
                  <td className="p-2">
                    <Skeleton
                      className="h-4 w-36"
                      label="Cargando cola de recordatorios"
                      ariaHidden={idx > 0}
                    />
                  </td>
                  <td className="p-2">
                    <Skeleton className="h-4 w-20" ariaHidden />
                  </td>
                  <td className="p-2">
                    <Skeleton className="h-4 w-16" ariaHidden />
                  </td>
                  <td className="p-2">
                    <Skeleton className="h-4 w-32" ariaHidden />
                  </td>
                  <td className="p-2">
                    <Skeleton className="h-4 w-12" ariaHidden />
                  </td>
                  <td className="p-2">
                    <Skeleton className="h-4 w-36" ariaHidden />
                  </td>
                  <td className="p-2">
                    <Skeleton className="h-4 w-full" ariaHidden />
                  </td>
                </tr>
              ))}
            {items.map((i) => (
              <tr key={i.id} className="border-b">
                <td className="p-2">{new Date(i.created_at).toLocaleString()}</td>
                <td className="p-2">{i.status}</td>
                <td className="p-2">{i.channel}</td>
                <td className="p-2">{i.template_slug}</td>
                <td className="p-2">{i.attempt_count}</td>
                <td className="p-2">
                  {i.next_attempt_at ? new Date(i.next_attempt_at).toLocaleString() : "—"}
                </td>
                <td className="p-2 max-w-[280px] truncate" title={i.last_error ?? ""}>
                  {i.last_error ?? "—"}
                </td>
              </tr>
            ))}
            {items.length === 0 && !loading && (
              <tr>
                <td className="p-4 text-slate-500" colSpan={7}>
                  Sin datos de cola por ahora.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
