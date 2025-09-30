// components/agreements/SendDialog.tsx
"use client";

import * as React from "react";
import { getActiveOrg } from "@/lib/org-local";
import Autocomplete from "@/components/patients/Autocomplete";

type Tpl = { id: string; title: string; type: "specialist_patient"|"specialist_platform"|"patient_platform" };

export default function SendDialog() {
  const org = getActiveOrg();
  const [tpls, setTpls] = React.useState<Tpl[]>([]);
  const [tplId, setTplId] = React.useState("");
  const [patient, setPatient] = React.useState<{ id: string; name: string } | null>(null);
  const [expires, setExpires] = React.useState(168); // horas

  React.useEffect(() => {
    (async () => {
      if (!org.id) return;
      const url = new URL("/api/agreements/templates", window.location.origin);
      url.searchParams.set("org_id", org.id);
      url.searchParams.set("limit", "200");
      const r = await fetch(url, { cache: "no-store" } as any);
      const j = await r.json();
      if (j?.ok) setTpls(j.data as Tpl[]);
    })();
  }, [org.id]);

  async function createLink() {
    if (!org.id || !tplId) return alert("Elige una plantilla");
    const tpl = tpls.find(t => t.id === tplId);
    if (!tpl) return alert("Plantilla inválida");
    if (tpl.type === "specialist_patient" && !patient) return alert("Selecciona paciente");

    const r = await fetch("/api/agreements/share/create", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        org_id: org.id,
        template_id: tplId,
        patient_id: tpl.type === "specialist_patient" ? patient?.id : undefined,
        expires_in_hours: expires,
      }),
    });
    const j = await r.json();
    if (!j?.ok) return alert(j?.error?.message || "Error al crear enlace");
    await navigator.clipboard.writeText(j.data.url);
    alert("Enlace copiado ✅\n" + j.data.url);
  }

  return (
    <div className="rounded-2xl border bg-white/95 dark:bg-slate-900/60 p-4 space-y-4">
      <h3 className="font-semibold">Enviar acuerdo</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <label className="flex flex-col gap-1">
          <span className="text-sm text-slate-500">Plantilla</span>
          <select value={tplId} onChange={e => setTplId(e.target.value)} className="rounded-xl border px-3 py-2 bg-white dark:bg-slate-900">
            <option value="">— Seleccionar —</option>
            {tpls.map(t => <option key={t.id} value={t.id}>{t.title} ({t.type})</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-sm text-slate-500">Expira en (horas)</span>
          <input type="number" className="rounded-xl border px-3 py-2" value={expires} onChange={e => setExpires(parseInt(e.target.value || "168"))} min={1} max={720} />
        </label>
        <div className="md:col-span-1">
          <span className="text-sm text-slate-500">Paciente (si aplica)</span>
          <Autocomplete placeholder="Buscar paciente…" onSelect={(s) => setPatient({ id: s.patient_id, name: s.display_name })} />
          {patient && <p className="text-xs text-slate-500 mt-1">Paciente: {patient.name}</p>}
        </div>
      </div>
      <button onClick={createLink} className="px-4 py-2 rounded-xl bg-blue-600 text-white">Generar enlace</button>
    </div>
  );
}
