"use client";
import { useEffect, useState } from "react";

export default function RefTplPage() {
  const [items, setItems] = useState<any[]>([]);
  const [name, setName] = useState("");
  const [body, setBody] = useState<any>({
    to_specialty: "",
    to_doctor_name: "",
    reason: "",
    summary: "",
    plan: "",
  });
  const [doctorScope, setDoctorScope] = useState(true);
  const load = async () => {
    const j = await fetch("/api/referrals/templates").then((r: any) => r.json());
    setItems(j.items || []);
  };
  useEffect(() => {
    load();
  }, []);
  const save = async () => {
    const r = await fetch("/api/referrals/templates", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name, body, doctor_scope: doctorScope }),
    });
    if (!r.ok) return alert("Error");
    setName("");
    setBody({ to_specialty: "", to_doctor_name: "", reason: "", summary: "", plan: "" });
    setDoctorScope(true);
    load();
  };
  return (
    <div className="p-4 max-w-4xl space-y-3">
      <h1 className="text-2xl font-semibold">Plantillas — Interconsulta</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="border rounded p-3 space-y-2">
          <div className="font-medium">Nueva plantilla</div>
          <input
            className="w-full border rounded p-2"
            placeholder="Nombre"
            value={name}
            onChange={(e: any) => setName(e.target.value)}
          />
          <div className="grid grid-cols-2 gap-2 text-sm">
            <input
              className="border rounded p-2"
              placeholder="Especialidad destino"
              value={body.to_specialty}
              onChange={(e: any) => setBody({ ...body, to_specialty: e.target.value })}
            />
            <input
              className="border rounded p-2"
              placeholder="Dr(a) destinatario"
              value={body.to_doctor_name}
              onChange={(e: any) => setBody({ ...body, to_doctor_name: e.target.value })}
            />
            <textarea
              className="col-span-2 border rounded p-2"
              rows={2}
              placeholder="Motivo"
              value={body.reason}
              onChange={(e: any) => setBody({ ...body, reason: e.target.value })}
            />
            <textarea
              className="col-span-2 border rounded p-2"
              rows={3}
              placeholder="Resumen"
              value={body.summary}
              onChange={(e: any) => setBody({ ...body, summary: e.target.value })}
            />
            <textarea
              className="col-span-2 border rounded p-2"
              rows={2}
              placeholder="Plan sugerido"
              value={body.plan}
              onChange={(e: any) => setBody({ ...body, plan: e.target.value })}
            />
          </div>
          <label className="text-sm inline-flex items-center gap-2">
            <input
              type="checkbox"
              checked={doctorScope}
              onChange={(e: any) => setDoctorScope(e.target.checked)}
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
