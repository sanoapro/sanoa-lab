"use client";

import { useEffect, useState } from "react";

type Row = { kind: "income" | "expense" | null; category: string | null; total_cents: number };

function fmtMoney(cents: number, currency = "MXN") {
  return new Intl.NumberFormat("es-MX", { style: "currency", currency }).format((cents || 0) / 100);
}

export default function ReportPL({ orgId, from, to }: { orgId: string; from: string; to: string }) {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    fetch(`/api/bank/report/pl?org_id=${orgId}&from=${from}&to=${to}`)
      .then((r) => r.json())
      .then((j) => {
        if (!alive) return;
        if (j.ok) setRows(j.data);
      })
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [orgId, from, to]);

  if (loading) return <p className="text-sm text-slate-500">Cargando…</p>;
  if (!rows.length) return <p className="text-sm text-slate-500">Sin datos en el rango.</p>;

  const income = rows.filter((r) => r.kind === "income");
  const expense = rows.filter((r) => r.kind === "expense");

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div>
        <h4 className="font-medium mb-2">Ingresos</h4>
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-3 py-2">Categoría</th>
              <th className="text-right px-3 py-2">Total</th>
            </tr>
          </thead>
          <tbody>
            {income.map((r, i) => (
              <tr key={`${r.category}-${i}`} className="border-t">
                <td className="px-3 py-2">{r.category ?? "—"}</td>
                <td className="px-3 py-2 text-right">{fmtMoney(r.total_cents)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div>
        <h4 className="font-medium mb-2">Gastos</h4>
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-3 py-2">Categoría</th>
              <th className="text-right px-3 py-2">Total</th>
            </tr>
          </thead>
          <tbody>
            {expense.map((r, i) => (
              <tr key={`${r.category}-${i}`} className="border-t">
                <td className="px-3 py-2">{r.category ?? "—"}</td>
                <td className="px-3 py-2 text-right">{fmtMoney(r.total_cents)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
