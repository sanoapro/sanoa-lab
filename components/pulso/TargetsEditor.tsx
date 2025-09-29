// components/pulso/TargetsEditor.tsx
"use client";
import { useEffect, useState } from "react";

const TYPES: { key: string; label: string; unit: string }[] = [
  { key: "bp_sys", label: "TA Sistólica", unit:"mmHg" },
  { key: "bp_dia", label: "TA Diastólica", unit:"mmHg" },
  { key: "hr",     label: "Frecuencia cardiaca", unit:"lpm" },
  { key: "glucose",label: "Glucosa", unit:"mg/dL" },
  { key: "hba1c",  label: "HbA1c", unit:"%" },
  { key: "ldl",    label: "LDL", unit:"mg/dL" },
  { key: "hdl",    label: "HDL", unit:"mg/dL" },
  { key: "tg",     label: "Triglicéridos", unit:"mg/dL" },
  { key: "bmi",    label: "IMC", unit:"kg/m²" },
  { key: "weight", label: "Peso", unit:"kg" },
];

export default function TargetsEditor({
  orgId, patientId
}: { orgId: string; patientId: string }) {
  const [vals, setVals] = useState<Record<string, { low?: string; high?: string }>>({});
  const [saving, setSaving] = useState(false);

  async function load() {
    const r = await fetch(`/api/modules/pulso/targets/get?org_id=${orgId}&patient_id=${patientId}`, { cache:"no-store" });
    const j = await r.json();
    if (j?.ok) {
      const m: Record<string, { low?: string; high?: string }> = {};
      (j.data as any[]).forEach(t => m[t.type] = {
        low: t.target_low == null ? "" : String(t.target_low),
        high: t.target_high == null ? "" : String(t.target_high),
      });
      setVals(m);
    }
  }

  useEffect(()=>{ if(orgId&&patientId) load(); }, [orgId, patientId]);

  async function save() {
    setSaving(true);
    const items = TYPES.map(t => ({
      type: t.key,
      low: vals[t.key]?.low ? Number(vals[t.key]?.low) : null,
      high: vals[t.key]?.high ? Number(vals[t.key]?.high) : null,
    }));
    const r = await fetch("/api/modules/pulso/targets/set", {
      method:"POST", headers: { "content-type":"application/json" },
      body: JSON.stringify({ org_id: orgId, patient_id: patientId, items })
    });
    const j = await r.json();
    setSaving(false);
    if (!j.ok) alert(j.error?.message ?? "Error");
    else alert("Objetivos guardados");
  }

  return (
    <section className="border rounded-2xl p-4 space-y-3">
      <h3 className="font-semibold">Objetivos por paciente</h3>
      <div className="rounded border overflow-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr><th className="text-left px-3 py-2">Tipo</th><th className="text-left px-3 py-2">Mín</th><th className="text-left px-3 py-2">Máx</th><th className="text-left px-3 py-2">Unidad</th></tr>
          </thead>
          <tbody>
            {TYPES.map(t=>(
              <tr key={t.key} className="border-t">
                <td className="px-3 py-2">{t.label}</td>
                <td className="px-3 py-2"><input className="border rounded px-2 py-1 w-28" value={vals[t.key]?.low ?? ""} onChange={e=> setVals(v=>({ ...v, [t.key]: { ...(v[t.key]||{}), low: e.target.value } }))} /></td>
                <td className="px-3 py-2"><input className="border rounded px-2 py-1 w-28" value={vals[t.key]?.high ?? ""} onChange={e=> setVals(v=>({ ...v, [t.key]: { ...(v[t.key]||{}), high: e.target.value } }))} /></td>
                <td className="px-3 py-2 text-slate-500">{t.unit}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <button className="border rounded px-3 py-2" onClick={save} disabled={saving}>Guardar objetivos</button>
    </section>
  );
}
