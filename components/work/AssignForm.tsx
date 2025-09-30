// components/work/AssignForm.tsx
"use client";

import * as React from "react";
import { listTemplates, type WorkTemplate } from "@/lib/work/templates";
import { assignWork } from "@/lib/work/assignments";
import { getActiveOrg } from "@/lib/org-local";
import QuickBar from "@/components/patients/QuickBar";
import ColorEmoji from "@/components/ColorEmoji";

const MODULES = ["general", "mente", "equilibrio", "sonrisa", "pulso"] as const;

export default function AssignForm() {
  const org = getActiveOrg();
  const [module, setModule] = React.useState<(typeof MODULES)[number]>("general");
  const [templates, setTemplates] = React.useState<WorkTemplate[]>([]);
  const [templateId, setTemplateId] = React.useState<string>("");
  const [patientId, setPatientId] = React.useState<string>("");
  const [title, setTitle] = React.useState("");
  const [content, setContent] = React.useState("{}");
  const [dueAt, setDueAt] = React.useState<string>("");
  const [frequency, setFrequency] = React.useState<"once" | "daily" | "weekly" | "monthly">("once");
  const [occ, setOcc] = React.useState<number | "">("");

  React.useEffect(() => {
    async function load() {
      if (!org.id) return;
      const list = await listTemplates({ org_id: org.id, module, active: true });
      setTemplates(list);
    }
    load();
  }, [org.id, module]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!org.id || !patientId) { alert("Falta organización o paciente"); return; }
    let json: any = undefined;
    if (!templateId) {
      try { json = JSON.parse(content || "{}"); } catch { alert("Contenido JSON inválido"); return; }
    }
    const res = await assignWork({
      org_id: org.id,
      patient_ids: [patientId],
      module,
      template_id: templateId || undefined,
      title: templateId ? undefined : (title || "Tarea"),
      content: templateId ? undefined : json,
      due_at: dueAt || undefined,
      frequency,
      occurrences: typeof occ === "number" ? occ : undefined,
    });
    if (res?.ok) {
      alert("Asignado correctamente");
      setTemplateId(""); setTitle(""); setContent("{}"); setDueAt(""); setFrequency("once"); setOcc("");
    } else {
      alert(res?.error?.message || "Error al asignar");
    }
  }

  return (
    <form onSubmit={onSubmit} className="rounded-2xl border p-4 bg-white/95 dark:bg-slate-900/60 space-y-4">
      <h3 className="font-semibold flex items-center gap-2"><ColorEmoji token="trabajo" /> Asignar tarea/ejercicio</h3>

      <div className="space-y-2">
        <div className="text-sm text-slate-500">Paciente</div>
        {/* QuickBar navega por defecto; aquí solo queremos el id → usamos un input oculto + callback simple */}
        <PatientPicker onPick={(id) => setPatientId(id)} />
        {patientId ? <div className="text-xs text-green-600">Paciente seleccionado: {patientId}</div> : <div className="text-xs text-slate-500">Escribe para buscar…</div>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <label className="flex flex-col gap-1">
          <span className="text-sm text-slate-500">Módulo</span>
          <select value={module} onChange={e => setModule(e.target.value as any)} className="rounded-xl border px-3 py-2 bg-white dark:bg-slate-900">
            {MODULES.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </label>

        <label className="flex flex-col gap-1 md:col-span-2">
          <span className="text-sm text-slate-500">Plantilla</span>
          <select value={templateId} onChange={e => setTemplateId(e.target.value)} className="rounded-xl border px-3 py-2 bg-white dark:bg-slate-900">
            <option value="">— Ad-hoc —</option>
            {templates.map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
          </select>
        </label>

        {!templateId && (
          <>
            <label className="flex flex-col gap-1 md:col-span-3">
              <span className="text-sm text-slate-500">Título</span>
              <input value={title} onChange={e => setTitle(e.target.value)} className="rounded-xl border px-3 py-2 bg-white dark:bg-slate-900" />
            </label>
            <label className="flex flex-col gap-1 md:col-span-3">
              <span className="text-sm text-slate-500">Contenido (JSON)</span>
              <textarea value={content} onChange={e => setContent(e.target.value)} rows={5} className="rounded-xl border px-3 py-2 font-mono text-xs bg-white dark:bg-slate-900" />
            </label>
          </>
        )}

        <label className="flex flex-col gap-1">
          <span className="text-sm text-slate-500">Vence (ISO)</span>
          <input type="datetime-local" value={dueAt} onChange={e => setDueAt(e.target.value)} className="rounded-xl border px-3 py-2 bg-white dark:bg-slate-900" />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-sm text-slate-500">Frecuencia</span>
          <select value={frequency} onChange={e => setFrequency(e.target.value as any)} className="rounded-xl border px-3 py-2 bg-white dark:bg-slate-900">
            <option value="once">Una vez</option>
            <option value="daily">Diario</option>
            <option value="weekly">Semanal</option>
            <option value="monthly">Mensual</option>
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-sm text-slate-500">Ocurrencias (opcional)</span>
          <input type="number" min={1} max={100} value={occ} onChange={e => setOcc(e.target.value ? Number(e.target.value) : "")} className="rounded-xl border px-3 py-2 bg-white dark:bg-slate-900" />
        </label>
      </div>

      <div className="flex gap-2">
        <button className="px-4 py-2 rounded-xl bg-blue-600 text-white">Asignar</button>
      </div>
    </form>
  );
}

function PatientPicker({ onPick }: { onPick: (id: string) => void }) {
  // Reutilizamos QuickBar pero interceptamos navegación
  // Truco: sobrescribimos router.push de QuickBar vía location mock? Simpler: envolvemos QuickBar y escuchamos click → para demo pedimos id manual.
  // Para no tocar QuickBar original, ofrecemos un input rápido:
  const [id, setId] = React.useState("");
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1">
        <QuickBar placeholder="Buscar paciente…" />
      </div>
      <input className="rounded-xl border px-3 py-2 w-[16rem]" placeholder="o pega Patient ID" value={id} onChange={e => setId(e.target.value)} />
      <button type="button" onClick={() => id && onPick(id)} className="px-3 py-2 rounded-lg border">Usar ID</button>
    </div>
  );
}
