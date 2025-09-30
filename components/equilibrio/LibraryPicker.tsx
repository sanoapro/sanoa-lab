// components/equilibrio/LibraryPicker.tsx
"use client";
import { useEffect, useState } from "react";

type Row = {
  id: string;
  module: string;
  kind: string;
  title: string;
  default_goal?: string | null;
  active: boolean;
};

export default function LibraryPicker({
  orgId,
  module = "equilibrio",
  onAdd,
}: {
  orgId: string;
  module?: string;
  onAdd: (row: Row) => void;
}) {
  const [q, setQ] = useState("");
  const [rows, setRows] = useState<Row[]>([]);

  async function load() {
    if (!orgId) return;
    const p = new URLSearchParams({ org_id: orgId, active: "true", module });
    if (q) p.set("q", q);
    const r = await fetch(`/api/modules/equilibrio/library/list?${p.toString()}`, {
      cache: "no-store",
    });
    const j = await r.json();
    setRows(j?.ok ? j.data : []);
  }

  useEffect(() => {
    load();
  }, [orgId, module, q]);

  return (
    <section className="border rounded-2xl p-4 space-y-3">
      <div className="flex items-center gap-2">
        <input
          className="border rounded px-3 py-2 flex-1"
          placeholder="Buscar tarea (ej. respiración, caminata…) "
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <button className="border rounded px-3 py-2" onClick={load}>
          Buscar
        </button>
      </div>
      <div className="rounded border overflow-auto max-h-72">
        <table className="w-full text-sm">
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-b">
                <td className="px-3 py-2 w-28 text-xs text-slate-500">{r.kind}</td>
                <td className="px-3 py-2">{r.title}</td>
                <td className="px-3 py-2 w-44 text-right text-slate-500">
                  {r.default_goal || "—"}
                </td>
                <td className="px-3 py-2 w-28 text-right">
                  <button className="border rounded px-3 py-1" onClick={() => onAdd(r)}>
                    Agregar
                  </button>
                </td>
              </tr>
            ))}
            {!rows.length && (
              <tr>
                <td className="px-3 py-6 text-center text-slate-500">Sin resultados</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
