// components/sonrisa/BudgetList.tsx
"use client";
import { useEffect, useState } from "react";

type Row = {
  id: string;
  status: string;
  total_cents: number;
  currency: string;
  created_at: string;
  signed_at?: string | null;
};

export default function BudgetList({ orgId, patientId }: { orgId: string; patientId?: string }) {
  const [rows, setRows] = useState<Row[]>([]);
  const [status, setStatus] = useState<string>("");

  async function load() {
    const p = new URLSearchParams({ org_id: orgId });
    if (patientId) p.set("patient_id", patientId);
    if (status) p.set("status", status);
    const r = await fetch(`/api/modules/sonrisa/quotes/list?${p.toString()}`, {
      cache: "no-store",
    });
    const j = await r.json();
    setRows(j?.ok ? j.data : []);
  }
  useEffect(() => {
    if (orgId) load();
  }, [orgId, patientId, status]);

  return (
    <section className="border rounded-2xl p-4 space-y-3">
      <div className="flex items-center gap-2">
        <select
          className="border rounded px-3 py-2"
          value={status}
          onChange={(e: any) => setStatus(e.target.value)}
        >
          <option value="">Todos</option>
          <option value="draft">Borrador</option>
          <option value="accepted">Aceptado</option>
          <option value="paid">Pagado</option>
          <option value="rejected">Rechazado</option>
        </select>
        <button className="border rounded px-3 py-2" onClick={load}>
          Actualizar
        </button>
      </div>
      <div className="rounded border overflow-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-3 py-2">Fecha</th>
              <th className="text-left px-3 py-2">Estatus</th>
              <th className="text-right px-3 py-2">Total</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r: any) => (
              <tr key={r.id} className="border-t">
                <td className="px-3 py-2">{new Date(r.created_at).toLocaleString()}</td>
                <td className="px-3 py-2">
                  {r.status}
                  {r.signed_at ? " (firmado)" : ""}
                </td>
                <td className="px-3 py-2 text-right">
                  {(r.total_cents / 100).toLocaleString("es-MX", {
                    style: "currency",
                    currency: (r.currency || "mxn").toUpperCase(),
                  })}
                </td>
              </tr>
            ))}
            {!rows.length && (
              <tr>
                <td colSpan={3} className="px-3 py-6 text-center text-slate-500">
                  Sin presupuestos
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
