// components/equilibrio/ProgressBoard.tsx
"use client";
import { useEffect, useState } from "react";

export default function ProgressBoard({ orgId, patientId }: { orgId: string; patientId: string }) {
  const [data, setData] = useState<{ adherence_pct: number; totals: { done:number; skipped:number }; recent: any[] } | null>(null);

  async function load() {
    const p = new URLSearchParams({ org_id: orgId, patient_id: patientId });
    const r = await fetch(`/api/modules/equilibrio/overview?${p.toString()}`, { cache:"no-store" });
    const j = await r.json();
    setData(j?.ok ? j.data : null);
  }

  useEffect(()=>{ if (orgId && patientId) load(); }, [orgId, patientId]);

  if (!data) return <div className="rounded-2xl border p-4">Sin datos</div>;

  return (
    <section className="grid md:grid-cols-3 gap-3">
      <div className="rounded-2xl border p-4">
        <div className="text-sm text-slate-500">Adherencia (últimos días)</div>
        <div className="text-3xl font-semibold mt-1">{data.adherence_pct}%</div>
      </div>
      <div className="rounded-2xl border p-4">
        <div className="text-sm text-slate-500">Completadas</div>
        <div className="text-3xl font-semibold mt-1">{data.totals.done}</div>
      </div>
      <div className="rounded-2xl border p-4">
        <div className="text-sm text-slate-500">Omitidas</div>
        <div className="text-3xl font-semibold mt-1">{data.totals.skipped}</div>
      </div>
    </section>
  );
}
