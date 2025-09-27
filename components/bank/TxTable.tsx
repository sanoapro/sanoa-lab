"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

type Tx = {
  id: string;
  date: string;
  memo: string | null;
  amount_cents: number;
  status: "pending" | "cleared";
  method: string | null;
  category_id: string | null;
  account_id: string;
  currency: string | null;
  created_at: string;
};

function fmtMoney(cents: number, currency = "MXN") {
  return new Intl.NumberFormat("es-MX", { style: "currency", currency }).format((cents || 0) / 100);
}

export default function TxTable({ orgId }: { orgId: string }) {
  const search = useSearchParams();
  const [rows, setRows] = useState<Tx[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const page = Math.max(1, Number(search.get("page") ?? "1"));
  const pageSize = Math.max(1, Math.min(200, Number(search.get("pageSize") ?? "50")));

  const qs = useMemo(() => {
    const q = new URLSearchParams(search.toString());
    q.set("org_id", orgId);
    q.set("page", String(page));
    q.set("pageSize", String(pageSize));
    return q.toString();
  }, [search, orgId, page, pageSize]);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    fetch(`/api/bank/tx?${qs}`)
      .then(r => r.json())
      .then(j => {
        if (!alive) return;
        if (j.ok) { setRows(j.data); setTotal(j.meta?.total ?? 0); }
      })
      .catch(() => {})
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, [qs]);

  const pages = Math.max(1, Math.ceil(total / pageSize));
  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);

  return (
    <div className="mt-4">
      <div className="rounded border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-3 py-2">Fecha</th>
              <th className="text-left px-3 py-2">Descripción</th>
              <th className="text-right px-3 py-2">Monto</th>
              <th className="text-left px-3 py-2">Estado</th>
              <th className="text-left px-3 py-2">Método</th>
            </tr>
          </thead>
          <tbody>
            {loading && (<tr><td className="px-3 py-6 text-center" colSpan={5}>Cargando…</td></tr>)}
            {!loading && rows.length === 0 && (<tr><td className="px-3 py-6 text-center" colSpan={5}>Sin resultados. Ajusta filtros o importa CSV.</td></tr>)}
            {!loading && rows.map(r => (
              <tr key={r.id} className="border-t">
                <td className="px-3 py-2">{r.date}</td>
                <td className="px-3 py-2">{r.memo ?? "—"}</td>
                <td className="px-3 py-2 text-right">
                  <span className={r.amount_cents >= 0 ? "text-emerald-700" : "text-rose-700"}>
                    {fmtMoney(r.amount_cents, (r.currency ?? "mxn").toUpperCase())}
                  </span>
                </td>
                <td className="px-3 py-2">
                  <span className={`inline-block rounded px-2 py-0.5 text-xs ${r.status === "cleared" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}>
                    {r.status === "cleared" ? "Conciliado" : "Pendiente"}
                  </span>
                </td>
                <td className="px-3 py-2">{r.method ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <nav className="flex items-center justify-between mt-3 text-sm" aria-label="Paginación">
        <div>Mostrando {start}–{end} de {total}</div>
        <div className="flex gap-2">
          <a className={`px-3 py-1 rounded border ${page <= 1 ? "pointer-events-none opacity-50" : ""}`}
             href={`?${new URLSearchParams({ ...Object.fromEntries(search.entries()), page: String(page - 1) }).toString()}`}>Anterior</a>
          <a className={`px-3 py-1 rounded border ${page >= pages ? "pointer-events-none opacity-50" : ""}`}
             href={`?${new URLSearchParams({ ...Object.fromEntries(search.entries()), page: String(page + 1) }).toString()}`}>Siguiente</a>
        </div>
      </nav>
    </div>
  );
}
