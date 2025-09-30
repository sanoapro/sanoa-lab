"use client";

import { useEffect, useState } from "react";

type Row = {
  share_id: string;
  token: string;
  created_at: string;
  expires_at: string;
  revoked_at: string | null;
  access_at: string;
  ip: string | null;
  user_agent: string | null;
  status: "vigente" | "expirado" | "revocado";
};

export default function AuditTrail({ orgId, patientId }: { orgId: string; patientId: string }) {
  const [rows, setRows] = useState<Row[]>([]);
  const [meta, setMeta] = useState({ page: 1, pageSize: 50, total: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    const p = new URLSearchParams({
      org_id: orgId,
      patient_id: patientId,
      page: "1",
      pageSize: "50",
    });
    fetch(`/api/patients/share/access?${p.toString()}`)
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
  }, [orgId, patientId]);

  return (
    <section className="rounded-2xl border p-4 space-y-3">
      <h3 className="font-semibold">Auditoría de accesos</h3>
      <div className="rounded-2xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-3 py-2">Acceso</th>
              <th className="text-left px-3 py-2">Estado token</th>
              <th className="text-left px-3 py-2">Creado</th>
              <th className="text-left px-3 py-2">Expira</th>
              <th className="text-left px-3 py-2">Revocado</th>
              <th className="text-left px-3 py-2">IP</th>
              <th className="text-left px-3 py-2">Agente</th>
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
                  Sin registros.
                </td>
              </tr>
            )}
            {rows.map((r) => (
              <tr key={`${r.share_id}-${r.access_at}`} className="border-t">
                <td className="px-3 py-2">{new Date(r.access_at).toLocaleString()}</td>
                <td className="px-3 py-2">
                  <span
                    className={`inline-flex px-2 py-0.5 rounded text-xs border ${
                      r.status === "vigente"
                        ? "bg-green-50 border-green-200"
                        : r.status === "expirado"
                          ? "bg-amber-50 border-amber-200"
                          : "bg-rose-50 border-rose-200"
                    }`}
                  >
                    {r.status}
                  </span>
                </td>
                <td className="px-3 py-2">{new Date(r.created_at).toLocaleString()}</td>
                <td className="px-3 py-2">{new Date(r.expires_at).toLocaleString()}</td>
                <td className="px-3 py-2">
                  {r.revoked_at ? new Date(r.revoked_at).toLocaleString() : "—"}
                </td>
                <td className="px-3 py-2">{r.ip || "—"}</td>
                <td className="px-3 py-2">{r.user_agent || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="flex items-center justify-between px-3 py-2 border-t text-sm">
          <span>
            {meta.total} accesos • Página {meta.page}
          </span>
          <span>Mostrando {meta.pageSize}</span>
        </div>
      </div>
    </section>
  );
}
