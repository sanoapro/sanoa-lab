// components/work/AssignForm.tsx
"use client";

import * as React from "react";
import { getActiveOrg } from "@/lib/org-local";
import Autocomplete from "@/components/patients/Autocomplete";

type Template = { id: string; title: string; module: "mente"|"equilibrio"|"sonrisa"|"pulso"|"general" };

export default function AssignForm() {
  const org = getActiveOrg();
  const [patient, setPatient] = React.useState<{ id: string; name: string } | null>(null);
  const [templates, setTemplates] = React.useState<Template[]>([]);
  const [templateId, setTemplateId] = React.useState<string>("");
  const [title, setTitle] = React.useState("");
  const [dueAt, setDueAt] = React.useState<string>("");

  React.useEffect(() => {
    (async () => {
      if (!org.id) return;
      const url = new URL("/api/work/templates", window.location.origin);
      url.searchParams.set("org_id", org.id);
      const r = await fetch(url.toString(), { cache: "no-store" });
      const j = await r.json();
      if (j?.ok) setTemplates(j.data as Template[]);
    })();
  }, [org.id]);

  async function submit() {
    if (!org.id || !patient) return alert("Selecciona paciente");
    if (!templateId && !title.trim()) return alert("Elige una plantilla o escribe un título");

    const body: any = {
      org_id: org.id,
      items: [{
        patient_id: patient.id,
        template_id: templateId || undefined,
        title: templateId ? undefined : title.trim(),
        due_at: dueAt ? new Date(dueAt).toISOString() : undefined,
      }]
    };
    const r = await fetch("/api/work/assignments", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    const j = await r.json();
    if (!j?.ok) return alert(j?.error?.message || "Error al asignar");
    setTemplateId(""); setTitle(""); setDueAt("");
    alert("Asignado ✅");
  }

  return (
    <div className="rounded-2xl border bg-white/95 dark:bg-slate-900/60 p-4 space-y-4">
      <h3 className="font-semibold">Nueva asignación</h3>
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
          <input type="datetime-local" value={dueAt} onChange={e => setDueAt(e.target.value)} className="rounded-xl border px-3 py-2" />
        </label>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <label className="flex flex-col gap-1">
          <span className="text-sm text-slate-500">Plantilla (opcional)</span>
          <select className="rounded-xl border px-3 py-2 bg-white dark:bg-slate-900" value={templateId} onChange={e => setTemplateId(e.target.value)}>
            <option value="">— Seleccionar —</option>
            {templates.map(t => <option key={t.id} value={t.id}>{t.title} ({t.module})</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-sm text-slate-500">Título libre (si no usas plantilla)</span>
          <input className="rounded-xl border px-3 py-2" value={title} onChange={e => setTitle(e.target.value)} placeholder="p.ej., Caminar 20 min diarios" />
        </label>
      </div>

      <button onClick={submit} className="px-4 py-2 rounded-xl bg-blue-600 text-white">Asignar</button>
    </div>
  );
}
