// components/agreements/TemplatesEditor.tsx
"use client";

import * as React from "react";
import { getActiveOrg } from "@/lib/org-local";

type Tpl = {
  id: string;
  org_id: string;
  type: "specialist_patient" | "specialist_platform" | "patient_platform";
  title: string;
  slug: string;
  description: string | null;
  content: any;
  is_active: boolean;
  provider_id: string | null;
  updated_at?: string;
};

const TYPES = [
  { val: "specialist_patient", label: "Especialista ↔ Paciente" },
  { val: "specialist_platform", label: "Especialista ↔ Plataforma" },
  { val: "patient_platform", label: "Paciente ↔ Plataforma" },
] as const;

export default function TemplatesEditor() {
  const org = getActiveOrg();
  const [list, setList] = React.useState<Tpl[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [q, setQ] = React.useState("");
  const [type, setType] = React.useState<Tpl["type"] | "">("");
  const [form, setForm] = React.useState<Partial<Tpl>>({
    type: "specialist_patient",
    title: "Acuerdo de atención",
    description: "Condiciones y responsabilidades.",
    content: defaultContent(),
    is_active: true,
  });

  async function load() {
    if (!org.id) return;
    setLoading(true);
    const url = new URL("/api/agreements/templates", window.location.origin);
    url.searchParams.set("org_id", org.id);
    if (type) url.searchParams.set("type", type);
    if (q.trim()) url.searchParams.set("q", q.trim());
    const r = await fetch(url.toString(), { cache: "no-store" });
    const j = await r.json();
    setLoading(false);
    setList(j?.ok ? (j.data as Tpl[]) : []);
  }

  React.useEffect(() => {
    load();  
  }, [org.id, type, q]);

  async function save() {
    if (!org.id || !form.title || !form.type) return alert("Completa título y tipo");
    const r = await fetch("/api/agreements/templates", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        org_id: org.id,
        id: form.id,
        type: form.type,
        title: form.title,
        slug: form.slug,
        description: form.description ?? "",
        content: form.content ?? defaultContent(),
        is_active: form.is_active ?? true,
        provider_id: form.provider_id ?? null,
      }),
    });
    const j = await r.json();
    if (!j?.ok) return alert(j?.error?.message || "Error al guardar");
    setForm({
      type: form.type,
      title: "Acuerdo de atención",
      description: "",
      content: defaultContent(),
      is_active: true,
    });
    load();
  }

  async function remove(id: string) {
    if (!org.id) return;
    if (!confirm("¿Desactivar esta plantilla?")) return;
    const r = await fetch(`/api/agreements/templates/${id}`, {
      method: "DELETE",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ org_id: org.id }),
    });
    const j = await r.json();
    if (!j?.ok) return alert(j?.error?.message || "Error al desactivar");
    load();
  }

  function edit(t: Tpl) {
    setForm({ ...t });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border bg-white/95 dark:bg-slate-900/60 p-4 space-y-4">
        <h3 className="font-semibold">Nueva / Editar plantilla</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <label className="flex flex-col gap-1">
            <span className="text-sm text-slate-500">Tipo</span>
            <select
              value={form.type ?? "specialist_patient"}
              onChange={(e: any) => setForm((f: any) => ({ ...f, type: e.target.value as any }))}
              className="rounded-xl border px-3 py-2 bg-white dark:bg-slate-900"
            >
              {TYPES.map((t: any) => (
                <option key={t.val} value={t.val}>
                  {t.label}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 md:col-span-2">
            <span className="text-sm text-slate-500">Título</span>
            <input
              className="rounded-xl border px-3 py-2"
              value={form.title ?? ""}
              onChange={(e: any) => setForm((f: any) => ({ ...f, title: e.target.value }))}
              placeholder="p.ej., Acuerdo de atención psicológica"
            />
          </label>
        </div>

        <label className="flex flex-col gap-1">
          <span className="text-sm text-slate-500">Descripción</span>
          <textarea
            className="rounded-xl border px-3 py-2"
            rows={2}
            value={form.description ?? ""}
            onChange={(e: any) => setForm((f: any) => ({ ...f, description: e.target.value }))}
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm text-slate-500">Contenido JSON</span>
          <textarea
            className="font-mono text-xs rounded-xl border px-3 py-2"
            rows={10}
            value={JSON.stringify(form.content ?? defaultContent(), null, 2)}
            onChange={(e: any) => {
              try {
                setForm((f: any) => ({ ...f, content: JSON.parse(e.target.value) }));
              } catch {
                /* noop */
              }
            }}
          />
        </label>

        <div className="flex items-center gap-3">
          <button onClick={save} className="px-4 py-2 rounded-xl bg-blue-600 text-white">
            Guardar
          </button>
          {form.id && <span className="text-xs text-slate-500">Editando: {form.id}</span>}
        </div>
      </div>

      <div className="rounded-2xl border bg-white/95 dark:bg-slate-900/60">
        <div className="p-4 flex items-center gap-3">
          <input
            className="rounded-xl border px-3 py-2"
            placeholder="Buscar…"
            value={q}
            onChange={(e: any) => setQ(e.target.value)}
          />
          <select
            className="rounded-xl border px-3 py-2 bg-white dark:bg-slate-900"
            value={type}
            onChange={(e: any) => setType(e.target.value as any)}
          >
            <option value="">Todos</option>
            {TYPES.map((t: any) => (
              <option key={t.val} value={t.val}>
                {t.label}
              </option>
            ))}
          </select>
          {loading && <span className="text-sm text-slate-500">Cargando…</span>}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-t border-b bg-slate-50/60 dark:bg-slate-800/40">
                <th className="p-2 text-left">Título</th>
                <th className="p-2 text-left">Tipo</th>
                <th className="p-2 text-left">Activa</th>
                <th className="p-2 text-left">Actualizada</th>
                <th className="p-2 text-left">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {list.map((t: any) => (
                <tr key={t.id} className="border-b">
                  <td className="p-2">{t.title}</td>
                  <td className="p-2">{t.type}</td>
                  <td className="p-2">{t.is_active ? "Sí" : "No"}</td>
                  <td className="p-2">
                    {t.updated_at ? new Date(t.updated_at).toLocaleString() : "—"}
                  </td>
                  <td className="p-2 flex gap-2">
                    <button className="px-3 py-1 rounded-lg border" onClick={() => edit(t)}>
                      Editar
                    </button>
                    <button className="px-3 py-1 rounded-lg border" onClick={() => remove(t.id)}>
                      Desactivar
                    </button>
                  </td>
                </tr>
              ))}
              {list.length === 0 && !loading && (
                <tr>
                  <td className="p-4 text-slate-500" colSpan={5}>
                    Sin plantillas.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function defaultContent() {
  return {
    clauses: [
      {
        key: "cancel_24h",
        label: "Cancelación con al menos 24h de antelación; de lo contrario, penalización.",
        required: true,
        defaultChecked: true,
      },
      {
        key: "penalty",
        label: "Penalización según política indicada (porcentaje o monto fijo).",
        required: true,
        defaultChecked: true,
      },
      {
        key: "punctuality",
        label: "Puntualidad: tolerancia máxima de X minutos.",
        required: false,
        defaultChecked: true,
      },
      {
        key: "prepay",
        label: "Pago anticipado obligatorio.",
        required: true,
        defaultChecked: true,
      },
      {
        key: "no_refund",
        label: "Sesión no reembolsable si se pierde la cita.",
        required: true,
        defaultChecked: true,
      },
      {
        key: "confidential",
        label: "Confidencialidad de la información.",
        required: true,
        defaultChecked: true,
      },
      {
        key: "digital_use",
        label: "Uso permitido de material digital proporcionado sólo para fines personales.",
        required: true,
        defaultChecked: true,
      },
    ],
    extra_rules: "",
  };
}
