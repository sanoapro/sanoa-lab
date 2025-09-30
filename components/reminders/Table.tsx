"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

type Row = {
  id: string;
  patient_id: string | null;
  channel: string | null;
  status: string | null;
  target: string | null;
  template: string | null;
  created_at: string | null;
  last_attempt_at: string | null;
  attempts: number | null;
};

export default function RemindersTable({ orgId }: { orgId: string }) {
  const search = useSearchParams();
  const [rows, setRows] = useState<Row[]>([]);
  const [meta, setMeta] = useState<{ page: number; pageSize: number; total: number }>({
    page: 1,
    pageSize: 50,
    total: 0,
  });
  const [loading, setLoading] = useState(true);

  const page = useMemo(() => Number(search.get("page") ?? 1), [search]);
  const pageSize = useMemo(() => Number(search.get("pageSize") ?? 50), [search]);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    const params = new URLSearchParams({
      org_id: orgId,
      ...Object.fromEntries(search.entries()),
      page: String(page),
      pageSize: String(pageSize),
    });
    fetch(`/api/reminders/logs?${params.toString()}`)
      .then((r) => r.json())
      .then((j) => {
        if (!alive) return;
        if (j.ok) {
          setRows(j.data);
          setMeta(j.meta);
        }
      })
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [orgId, search, page, pageSize]);

  return (
    <div className="rounded-2xl border overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-gray-50">
          <tr>
            <th className="text-left px-3 py-2">Canal</th>
            <th className="text-left px-3 py-2">Estado</th>
            <th className="text-left px-3 py-2">Destino</th>
            <th className="text-left px-3 py-2">Plantilla</th>
            <th className="text-left px-3 py-2">Creado</th>
            <th className="text-left px-3 py-2">Último intento</th>
            <th className="text-left px-3 py-2">Intentos</th>
          </tr>
        </thead>
        <tbody>
          {loading && (
            <tr>
              <td colSpan={7} className="px-3 py-6 text-center">
                Cargando…
              </td>
            </tr>
          )}
          {!loading && rows.length === 0 && (
            <tr>
              <td colSpan={7} className="px-3 py-6 text-center">
                Sin resultados.
              </td>
            </tr>
          )}
          {rows.map((r) => (
            <tr key={r.id} className="border-t">
              <td className="px-3 py-2">{r.channel ?? "—"}</td>
              <td className="px-3 py-2">{r.status ?? "—"}</td>
              <td className="px-3 py-2">{r.target ?? "—"}</td>
              <td className="px-3 py-2">{r.template ?? "—"}</td>
              <td className="px-3 py-2">
                {r.created_at ? new Date(r.created_at).toLocaleString() : "—"}
              </td>
              <td className="px-3 py-2">
                {r.last_attempt_at ? new Date(r.last_attempt_at).toLocaleString() : "—"}
              </td>
              <td className="px-3 py-2">{r.attempts ?? 0}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="flex items-center justify-between px-3 py-2 border-t text-sm">
        <span>
          {meta.total} registros • Página {meta.page}
        </span>
        <span>Mostrando {meta.pageSize}</span>
      </div>
    </div>
  );
}
