"use client";
import { useState } from "react";

export default function SimpleNote({
  orgId,
  patientId,
  onSaved,
}: {
  orgId: string;
  patientId: string;
  onSaved?: () => void;
}) {
  const [text, setText] = useState("");
  const [sign, setSign] = useState(false);
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    const r = await fetch("/api/modules/mente/sessions/upsert", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ org_id: orgId, patient_id: patientId, note_json: { text }, sign }),
    });
    const j = await r.json();
    setSaving(false);
    if (!j.ok) alert(j.error?.message ?? "Error");
    else {
      setText("");
      setSign(false);
      onSaved?.();
    }
  }

  return (
    <div className="border rounded-2xl p-4 space-y-3">
      <h3 className="font-semibold">Nota de sesión</h3>
      <textarea
        className="border rounded px-3 py-2 w-full min-h-[120px]"
        placeholder="Escribe la nota de sesión…"
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <label className="inline-flex items-center gap-2 text-sm">
        <input type="checkbox" checked={sign} onChange={(e) => setSign(e.target.checked)} />
        Firmar la nota al guardar
      </label>
      <div>
        <button className="border rounded px-3 py-2" onClick={save} disabled={saving || !text.trim()}>
          Guardar
        </button>
      </div>
    </div>
  );
}
