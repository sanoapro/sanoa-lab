"use client";

import { useEffect, useMemo, useState } from "react";
import { getActiveOrg } from "@/lib/org-local";
import { getSupabaseBrowser } from "@/lib/supabase-browser";

type Category = { id: string; name: string; kind: "income" | "expense" };
type Budget = {
  id: string;
  org_id: string;
  category_id: string;
  month: string;
  amount_cents: number;
  created_at: string;
};

function ymFirst(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1).toISOString().slice(0, 10);
}

function fmtMoney(cents: number, currency = "MXN") {
  return new Intl.NumberFormat("es-MX", { style: "currency", currency }).format((cents || 0) / 100);
}

export default function BudgetsGrid() {
  const org = useMemo(() => getActiveOrg(), []);
  const orgId = org?.id || "";
  const [cats, setCats] = useState<Category[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [month, setMonth] = useState(ymFirst(new Date()));
  const [loading, setLoading] = useState(true);
  const [row, setRow] = useState<{ category_id: string; amount_cents: number }>({
    category_id: "",
    amount_cents: 0,
  });

  useEffect(() => {
    let alive = true;
    async function run() {
      setLoading(true);
      const supa = getSupabaseBrowser();
      const [{ data: catData }, bud] = await Promise.all([
        supa.from("bank_categories").select("id,name,kind").eq("org_id", orgId).order("name"),
        fetch(`/api/bank/budgets?org_id=${orgId}&month=${month}`)
          .then((r) => r.json())
          .catch(() => ({ ok: false })),
      ]);
      if (!alive) return;
      setCats((catData ?? []) as Category[]);
      if (bud.ok) setBudgets(bud.data);
      setLoading(false);
    }
    if (orgId) run();
    return () => {
      alive = false;
    };
  }, [orgId, month]);

  async function upsertBudget() {
    if (!orgId || !row.category_id || !month) return;
    const payload = {
      org_id: orgId,
      items: [{ category_id: row.category_id, month, amount_cents: row.amount_cents }],
    };
    const res = await fetch("/api/bank/budgets", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    const j = await res.json();
    if (j.ok) {
      // refrescar lista
      const r = await fetch(`/api/bank/budgets?org_id=${orgId}&month=${month}`).then((r) =>
        r.json(),
      );
      if (r.ok) setBudgets(r.data);
      setRow({ category_id: "", amount_cents: 0 });
    }
  }

  return (
    <div className="space-y-4">
      <div className="rounded border p-3">
        <div className="flex flex-col md:flex-row gap-3 md:items-end">
          <div>
            <label className="block text-sm mb-1">Mes</label>
            <input
              type="month"
              className="rounded border px-3 py-2"
              value={month.slice(0, 7)}
              onChange={(e) => setMonth(`${e.target.value}-01`)}
            />
          </div>
          <div>
            <label className="block text-sm mb-1">Categoría</label>
            <select
              className="rounded border px-3 py-2"
              value={row.category_id}
              onChange={(e) => setRow((r) => ({ ...r, category_id: e.target.value }))}
            >
              <option value="">Selecciona</option>
              {cats.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} · {c.kind}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm mb-1">Monto</label>
            <input
              type="number"
              className="rounded border px-3 py-2"
              value={row.amount_cents}
              onChange={(e) => setRow((r) => ({ ...r, amount_cents: Number(e.target.value || 0) }))}
            />
          </div>
          <div>
            <button className="rounded px-4 py-2 border" onClick={upsertBudget}>
              Guardar
            </button>
          </div>
        </div>
      </div>

      <div className="rounded border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-3 py-2">Categoría</th>
              <th className="text-left px-3 py-2">Tipo</th>
              <th className="text-right px-3 py-2">Presupuesto</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td className="px-3 py-6 text-center" colSpan={3}>
                  Cargando…
                </td>
              </tr>
            )}
            {!loading && budgets.length === 0 && (
              <tr>
                <td className="px-3 py-6 text-center" colSpan={3}>
                  Sin presupuestos para el mes.
                </td>
              </tr>
            )}
            {!loading &&
              budgets.map((b) => {
                const c = cats.find((x) => x.id === b.category_id);
                return (
                  <tr key={b.id} className="border-t">
                    <td className="px-3 py-2">{c?.name ?? b.category_id}</td>
                    <td className="px-3 py-2">{c?.kind ?? "—"}</td>
                    <td className="px-3 py-2 text-right">{fmtMoney(b.amount_cents)}</td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
