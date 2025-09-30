// components/pulso/MeasurementTable.tsx
"use client";
import { useEffect, useState } from "react";

type Target = { type: string; low: number | null; high: number | null };
type Row = {
  id: string;
  type: string;
  value: number;
  unit: string | null;
  measured_at: string | null;
  note: string | null;
  created_at: string;
};

function band(value: number, t?: Target): "low" | "in" | "high" | "na" {
  if (!t) return "na";
  if (typeof t.low === "number" && value < t.low) return "low";
  if (typeof t.high === "number" && value > t.high) return "high";
  if (typeof t.low !== "number" && typeof t.high !== "number") return "na";
  return "in";
}

export default function MeasurementTable({
  orgId,
  patientId,
  refreshToken,
}: {
  orgId: string;
  patientId: string;
  refreshToken?: any;
}) {
  const [rows, setRows] = useState<Row[]>([]);
  const [targets, setTargets] = useState<Record<string, Target>>({});
  const [loading, setLoading] = useState(false);

  async function load() {
    setLoading(true);
    const p1 = new URLSearchParams({ org_id: orgId, patient_id: patientId });
    const [r1, r2] = await Promise.all([
      fetch(`/api/modules/pulso/measurements/list?${p1.toString()}`, { cache: "no-store" }),
      fetch(`/api/modules/pulso/targets/get?org_id=${orgId}&patient_id=${patientId}`, {
        cache: "no-store",
      }),
    ]);
    const j1 = await r1.json();
    const j2 = await r2.json();
    setRows(j1?.ok ? j1.data : []);
    const tmap: Record<string, Target> = {};
    (j2?.ok ? j2.data : []).forEach(
      (t: any) => (tmap[t.type] = { type: t.type, low: t.target_low, high: t.target_high }),
    );
    setTargets(tmap);
    setLoading(false);
  }

  useEffect(() => {
    if (orgId && patientId) load();
  }, [orgId, patientId, refreshToken]);

  return (
    <div className="rounded-2xl border overflow-auto">
      <table className="w-full text-sm">
        <thead className="bg-gray-50">
          <tr>
            <th className="text-left px-3 py-2">Fecha</th>
            <th className="text-left px-3 py-2">Tipo</th>
            <th className="text-left px-3 py-2">Valor</th>
            <th className="text-left px-3 py-2">Estado</th>
            <th className="text-left px-3 py-2">Nota</th>
          </tr>
        </thead>
        <tbody>
          {loading && (
            <tr>
              <td colSpan={5} className="px-3 py-6 text-center">
                Cargando…
              </td>
            </tr>
          )}
          {!loading && rows.length === 0 && (
            <tr>
              <td colSpan={5} className="px-3 py-6 text-center">
                Sin mediciones
              </td>
            </tr>
          )}
          {rows.map((r) => {
            const b = band(r.value, targets[r.type]);
            const cls =
              b === "high"
                ? "bg-rose-100 text-rose-800"
                : b === "low"
                  ? "bg-amber-100 text-amber-800"
                  : b === "in"
                    ? "bg-emerald-100 text-emerald-800"
                    : "bg-slate-100 text-slate-700";
            return (
              <tr key={r.id} className="border-t">
                <td className="px-3 py-2">
                  {r.measured_at || new Date(r.created_at).toLocaleString()}
                </td>
                <td className="px-3 py-2">{r.type}</td>
                <td className="px-3 py-2">
                  {r.value} {r.unit || ""}
                </td>
                <td className="px-3 py-2">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs ${cls}`}
                  >
                    ● {b}
                  </span>
                </td>
                <td className="px-3 py-2">{r.note || "—"}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
