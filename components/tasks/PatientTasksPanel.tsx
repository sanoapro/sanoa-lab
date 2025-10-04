"use client";
import { useEffect, useState } from "react";

type Task = {
  id: string;
  title: string;
  status: "assigned" | "in_progress" | "done";
  due_date: string | null;
  created_at: string;
};

type Template = {
  id: string;
  title: string;
};

export default function PatientTasksPanel({
  orgId,
  moduleName,
  patientId,
}: {
  orgId: string;
  moduleName: string;
  patientId: string;
}) {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [customTitle, setCustomTitle] = useState("");
  const [customContent, setCustomContent] = useState<any>({});
  const [customContentInput, setCustomContentInput] = useState("");
  const [due, setDue] = useState<string>("");

  async function load() {
    const p = new URLSearchParams({ org_id: orgId, module: moduleName });
    const r1 = await fetch(`/api/tasks/templates?${p.toString()}`);
    const j1 = await r1.json();
    setTemplates(j1?.ok ? j1.data : []);
    const p2 = new URLSearchParams({ org_id: orgId, module: moduleName, patient_id: patientId });
    const r2 = await fetch(`/api/tasks/list?${p2.toString()}`);
    const j2 = await r2.json();
    setTasks(j2?.ok ? j2.data : []);
  }

  useEffect(() => {
    load();
     
  }, [orgId, moduleName, patientId]);

  async function assignTemplate(template_id: string) {
    const r = await fetch("/api/tasks/assign", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        org_id: orgId,
        module: moduleName,
        patient_id: patientId,
        template_id,
        due_date: due || null,
      }),
    });
    const j = await r.json();
    if (!j.ok) alert(j.error?.message ?? "Error");
    else load();
  }

  async function assignCustom() {
    const r = await fetch("/api/tasks/assign", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        org_id: orgId,
        module: moduleName,
        patient_id: patientId,
        title: customTitle,
        content: customContent,
        due_date: due || null,
      }),
    });
    const j = await r.json();
    if (!j.ok) alert(j.error?.message ?? "Error");
    else {
      setCustomTitle("");
      setCustomContent({});
      setCustomContentInput("");
      load();
    }
  }

  async function setStatus(id: string, status: "done" | "in_progress" | "assigned") {
    const r = await fetch("/api/tasks/complete", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ org_id: orgId, id, status }),
    });
    const j = await r.json();
    if (!j.ok) alert(j.error?.message ?? "Error");
    else load();
  }

  return (
    <section className="border rounded-2xl p-4 space-y-4">
      <h3 className="font-semibold">Tareas del paciente</h3>

      <div className="grid md:grid-cols-4 gap-3">
        <div className="md:col-span-2">
          <label className="block text-sm">Asignar desde plantilla</label>
          <div className="flex gap-2">
            <select
              id="tpl"
              className="border rounded px-3 py-2 w-full"
              value={selectedTemplate}
              onChange={(e: any) => setSelectedTemplate(e.target.value)}
            >
              <option value="">Selecciona…</option>
              {templates.map((t: any) => (
                <option key={t.id} value={t.id}>
                  {t.title}
                </option>
              ))}
            </select>
            <input
              type="date"
              className="border rounded px-3 py-2"
              value={due}
              onChange={(e: any) => setDue(e.target.value)}
            />
            <button
              className="border rounded px-3 py-2"
              onClick={() => {
                if (selectedTemplate) assignTemplate(selectedTemplate);
              }}
            >
              Asignar
            </button>
          </div>
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm">Asignar personalizada</label>
          <div className="grid md:grid-cols-2 gap-2">
            <input
              className="border rounded px-3 py-2"
              placeholder="Título"
              value={customTitle}
              onChange={(e: any) => setCustomTitle(e.target.value)}
            />
            <input
              className="border rounded px-3 py-2"
              placeholder="Contenido (JSON)"
              value={customContentInput}
              onChange={(e: any) => {
                const value = e.target.value;
                setCustomContentInput(value);
                try {
                  setCustomContent(JSON.parse(value || "{}"));
                } catch {
                  /* ignore */
                }
              }}
            />
          </div>
          <div className="mt-2 flex gap-2">
            <input
              type="date"
              className="border rounded px-3 py-2"
              value={due}
              onChange={(e: any) => setDue(e.target.value)}
            />
            <button className="border rounded px-3 py-2" onClick={assignCustom}>
              Asignar
            </button>
          </div>
        </div>
      </div>

      <div className="rounded border overflow-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-3 py-2">Título</th>
              <th className="text-left px-3 py-2">Estado</th>
              <th className="text-left px-3 py-2">Vence</th>
              <th className="text-left px-3 py-2">Creada</th>
              <th className="text-left px-3 py-2">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {tasks.map((t: any) => (
              <tr key={t.id} className="border-t">
                <td className="px-3 py-2">{t.title}</td>
                <td className="px-3 py-2">{t.status}</td>
                <td className="px-3 py-2">{t.due_date || "—"}</td>
                <td className="px-3 py-2">{new Date(t.created_at).toLocaleString()}</td>
                <td className="px-3 py-2">
                  <div className="flex gap-2">
                    <button
                      className="border rounded px-2 py-1"
                      onClick={() => setStatus(t.id, "in_progress")}
                    >
                      En curso
                    </button>
                    <button
                      className="border rounded px-2 py-1"
                      onClick={() => setStatus(t.id, "done")}
                    >
                      Hecha
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {!tasks.length && (
              <tr>
                <td className="px-3 py-6 text-center" colSpan={5}>
                  Sin tareas
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
