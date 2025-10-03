"use client";
import { useEffect, useState } from "react";

export default function TaskTemplateEditor({
  orgId,
  moduleName,
}: {
  orgId: string;
  moduleName: string;
}) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState<any>({});
  const [list, setList] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  async function load() {
    const p = new URLSearchParams({ org_id: orgId, module: moduleName });
    const r = await fetch(`/api/tasks/templates?${p.toString()}`);
    const j = await r.json();
    setList(j?.ok ? j.data : []);
  }
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orgId, moduleName]);

  async function save() {
    setLoading(true);
    const r = await fetch("/api/tasks/templates", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ org_id: orgId, module: moduleName, title, content }),
    });
    const j = await r.json();
    setLoading(false);
    if (!j.ok) alert(j.error?.message ?? "Error");
    else {
      setTitle("");
      setContent({});
      load();
    }
  }

  async function remove(id: string) {
    const r = await fetch("/api/tasks/templates", {
      method: "DELETE",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id, org_id: orgId }),
    });
    const j = await r.json();
    if (!j.ok) alert(j.error?.message ?? "Error");
    else load();
  }

  return (
    <section className="border rounded-2xl p-4 space-y-4">
      <h3 className="font-semibold">Plantillas de tareas</h3>
      <div className="grid md:grid-cols-3 gap-3">
        <div className="md:col-span-2">
          <label className="block text-sm">Título</label>
          <input
            className="border rounded px-3 py-2 w-full"
            value={title}
            onChange={(e: any) => setTitle(e.target.value)}
            placeholder="Ej. Ejercicios respiratorios (7 días)"
          />
        </div>
        <div className="md:col-span-1">
          <label className="block text-sm">Contenido (JSON)</label>
          <textarea
            className="border rounded px-3 py-2 w-full h-24"
            value={JSON.stringify(content)}
            onChange={(e: any) => {
              try {
                setContent(JSON.parse(e.target.value || "{}"));
              } catch {
                /* ignore */
              }
            }}
          />
        </div>
      </div>
      <div className="flex gap-2">
        <button className="border rounded px-3 py-2" onClick={save} disabled={loading}>
          Guardar plantilla
        </button>
      </div>

      <div className="rounded border overflow-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-3 py-2">Título</th>
              <th className="text-left px-3 py-2">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {list.map((x: any) => (
              <tr key={x.id} className="border-t">
                <td className="px-3 py-2">{x.title}</td>
                <td className="px-3 py-2">
                  <button className="border rounded px-3 py-1" onClick={() => remove(x.id)}>
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
            {!list.length && (
              <tr>
                <td className="px-3 py-6 text-center" colSpan={2}>
                  Sin plantillas
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
