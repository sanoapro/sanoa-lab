"use client";
import { useEffect, useState } from "react";

type RxItem = { drug: string; dose?: string; route?: string; frequency?: string; duration?: string; instructions?: string; };

export default function RxEditor({ params }: { params: { id: string } }) {
  const patientId = params.id;
  const [q, setQ] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [items, setItems] = useState<RxItem[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [tplSel, setTplSel] = useState<string>("");
  const [diagnosis, setDiagnosis] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => { (async () => {
    const t = await fetch("/api/prescriptions/templates").then(r => r.json());
    setTemplates(t.items || []);
  })(); }, []);

  const search = async () => {
    if (!q.trim()) return setResults([]);
    const r = await fetch(`/api/catalog/drugs/search?q=${encodeURIComponent(q)}`);
    const j = await r.json(); setResults(j.items || []);
  };

  const addDrug = (name: string) => {
    setItems(s => [...s, { drug: name, dose: "", route: "VO", frequency: "", duration: "", instructions: "" }]);
    setQ(""); setResults([]);
  };

  const applyTemplate = async () => {
    if (!tplSel) return;
    const tpl = templates.find((t: any) => t.id === tplSel);
    if (!tpl) return;
    const extra: RxItem[] = (tpl.items || []).map((it: any) => ({
      drug: it.drug_name, dose: it.dose || "", route: it.route || "", frequency: it.frequency || "", duration: it.duration || "", instructions: it.instructions || ""
    }));
    setItems(s => [...s, ...extra]);
  };

  const checkInteractions = async () => {
    const r = await fetch("/api/prescriptions/check-interactions", {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ patient_id: patientId, items })
    });
    const j = await r.json();
    alert(`Interacciones — Droga-Droga: ${j.warnings?.drug_drug?.length || 0} • Droga-Condición: ${j.warnings?.drug_condition?.length || 0}`);
  };

  const saveAndPdf = async () => {
    if (!items.length) return alert("Agrega al menos un medicamento.");
    const r = await fetch("/api/prescriptions/create", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ patient_id: patientId, diagnosis, notes, items })
    });
    const j = await r.json();
    if (!j.id) return alert("No se pudo crear la receta");
    window.open(`/api/prescriptions/${j.id}/pdf`, "_blank");
  };

  return (
    <div className="p-4 max-w-3xl space-y-3">
      <h1 className="text-2xl font-semibold">Nueva receta</h1>

      <div className="flex gap-2 items-end">
        <div className="flex-1">
          <label className="text-sm">Buscar fármaco</label>
          <input value={q} onChange={e => setQ(e.target.value)} onKeyDown={e => e.key === "Enter" && search()}
                 className="w-full border rounded p-2" placeholder="Paracetamol, Ibuprofeno…" />
        </div>
        <button className="px-3 py-2 border rounded" onClick={search}>Buscar</button>
      </div>

      {results.length > 0 && (
        <div className="border rounded p-2 max-h-48 overflow-auto text-sm">
          {results.map((r: any) => (
            <div key={r.id} className="flex justify-between items-center py-1">
              <div>
                <b>{r.name}</b> <span className="text-xs text-gray-500">{r.kind}</span>
              </div>
              <button className="text-xs underline" onClick={() => addDrug(r.name)}>Añadir</button>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-2 items-end">
        <select className="border rounded p-2" value={tplSel} onChange={e => setTplSel(e.target.value)}>
          <option value="">Plantilla…</option>
          {templates.map((t: any) => (<option key={t.id} value={t.id}>{t.doctor_id ? "Mi: " : "Org: "}{t.name}</option>))}
        </select>
        <button className="px-3 py-2 border rounded" onClick={applyTemplate}>Cargar plantilla</button>
      </div>

      <div className="border rounded p-3">
        <div className="font-medium mb-2">Prescripción</div>
        <div className="space-y-2">
          {items.map((it, i) => (
            <div key={i} className="grid grid-cols-6 gap-2 text-sm items-center">
              <div className="col-span-2">
                <input className="w-full border rounded p-2" value={it.drug}
                       onChange={e => setItems(s => s.map((x, idx) => idx === i ? { ...x, drug: e.target.value } : x))} />
              </div>
              <input className="border rounded p-2" placeholder="Dosis" value={it.dose}
                     onChange={e => setItems(s => s.map((x, idx) => idx === i ? { ...x, dose: e.target.value } : x))} />
              <input className="border rounded p-2" placeholder="Vía" value={it.route}
                     onChange={e => setItems(s => s.map((x, idx) => idx === i ? { ...x, route: e.target.value } : x))} />
              <input className="border rounded p-2" placeholder="Frecuencia" value={it.frequency}
                     onChange={e => setItems(s => s.map((x, idx) => idx === i ? { ...x, frequency: e.target.value } : x))} />
              <input className="border rounded p-2" placeholder="Duración" value={it.duration}
                     onChange={e => setItems(s => s.map((x, idx) => idx === i ? { ...x, duration: e.target.value } : x))} />
              <div className="col-span-6">
                <input className="w-full border rounded p-2" placeholder="Instrucciones" value={it.instructions || ""}
                       onChange={e => setItems(s => s.map((x, idx) => idx === i ? { ...x, instructions: e.target.value } : x))} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <label className="block text-sm">Diagnóstico
        <textarea className="w-full border rounded p-2" rows={2} value={diagnosis} onChange={e => setDiagnosis(e.target.value)} />
      </label>
      <label className="block text-sm">Notas
        <textarea className="w-full border rounded p-2" rows={2} value={notes} onChange={e => setNotes(e.target.value)} />
      </label>

      <div className="flex gap-2">
        <button className="px-3 py-2 border rounded" onClick={checkInteractions}>Checar interacciones</button>
        <button className="px-3 py-2 bg-black text-white rounded" onClick={saveAndPdf}>Guardar + PDF</button>
      </div>
    </div>
  );
}
