"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

type Row = {
  id: string;
  name: string | null;
  gender: string | null;
  dob: string | null;
  tags: string[] | null;
  created_at: string | null;
  deleted_at: string | null;
};

function ageYears(dob?: string | null) {
  if (!dob) return "";
  const ms = Date.now() - Date.parse(dob);
  return ms > 0 ? Math.floor(ms / (365.25 * 24 * 3600 * 1000)) : "";
}

export default function PatientsTable({ orgId }: { orgId: string }) {
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
    fetch(`/api/patients/search?${params.toString()}`)
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
            <th className="text-left px-3 py-2">Nombre</th>
            <th className="text-left px-3 py-2">Género</th>
            <th className="text-left px-3 py-2">Edad</th>
            <th className="text-left px-3 py-2">Tags</th>
            <th className="text-left px-3 py-2">Creado</th>
            <th className="text-left px-3 py-2">Eliminado</th>
          </tr>
        </thead>
        <tbody>
          {loading && (
            <tr>
              <td colSpan={6} className="px-3 py-6 text-center">
                Cargando…
              </td>
            </tr>
          )}
          {!loading && rows.length === 0 && (
            <tr>
              <td colSpan={6} className="px-3 py-6 text-center">
                Sin resultados.
              </td>
            </tr>
          )}
          {rows.map((r) => (
            <tr key={r.id} className="border-t">
              <td className="px-3 py-2">
                <Link href={`/pacientes/${r.id}`} className="underline underline-offset-2">
                  {r.name ?? "—"}
                </Link>
              </td>
              <td className="px-3 py-2">{r.gender ?? "—"}</td>
              <td className="px-3 py-2">{ageYears(r.dob)}</td>
              <td className="px-3 py-2">{Array.isArray(r.tags) ? r.tags.join(", ") : "—"}</td>
              <td className="px-3 py-2">
                {r.created_at ? new Date(r.created_at).toLocaleDateString() : "—"}
              </td>
              <td className="px-3 py-2">
                {r.deleted_at ? new Date(r.deleted_at).toLocaleDateString() : "—"}
              </td>
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
