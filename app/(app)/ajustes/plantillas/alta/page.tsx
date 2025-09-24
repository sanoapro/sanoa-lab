"use client";
import { useEffect, useState } from "react";

export default function DisTplPage() {
  const [items, setItems] = useState<any[]>([]);
  const [name, setName] = useState("");
  const [body, setBody] = useState<any>({ diagnosis: "", summary: "", recommendations: "" });
  const [doctorScope, setDoctorScope] = useState(true);
  const load = async () => {
    const j = await fetch("/api/discharges/templates").then((r) => r.json());
    setItems(j.items || []);
  };
  useEffect(() => {
    load();
  }, []);
  const save = async () => {
    const r = await fetch("/api/discharges/templates", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name, body, doctor_scope: doctorScope }),
    });
    if (!r.ok) return alert("Error");
    setName("");
    setBody({ diagnosis: "", summary: "", recommendations: "" });
    setDoctorScope(true);
    load();
  };
  return (
    <div className="p-4 max-w-4xl space-y-3">
      <h1 className="text-2xl font-semibold">Plantillas — Alta</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="border rounded p-3 space-y-2">
          <div className="font-medium">Nueva plantilla</div>
          <input
            className="w-full border rounded p-2"
            placeholder="Nombre"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <div className="grid grid-cols-1 gap-2 text-sm">
            <textarea
              className="border rounded p-2"
              rows={2}
              placeholder="Diagnóstico"
              value={body.diagnosis}
              onChange={(e) => setBody({ ...body, diagnosis: e.target.value })}
            />
            <textarea
              className="border rounded p-2"
              rows={3}
              placeholder="Resumen"
              value={body.summary}
              onChange={(e) => setBody({ ...body, summary: e.target.value })}
            />
            <textarea
              className="border rounded p-2"
              rows={2}
              placeholder="Recomendaciones"
              value={body.recommendations}
              onChange={(e) => setBody({ ...body, recommendations: e.target.value })}
            />
          </div>
          <label className="text-sm inline-flex items-center gap-2">
            <input
              type="checkbox"
              checked={doctorScope}
              onChange={(e) => setDoctorScope(e.target.checked)}
            />{" "}
            Sólo para mí
          </label>
          <div>
            <button className="px-3 py-2 border rounded" onClick={save}>
              Guardar
            </button>
          </div>
        </div>
        <div className="border rounded p-3">
          <div className="font-medium mb-2">Mis plantillas / de la organización</div>
          <ul className="text-sm space-y-1">
            {items.map((t: any) => (
              <li key={t.id} className="flex justify-between">
                <span>
                  {t.doctor_id ? "Mi: " : "Org: "}
                  {t.name}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
