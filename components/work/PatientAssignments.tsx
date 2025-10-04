// components/work/PatientAssignments.tsx
"use client";

import * as React from "react";
import {
  listAssignments,
  logEvent,
  patchAssignment,
  type WorkAssignment,
} from "@/lib/work/assignments";
import { getActiveOrg } from "@/lib/org-local";
import ColorEmoji from "@/components/ColorEmoji";

export default function PatientAssignments({ patientId }: { patientId: string }) {
  const org = getActiveOrg();
  const [items, setItems] = React.useState<WorkAssignment[]>([]);
  const [loading, setLoading] = React.useState(false);

  async function load() {
    if (!org.id) return;
    setLoading(true);
    const res = await listAssignments({ org_id: org.id, patient_id: patientId, limit: 100 });
    setItems(res.items ?? []);
    setLoading(false);
  }
  React.useEffect(() => {
    load();  
  }, [org.id, patientId]);

  async function complete(a: WorkAssignment) {
    const res = await logEvent({ org_id: a.org_id, assignment_id: a.id, kind: "completed" });
    if (res?.ok) await load();
  }
  async function pause(a: WorkAssignment) {
    const res = await patchAssignment(a.id, {
      status: a.status === "paused" ? "active" : "paused",
    });
    if (res?.ok) await load();
  }

  return (
    <div className="rounded-2xl border bg-white/95 dark:bg-slate-900/60">
      <div className="p-4 flex items-center justify-between">
        <h3 className="font-semibold flex items-center gap-2">
          <ColorEmoji token="trabajo" /> Tareas asignadas
        </h3>
        {loading && <span className="text-sm text-slate-500">Cargando…</span>}
      </div>
      <ul className="divide-y">
        {items.map((a: any) => (
          <li key={a.id} className="p-4 flex items-center justify-between gap-4">
            <div className="min-w-0">
              <div className="font-medium truncate">{a.title}</div>
              <div className="text-xs text-slate-500 truncate">
                {a.module} · {a.status}{" "}
                {a.due_at ? ` · vence ${new Date(a.due_at).toLocaleString()}` : ""}{" "}
                {a.last_done_at ? ` · última ${new Date(a.last_done_at).toLocaleString()}` : ""}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button className="px-3 py-2 rounded-lg border" onClick={() => pause(a)}>
                {a.status === "paused" ? "Reanudar" : "Pausar"}
              </button>
              <button
                className="px-3 py-2 rounded-lg bg-emerald-600 text-white"
                onClick={() => complete(a)}
              >
                Marcar completada
              </button>
            </div>
          </li>
        ))}
        {items.length === 0 && !loading && (
          <li className="p-4 text-sm text-slate-500">Sin asignaciones</li>
        )}
      </ul>
    </div>
  );
}
