// components/work/TemplateEditor.tsx
"use client";

import * as React from "react";
import {
  listTemplates,
  createTemplate,
  updateTemplate,
  type WorkTemplate,
} from "@/lib/work/templates";
import { getActiveOrg } from "@/lib/org-local";
import ColorEmoji from "@/components/ColorEmoji";
import { Field, Textarea } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

const MODULES = ["general", "mente", "equilibrio", "sonrisa", "pulso"] as const;

export default function TemplateEditor() {
  const org = getActiveOrg();
  const [module, setModule] = React.useState<(typeof MODULES)[number]>("general");
  const [title, setTitle] = React.useState("");
  const [content, setContent] = React.useState("{}");
  const [tags, setTags] = React.useState<string>("");
  const [list, setList] = React.useState<WorkTemplate[]>([]);
  const [loading, setLoading] = React.useState(false);

  async function load() {
    if (!org.id) return;
    setLoading(true);
    const res = await listTemplates({ org_id: org.id, module });
    setList(res);
    setLoading(false);
  }

  React.useEffect(() => {
    load();  
  }, [module, org.id]);

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!org.id) return;
    let json: any = {};
    try {
      json = JSON.parse(content || "{}");
    } catch {
      alert("JSON inválido en contenido");
      return;
    }
    const res = await createTemplate({
      org_id: org.id,
      module,
      title,
      content: json,
      tags: tags
        .split(",")
        .map((s: any) => s.trim())
        .filter(Boolean),
      is_active: true,
    });
    if (res?.ok) {
      setTitle("");
      setContent("{}");
      setTags("");
      await load();
    } else alert(res?.error?.message || "Error al crear");
  }

  async function toggleActive(t: WorkTemplate) {
    const res = await updateTemplate(t.id, { is_active: !t.is_active });
    if (res?.ok) await load();
  }

  return (
    <div className="space-y-8">
      <form
        onSubmit={onCreate}
        className="rounded-2xl border bg-white/95 dark:bg-slate-900/60 p-4 space-y-3"
      >
        <h3 className="font-semibold flex items-center gap-2">
          <ColorEmoji token="carpeta" /> Nueva plantilla
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Field label={<span className="text-slate-500">Módulo</span>}>
            <select
              value={module}
              onChange={(e: any) => setModule(e.target.value as any)}
              className="rounded-xl border px-3 py-2 bg-white dark:bg-slate-900"
            >
              {MODULES.map((m: any) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </Field>
          <Field label={<span className="text-slate-500">Título</span>} className="md:col-span-2">
            <Input
              value={title}
              onChange={(e: any) => setTitle(e.target.value)}
              required
              className="bg-white dark:bg-slate-900"
            />
          </Field>
          <Field label={<span className="text-slate-500">Contenido (JSON)</span>} className="md:col-span-3">
            <Textarea
              value={content}
              onChange={(e: any) => setContent(e.target.value)}
              rows={6}
              className="font-mono text-xs bg-white dark:bg-slate-900"
            />
          </Field>
          <Field label={<span className="text-slate-500">Tags (coma)</span>} className="md:col-span-3">
            <Input
              value={tags}
              onChange={(e: any) => setTags(e.target.value)}
              className="bg-white dark:bg-slate-900"
            />
          </Field>
        </div>
        <div className="flex gap-2">
          <button className="px-4 py-2 rounded-xl bg-blue-600 text-white">Guardar plantilla</button>
        </div>
      </form>

      <div className="rounded-2xl border bg-white/95 dark:bg-slate-900/60">
        <div className="p-4 flex items-center justify-between">
          <h3 className="font-semibold flex items-center gap-2">
            <ColorEmoji token="carpeta" /> Plantillas ({module})
          </h3>
          {loading && <span className="text-sm text-slate-500">Cargando…</span>}
        </div>
        <ul className="divide-y">
          {list.map((t: any) => (
            <li key={t.id} className="p-4 flex items-center justify-between gap-4">
              <div className="min-w-0">
                <div className="font-medium truncate">{t.title}</div>
                <div className="text-xs text-slate-500 truncate">
                  Tags: {t.tags?.join(", ") || "—"}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => toggleActive(t)} className="px-3 py-1 rounded-lg border">
                  {t.is_active ? "Desactivar" : "Activar"}
                </button>
              </div>
            </li>
          ))}
          {list.length === 0 && !loading && (
            <li className="p-4 text-sm text-slate-500">Sin plantillas</li>
          )}
        </ul>
      </div>
    </div>
  );
}
