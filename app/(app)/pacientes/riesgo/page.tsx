"use client";

import { useEffect, useMemo, useState } from "react";
import AccentHeader from "@/components/ui/AccentHeader";
import { getActiveOrg } from "@/lib/org-local";
import Link from "next/link";

type Summary = { label: string; total: number };
type Row = {
  id: string;
  name: string | null;
  gender: string | null;
  dob: string | null;
  created_at: string | null;
};

export default function RiskBoardPage() {
  const org = useMemo(() => getActiveOrg(), []);
  const orgId = org?.id || "";
  const [summary, setSummary] = useState<Summary[]>([]);
  const [label, setLabel] = useState<string>("Riesgo");
  const [rows, setRows] = useState<Row[]>([]);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    if (!orgId) return;
    fetch(`/api/patients/labels/summary?org_id=${orgId}`)
      .then((r) => r.json())
      .then((j) => {
        if (j.ok) setSummary(j.data);
      });
  }, [orgId]);

  useEffect(() => {
    if (!orgId || !label) return;
    const p = new URLSearchParams({ org_id: orgId, label, page: "1", pageSize: "50" });
    fetch(`/api/patients/labels/search?${p.toString()}`)
      .then((r) => r.json())
      .then((j) => {
        if (j.ok) {
          setRows(j.data);
          setTotal(j.meta.total);
        }
      });
  }, [orgId, label]);

  return (
    <main className="p-6 md:p-10 space-y-6">
      <AccentHeader
        title="Panel de riesgo"
        subtitle="Pacientes etiquetados para seguimiento prioritario."
        emojiToken="alerta"
      />

      {!orgId && (
        <p className="text-amber-700 bg-amber-50 border border-amber-200 rounded p-3">
          Selecciona una organización activa para continuar.
        </p>
      )}

      {orgId && (
        <>
          <section className="grid grid-cols-1 md:grid-cols-4 gap-3">
            {["Riesgo", "Embarazo", "Prioridad"].map((lab) => {
              const n = summary.find((s) => s.label === lab)?.total ?? 0;
              const active = label === lab;
              return (
                <button
                  key={lab}
                  className={`rounded-2xl border p-4 text-left ${active ? "bg-white" : ""}`}
                  onClick={() => setLabel(lab)}
                  aria-pressed={active}
                >
                  <div className="text-sm text-slate-500">{lab}</div>
                  <div className="text-3xl font-semibold mt-1">{n}</div>
                </button>
              );
            })}
            {/* Otros */}
            <div className="rounded-2xl border p-4">
              <div className="text-sm text-slate-500">Otros (todas las etiquetas)</div>
              <div className="text-3xl font-semibold mt-1">
                {summary.reduce((a, b) => a + (b.total || 0), 0)}
              </div>
            </div>
          </section>

          <section className="rounded-2xl border overflow-hidden">
            <div className="flex items-center justify-between px-3 py-2 border-b">
              <h3 className="font-semibold">Pacientes con etiqueta “{label}”</h3>
              <span className="text-sm text-slate-500">{total} en total</span>
            </div>
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-3 py-2">Nombre</th>
                  <th className="text-left px-3 py-2">Género</th>
                  <th className="text-left px-3 py-2">Nacimiento</th>
                  <th className="text-left px-3 py-2">Creado</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-3 py-6 text-center">
                      Sin pacientes.
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
                    <td className="px-3 py-2">{r.dob ?? "—"}</td>
                    <td className="px-3 py-2">
                      {r.created_at ? new Date(r.created_at).toLocaleDateString() : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </>
      )}
    </main>
  );
}
