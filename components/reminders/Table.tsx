"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

import EmptyState from "@/components/EmptyState";
import Skeleton from "@/components/ui/Skeleton";

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
  const skeletonRows = Array.from({ length: 5 });

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

  const showEmpty = !loading && rows.length === 0;

  return (
    <div className="rounded-2xl border overflow-hidden">
      <table className="w-full text-sm" aria-busy={loading}>
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
          {loading &&
            skeletonRows.map((_, idx) => (
              <tr key={`reminders-skeleton-${idx}`} className={idx === 0 ? undefined : "border-t"}>
                <td className="px-3 py-3">
                  <Skeleton
                    className="h-4 w-24"
                    label="Cargando recordatorios"
                    ariaHidden={idx > 0}
                  />
                </td>
                <td className="px-3 py-3">
                  <Skeleton className="h-4 w-24" ariaHidden />
                </td>
                <td className="px-3 py-3">
                  <Skeleton className="h-4 w-32" ariaHidden />
                </td>
                <td className="px-3 py-3">
                  <Skeleton className="h-4 w-40" ariaHidden />
                </td>
                <td className="px-3 py-3">
                  <Skeleton className="h-4 w-28" ariaHidden />
                </td>
                <td className="px-3 py-3">
                  <Skeleton className="h-4 w-28" ariaHidden />
                </td>
                <td className="px-3 py-3">
                  <Skeleton className="h-4 w-12" ariaHidden />
                </td>
              </tr>
            ))}
          {!loading &&
            rows.map((r) => (
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
          {showEmpty && (
            <tr>
              <td colSpan={7} className="px-3 py-8">
                <EmptyState
                  emoji="📨"
                  title="Sin recordatorios"
                  hint="Todavía no se han enviado recordatorios con los filtros seleccionados."
                  className="mx-auto max-w-md border border-dashed border-border bg-transparent shadow-none"
                />
              </td>
            </tr>
          )}
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
