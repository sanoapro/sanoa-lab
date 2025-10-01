"use client";
import { useEffect, useState } from "react";
import { SEED_TEMPLATES } from "@/lib/templates.seed";

type Template = { id: string; name: string; active?: boolean | null };

type Props = {
  orgId: string;
  mine?: boolean;
  onChoose: (tpl: Template) => void;
};

export default function TemplatePicker({ orgId, mine = false, onChoose }: Props) {
  const [q, setQ] = useState("");
  const [rows, setRows] = useState<Template[]>([]);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);

  async function load() {
    if (!orgId) {
      setRows([]);
      return;
    }
    setLoading(true);
    try {
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
    } catch (err) {
      console.error(err);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }

  async function importSeed() {
    if (!orgId || importing) return;
    setImporting(true);
    try {
      const payload = SEED_TEMPLATES.map((tpl) => ({
        ...tpl,
        org_id: orgId,
      }));
      const r = await fetch("/api/prescriptions/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const j = await r.json().catch(() => null);
      if (!r.ok || !j?.ok) {
        const message = j?.error?.message ?? "Error al importar plantillas";
        console.error(message);
        alert(message);
        return;
      }
      await load();
    } catch (err) {
      console.error(err);
      alert("No se pudo importar la base de plantillas");
    } finally {
      setImporting(false);
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
        <button className="border rounded px-3 py-2" onClick={load} disabled={loading}>
          {loading ? "Cargando..." : "Buscar"}
        </button>
        <button
          className="glass-btn"
          onClick={() => void importSeed()}
          disabled={!orgId || loading || importing}
        >
          {importing ? "Importando..." : "📦 Importar base"}
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
                <td className="px-3 py-6 text-center text-slate-500">
                  {loading ? "Cargando..." : "Sin plantillas"}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
