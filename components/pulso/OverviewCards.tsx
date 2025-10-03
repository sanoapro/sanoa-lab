// components/pulso/OverviewCards.tsx
"use client";
import { useEffect, useState } from "react";

type Item = { type: string; pct_in_range: number; latest?: { value: number; at: string | null } };

export default function OverviewCards({ orgId, patientId }: { orgId: string; patientId?: string }) {
  const [rows, setRows] = useState<Item[]>([]);
  async function load() {
    const p = new URLSearchParams({ org_id: orgId });
    if (patientId) p.set("patient_id", patientId);
    const r = await fetch(`/api/modules/pulso/overview?${p.toString()}`, { cache: "no-store" });
    const j = await r.json();
    setRows(j?.ok ? j.data : []);
  }
  useEffect(() => {
    if (orgId) load();
  }, [orgId, patientId]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
      {rows.map((x: any) => (
        <div key={x.type} className="rounded-2xl border p-4">
          <div className="text-sm text-slate-500">{x.type}</div>
          <div className="mt-1 text-2xl font-semibold">{x.pct_in_range}%</div>
          <div className="text-xs text-slate-500 mt-1">En objetivo</div>
          {x.latest && (
            <div className="text-sm mt-2">
              Último: <strong>{x.latest.value}</strong>
            </div>
          )}
        </div>
      ))}
      {!rows.length && <div className="text-slate-500">Sin datos para mostrar</div>}
    </div>
  );
}
