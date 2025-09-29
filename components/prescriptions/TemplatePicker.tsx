"use client";
import { useEffect, useState } from "react";

type Template = { id: string; name: string; active?: boolean | null };

type Props = {
  orgId: string;
  mine?: boolean;
  onChoose: (tpl: Template) => void;
};

export default function TemplatePicker({ orgId, mine = false, onChoose }: Props) {
  const [q, setQ] = useState("");
  const [rows, setRows] = useState<Template[]>([]);

  async function load() {
    if (!orgId) {
      setRows([]);
      return;
    }
    const params = new URLSearchParams({ org_id: orgId, mine: mine ? "1" : "0" });
    if (q) params.set("q", q);
    const r = await fetch(`/api/prescriptions/templates?${params.toString()}`, {
      cache: "no-store",
    });
    const j = await r.json().catch(() => null);
    if (j?.ok && Array.isArray(j.data)) {
      setRows(j.data);
    } else if (Array.isArray(j?.items)) {
      setRows(j.items);
    } else {
      setRows([]);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orgId, q, mine]);

  return (
    <section className="border rounded-2xl p-4 space-y-3">
      <div className="flex items-center gap-2">
        <input
          className="border rounded px-3 py-2 flex-1"
          placeholder="Buscar plantilla..."
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
                <td className="px-3 py-2">{r.name}</td>
                <td className="px-3 py-2 w-28 text-right">
                  <button className="border rounded px-3 py-1" onClick={() => onChoose(r)}>
                    Usar
                  </button>
                </td>
              </tr>
            ))}
            {!rows.length && (
              <tr>
                <td className="px-3 py-6 text-center text-slate-500">Sin plantillas</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
