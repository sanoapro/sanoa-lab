// components/work/AssignForm.tsx
"use client";

import * as React from "react";
import { getActiveOrg } from "@/lib/org-local";
import Autocomplete from "@/components/patients/Autocomplete";
import { listTemplates, type WorkTemplate } from "@/lib/work/templates";
import { assignWork } from "@/lib/work/assignments";
import ColorEmoji from "@/components/ColorEmoji";

const MODULES = ["general", "mente", "equilibrio", "sonrisa", "pulso"] as const;
type Module = (typeof MODULES)[number];

export default function AssignForm() {
  const org = getActiveOrg();

  const [patient, setPatient] = React.useState<{ id: string; name: string } | null>(null);
  const [module, setModule] = React.useState<Module>("general");
  const [templates, setTemplates] = React.useState<WorkTemplate[]>([]);
  const [templateId, setTemplateId] = React.useState<string>("");

  // Campos para asignación ad-hoc (cuando no se elige plantilla)
  const [title, setTitle] = React.useState("");
  const [content, setContent] = React.useState("{}");

  // Programación
  const [dueAt, setDueAt] = React.useState<string>("");
  const [frequency, setFrequency] = React.useState<"once" | "daily" | "weekly" | "monthly">("once");
  const [occ, setOcc] = React.useState<number | "">("");

  // Cargar plantillas activas por módulo y organización
  React.useEffect(() => {
    (async () => {
      if (!org.id) return;
      const list = await listTemplates({ org_id: org.id, module, active: true });
      setTemplates(list);
    })();
  }, [org.id, module]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!org.id || !patient) {
      alert("Selecciona una organización y un paciente");
      return;
    }

    let json: any = undefined;
    if (!templateId) {
      try {
        json = JSON.parse(content || "{}");
      } catch {
        alert("Contenido JSON inválido");
        return;
      }
      if (!title.trim()) {
        alert("Escribe un título o elige una plantilla");
        return;
      }
    }

    const res = await assignWork({
      org_id: org.id,
      patient_ids: [patient.id],
      module,
      template_id: templateId || undefined,
      title: templateId ? undefined : title.trim(),
      content: templateId ? undefined : json,
      due_at: dueAt ? new Date(dueAt).toISOString() : undefined,
      frequency,
      occurrences: typeof occ === "number" ? occ : undefined,
    });

    if (res?.ok) {
      alert("Asignado correctamente ✅");
      // limpiar campos
      setTemplateId("");
      setTitle("");
      setContent("{}");
      setDueAt("");
      setFrequency("once");
      setOcc("");
    } else {
      alert(res?.error?.message || "Error al asignar");
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="rounded-2xl border bg-white/95 dark:bg-slate-900/60 p-4 space-y-4"
    >
      <h3 className="font-semibold flex items-center gap-2">
        <ColorEmoji token="trabajo" /> Nueva asignación
      </h3>

      {/* Paciente */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="md:col-span-2">
          <Autocomplete
            placeholder="Buscar paciente…"
            onSelect={(s) => setPatient({ id: s.patient_id, name: s.display_name })}
            autoFocus
          />
          {patient && <p className="text-xs text-slate-500 mt-1">Paciente: {patient.name}</p>}
        </div>

        <label className="flex flex-col gap-1">
          <span className="text-sm text-slate-500">Fecha límite (opcional)</span>
          <input
            type="datetime-local"
            value={dueAt}
            onChange={(e) => setDueAt(e.target.value)}
            className="rounded-xl border px-3 py-2 bg-white dark:bg-slate-900"
          />
        </label>
      </div>

      {/* Configuración de la tarea */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <label className="flex flex-col gap-1">
          <span className="text-sm text-slate-500">Módulo</span>
          <select
            value={module}
            onChange={(e) => setModule(e.target.value as Module)}
            className="rounded-xl border px-3 py-2 bg-white dark:bg-slate-900"
          >
            {MODULES.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 md:col-span-2">
          <span className="text-sm text-slate-500">Plantilla (opcional)</span>
          <select
            className="rounded-xl border px-3 py-2 bg-white dark:bg-slate-900"
            value={templateId}
            onChange={(e) => setTemplateId(e.target.value)}
          >
            <option value="">— Ad-hoc —</option>
            {templates.map((t) => (
              <option key={t.id} value={t.id}>
                {t.title}
              </option>
            ))}
          </select>
        </label>

        {/* Campos sólo si NO hay plantilla */}
        {!templateId && (
          <>
            <label className="flex flex-col gap-1 md:col-span-3">
              <span className="text-sm text-slate-500">Título (si no usas plantilla)</span>
              <input
                className="rounded-xl border px-3 py-2 bg-white dark:bg-slate-900"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="p.ej., Caminar 20 min diarios"
              />
            </label>

            <label className="flex flex-col gap-1 md:col-span-3">
              <span className="text-sm text-slate-500">Contenido (JSON)</span>
              <textarea
                rows={5}
                className="rounded-xl border px-3 py-2 font-mono text-xs bg-white dark:bg-slate-900"
                value={content}
                onChange={(e) => setContent(e.target.value)}
              />
            </label>
          </>
        )}

        <label className="flex flex-col gap-1">
          <span className="text-sm text-slate-500">Frecuencia</span>
          <select
            value={frequency}
            onChange={(e) => setFrequency(e.target.value as any)}
            className="rounded-xl border px-3 py-2 bg-white dark:bg-slate-900"
          >
            <option value="once">Una vez</option>
            <option value="daily">Diario</option>
            <option value="weekly">Semanal</option>
            <option value="monthly">Mensual</option>
          </select>
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm text-slate-500">Ocurrencias (opcional)</span>
          <input
            type="number"
            min={1}
            max={100}
            value={occ}
            onChange={(e) => setOcc(e.target.value ? Number(e.target.value) : "")}
            className="rounded-xl border px-3 py-2 bg-white dark:bg-slate-900"
          />
        </label>
      </div>

      <div className="flex gap-2">
        <button type="submit" className="px-4 py-2 rounded-xl bg-blue-600 text-white">
          Asignar
        </button>
      </div>
    </form>
  );
}
