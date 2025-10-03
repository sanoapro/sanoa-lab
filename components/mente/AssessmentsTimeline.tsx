"use client";
import { useEffect, useState } from "react";

type Row = {
  id: string;
  tool: "phq9" | "gad7" | "auditc";
  score_total: number;
  risk_band: "low" | "med" | "high";
  issued_at?: string | null;
  created_at: string;
};

function bandCls(b: Row["risk_band"]) {
  if (b === "high") return "bg-rose-100 text-rose-800";
  if (b === "med") return "bg-amber-100 text-amber-800";
  return "bg-emerald-100 text-emerald-800";
}

export default function AssessmentsTimeline({
  orgId,
  patientId,
}: {
  orgId: string;
  patientId: string;
}) {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);

  async function load() {
    setLoading(true);
    const p = new URLSearchParams({ org_id: orgId, patient_id: patientId });
    const r = await fetch(`/api/modules/mente/assessments/list?${p.toString()}`, {
      cache: "no-store",
    });
    const j = await r.json();
    setRows(j?.ok ? j.data : []);
    setLoading(false);
  }

  useEffect(() => {
    if (orgId && patientId) load();
  }, [orgId, patientId]);

  return (
    <div className="rounded-2xl border overflow-auto">
      <table className="w-full text-sm">
        <thead className="bg-gray-50">
          <tr>
            <th className="text-left px-3 py-2">Fecha</th>
            <th className="text-left px-3 py-2">Herramienta</th>
            <th className="text-left px-3 py-2">Score</th>
            <th className="text-left px-3 py-2">Riesgo</th>
          </tr>
        </thead>
        <tbody>
          {loading && (
            <tr>
              <td colSpan={4} className="px-3 py-6 text-center">
                Cargando…
              </td>
            </tr>
          )}
          {!loading && rows.length === 0 && (
            <tr>
              <td colSpan={4} className="px-3 py-6 text-center">
                Sin evaluaciones
              </td>
            </tr>
          )}
          {rows.map((r: any) => (
            <tr key={r.id} className="border-t">
              <td className="px-3 py-2">
                {r.issued_at || new Date(r.created_at).toLocaleString()}
              </td>
              <td className="px-3 py-2 uppercase">{r.tool}</td>
              <td className="px-3 py-2">{r.score_total}</td>
              <td className="px-3 py-2">
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs ${bandCls(r.risk_band)}`}
                >
                  ● {r.risk_band}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
