"use client";

import { useEffect, useId, useMemo, useState, type FormEvent } from "react";
import { getActiveOrg } from "@/lib/org-local";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import { Field } from "@/components/ui/field";

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

  const [form, setForm] = useState<{
    if_text_like: string;
    set_category_id: string;
    set_tags: string;
    priority: number;
  }>({
    if_text_like: "",
    set_category_id: "",
    set_tags: "",
    priority: 100,
  });

  useEffect(() => {
    let alive = true;
    async function run() {
      setLoading(true);
      // reglas por API. Solo se muestran pacientes de tu organización.
      const r = await fetch(`/api/bank/rules?org_id=${orgId}`)
        .then((r) => r.json())
        .catch(() => ({ ok: false }));
      // categorías desde Supabase browser client. Solo se muestran pacientes de tu organización.
      const supa = getSupabaseBrowser();
      const { data: catData } = await supa
        .from("bank_categories")
        .select("id,name,kind")
        .eq("org_id", orgId)
        .order("name", { ascending: true });
      if (!alive) return;
      if (r.ok) setRules(r.data);
      setCats((catData ?? []) as Category[]);
      setLoading(false);
    }
    if (orgId) run();
    return () => {
      alive = false;
    };
  }, [orgId]);

  async function addOrUpdateRule() {
    if (!orgId || !form.if_text_like.trim()) return;
    const payload = {
      org_id: orgId,
      rule: {
        if_text_like: form.if_text_like.trim(),
        set_category_id: form.set_category_id || null,
        set_tags: form.set_tags
          ? form.set_tags
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean)
          : null,
        priority: form.priority || 100,
      },
    };
    const res = await fetch("/api/bank/rules", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    const j = await res.json();
    if (j.ok) {
      setRules((prev) => [...prev, ...j.data].sort((a, b) => a.priority - b.priority));
      setForm({ if_text_like: "", set_category_id: "", set_tags: "", priority: 100 });
    }
  }

  async function removeRule(id: string) {
    const res = await fetch(`/api/bank/rules/${id}?org_id=${orgId}`, { method: "DELETE" });
    const j = await res.json();
    if (j.ok) setRules((prev) => prev.filter((r) => r.id !== id));
  }

  const containsTextId = useId();
  const categoryId = useId();
  const tagsId = useId();
  const priorityId = useId();

  const canSubmit = form.if_text_like.trim().length > 0;

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    addOrUpdateRule();
  };

  return (
    <div className="space-y-3">
      <div className="glass-card bubble">
        <h2 className="text-lg font-semibold">
          <span className="emoji" aria-hidden="true">
            🧪
          </span>{" "}
          Reglas
        </h2>
        <p className="text-sm text-contrast/80">
          Clasifica y etiqueta movimientos automáticamente.
        </p>
      </div>

      <form className="glass-card bubble space-y-3" onSubmit={handleSubmit} noValidate>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <Field label={<span className="text-sm">Contiene texto</span>} htmlFor={containsTextId} required>
            <input
              id={containsTextId}
              className="glass-input"
              placeholder="ej. Uber, Starbucks"
              value={form.if_text_like}
              onChange={(e) => setForm((f) => ({ ...f, if_text_like: e.target.value }))}
              required
            />
          </Field>
          <Field label={<span className="text-sm">Categoría</span>} htmlFor={categoryId}>
            <select
              id={categoryId}
              className="glass-input"
              value={form.set_category_id}
              onChange={(e) => setForm((f) => ({ ...f, set_category_id: e.target.value }))}
            >
              <option value="">(sin cambio)</option>
              {cats.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} · {c.kind}
                </option>
              ))}
            </select>
          </Field>
          <Field label={<span className="text-sm">Etiquetas (separadas por coma)</span>} htmlFor={tagsId}>
            <input
              id={tagsId}
              className="glass-input"
              placeholder="marketing, campaña"
              value={form.set_tags}
              onChange={(e) => setForm((f) => ({ ...f, set_tags: e.target.value }))}
            />
          </Field>
          <Field label={<span className="text-sm">Prioridad</span>} htmlFor={priorityId}>
            <input
              id={priorityId}
              type="number"
              className="glass-input"
              value={form.priority}
              onChange={(e) =>
                setForm((f) => ({ ...f, priority: Number(e.target.value || 100) }))
              }
              min={1}
            />
          </Field>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="submit"
            className="glass-btn"
            disabled={!canSubmit}
            aria-disabled={!canSubmit}
          >
            <span className="emoji" aria-hidden="true">
              💾
            </span>{" "}
            Guardar regla
          </button>
          <button type="button" className="glass-btn" disabled title="Próximamente">
            <span className="emoji" aria-hidden="true">
              🧪
            </span>{" "}
            Probar
          </button>
        </div>
      </form>

      <section className="glass-card bubble space-y-3" aria-live="polite">
        <header className="flex items-center justify-between">
          <h3 className="text-base font-semibold">Reglas existentes</h3>
          <span className="text-sm text-contrast/70">
            {loading ? "Cargando…" : `${rules.length} regla${rules.length === 1 ? "" : "s"}`}
          </span>
        </header>

        {loading && (
          <p className="text-sm text-contrast/80">Obteniendo reglas, por favor espera…</p>
        )}

        {!loading && rules.length === 0 && (
          <p className="text-sm text-contrast/80">Aún no hay reglas configuradas.</p>
        )}

        {!loading && rules.length > 0 && (
          <ul className="space-y-2">
            {rules.map((r) => {
              const category = cats.find((c) => c.id === r.set_category_id);
              return (
                <li key={r.id} className="rounded-lg border border-foreground/10 p-3">
                  <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                    <div className="space-y-1 text-sm">
                      <p className="font-medium text-contrast">
                        Prioridad {r.priority} · <span className="text-contrast/80">{r.if_text_like}</span>
                      </p>
                      <p className="text-contrast/80">
                        <span className="font-medium">Categoría:</span> {category?.name ?? "—"}
                      </p>
                      <p className="text-contrast/80">
                        <span className="font-medium">Etiquetas:</span> {(r.set_tags ?? []).join(", ") || "—"}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
          <button
            type="button"
            className="glass-btn"
            onClick={() => removeRule(r.id)}
          >
            <span className="emoji" aria-hidden="true">🗑️</span> Eliminar
          </button>
        </div>
      </div>
    </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
