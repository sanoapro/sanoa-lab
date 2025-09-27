"use client";

import { useEffect, useMemo, useState } from "react";
import { getActiveOrg } from "@/lib/org-local";
import { getSupabaseBrowser } from "@/lib/supabase-browser";

type Rule = {
  id: string;
  org_id: string;
  if_text_like: string;
  set_category_id: string | null;
  set_tags: string[] | null;
  priority: number;
  created_at: string;
};

type Category = { id: string; name: string; kind: "income" | "expense" };

export default function RulesEditor() {
  const org = useMemo(() => getActiveOrg(), []);
  const orgId = org?.id || "";
  const [rules, setRules] = useState<Rule[]>([]);
  const [cats, setCats] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState<{ if_text_like: string; set_category_id: string; set_tags: string; priority: number }>({
    if_text_like: "",
    set_category_id: "",
    set_tags: "",
    priority: 100,
  });

  useEffect(() => {
    let alive = true;
    async function run() {
      setLoading(true);
      // reglas por API (RLS por sesión)
      const r = await fetch(`/api/bank/rules?org_id=${orgId}`).then(r => r.json()).catch(() => ({ ok: false }));
      // categorías desde Supabase browser client (RLS)
      const supa = getSupabaseBrowser();
      const { data: catData } = await supa.from("bank_categories").select("id,name,kind").eq("org_id", orgId).order("name", { ascending: true });
      if (!alive) return;
      if (r.ok) setRules(r.data);
      setCats((catData ?? []) as Category[]);
      setLoading(false);
    }
    if (orgId) run();
    return () => { alive = false; }
  }, [orgId]);

  async function addOrUpdateRule() {
    if (!orgId || !form.if_text_like.trim()) return;
    const payload = {
      org_id: orgId,
      rule: {
        if_text_like: form.if_text_like.trim(),
        set_category_id: form.set_category_id || null,
        set_tags: form.set_tags ? form.set_tags.split(",").map(s => s.trim()).filter(Boolean) : null,
        priority: form.priority || 100,
      }
    };
    const res = await fetch("/api/bank/rules", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload) });
    const j = await res.json();
    if (j.ok) {
      setRules((prev) => [...prev, ...j.data].sort((a, b) => a.priority - b.priority));
      setForm({ if_text_like: "", set_category_id: "", set_tags: "", priority: 100 });
    }
  }

  async function removeRule(id: string) {
    const res = await fetch(`/api/bank/rules/${id}?org_id=${orgId}`, { method: "DELETE" });
    const j = await res.json();
    if (j.ok) setRules((prev) => prev.filter(r => r.id !== id));
  }

  return (
    <div className="space-y-4">
      <div className="rounded border p-3">
        <h2 className="font-semibold mb-2">Nueva regla</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
          <div>
            <label className="block text-sm mb-1">Texto contiene</label>
            <input className="w-full rounded border px-3 py-2" value={form.if_text_like} onChange={e => setForm(f => ({ ...f, if_text_like: e.target.value }))} />
          </div>
          <div>
            <label className="block text-sm mb-1">Categoría</label>
            <select className="w-full rounded border px-3 py-2" value={form.set_category_id} onChange={e => setForm(f => ({ ...f, set_category_id: e.target.value }))}>
              <option value="">(sin cambio)</option>
              {cats.map(c => (<option key={c.id} value={c.id}>{c.name} · {c.kind}</option>))}
            </select>
          </div>
          <div>
            <label className="block text-sm mb-1">Tags (coma)</label>
            <input className="w-full rounded border px-3 py-2" placeholder="marketing, campaña" value={form.set_tags} onChange={e => setForm(f => ({ ...f, set_tags: e.target.value }))} />
          </div>
          <div>
            <label className="block text-sm mb-1">Prioridad</label>
            <input type="number" className="w-full rounded border px-3 py-2" value={form.priority} onChange={e => setForm(f => ({ ...f, priority: Number(e.target.value || 100) }))} />
          </div>
        </div>
        <div className="mt-2">
          <button className="rounded px-4 py-2 border" onClick={addOrUpdateRule}>Guardar regla</button>
        </div>
      </div>

      <div className="rounded border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-3 py-2">Prioridad</th>
              <th className="text-left px-3 py-2">Contiene</th>
              <th className="text-left px-3 py-2">Categoría</th>
              <th className="text-left px-3 py-2">Tags</th>
              <th className="text-left px-3 py-2">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading && (<tr><td className="px-3 py-6 text-center" colSpan={5}>Cargando…</td></tr>)}
            {!loading && rules.length === 0 && (<tr><td className="px-3 py-6 text-center" colSpan={5}>Aún no hay reglas.</td></tr>)}
            {!loading && rules.map(r => (
              <tr key={r.id} className="border-t">
                <td className="px-3 py-2">{r.priority}</td>
                <td className="px-3 py-2">{r.if_text_like}</td>
                <td className="px-3 py-2">{cats.find(c => c.id === r.set_category_id)?.name ?? "—"}</td>
                <td className="px-3 py-2">{(r.set_tags ?? []).join(", ") || "—"}</td>
                <td className="px-3 py-2">
                  <button className="rounded px-3 py-1 border" onClick={() => removeRule(r.id)}>Eliminar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
