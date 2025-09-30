// components/sonrisa/CatalogPicker.tsx
"use client";
import { useEffect, useState } from "react";

type Row = { id: string; code: string; name: string; default_price_cents: number; active: boolean };

export default function CatalogPicker({
  orgId,
  onAdd,
}: {
  orgId: string;
  onAdd: (item: {
    description: string;
    qty: number;
    unit_price_cents: number;
    treatment_id?: string;
  }) => void;
}) {
  const [rows, setRows] = useState<Row[]>([]);
  const [q, setQ] = useState("");

  async function load() {
    const p = new URLSearchParams({ org_id: orgId, active: "true" });
    if (q) p.set("q", q);
    const r = await fetch(`/api/modules/sonrisa/treatments/list?${p.toString()}`, {
      cache: "no-store",
    });
    const j = await r.json();
    setRows(j?.ok ? j.data : []);
  }

  useEffect(() => {
    if (orgId) load();
  }, [orgId, q]);

  return (
    <div className="border rounded-2xl p-4 space-y-3">
      <div className="flex items-center gap-2">
        <input
          className="border rounded px-3 py-2 flex-1"
          placeholder="Buscar tratamiento…"
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
                <td className="px-3 py-2 w-24 text-xs text-slate-500">{r.code}</td>
                <td className="px-3 py-2">{r.name}</td>
                <td className="px-3 py-2 w-32 text-right">
                  {(r.default_price_cents / 100).toLocaleString("es-MX", {
                    style: "currency",
                    currency: "MXN",
                  })}
                </td>
                <td className="px-3 py-2 w-28 text-right">
                  <button
                    className="border rounded px-3 py-1"
                    onClick={() =>
                      onAdd({
                        description: r.name,
                        qty: 1,
                        unit_price_cents: r.default_price_cents,
                        treatment_id: r.id,
                      })
                    }
                  >
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
    </div>
  );
}
