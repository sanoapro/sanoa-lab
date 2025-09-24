"use client";
import { useEffect, useState } from "react";

export default function NewDischarge({ params }: { params: { id: string } }){
  const patientId = params.id;
  const [tpl, setTpl] = useState<any[]>([]);
  const [sel, setSel] = useState("");
  const [form, setForm] = useState<any>({ diagnosis:"", summary:"", recommendations:"", admission_at:"", discharge_at:"", follow_up_at:"" });
  useEffect(()=>{ (async()=>{ const j = await fetch("/api/discharges/templates").then(r=>r.json()); setTpl(j.items||[]); })(); }, []);
  const loadTpl = ()=>{ const t = tpl.find((x:any)=> x.id===sel); if(t) setForm({ ...form, ...t.body }); };
  const save = async ()=>{
    if(!form.diagnosis || !form.summary) return alert("Faltan: diagnóstico y resumen");
    const r = await fetch("/api/discharges/create",{ method:"POST", headers:{ "content-type":"application/json" }, body: JSON.stringify({ patient_id: patientId, ...form }) });
    const j = await r.json(); if(!j.id) return alert("Error al crear");
    window.open(`/api/discharges/${j.id}/pdf`, "_blank");
  };
  return (
    <div className="p-4 max-w-3xl space-y-3">
      <h1 className="text-2xl font-semibold">Nuevo resumen de alta</h1>
      <div className="flex gap-2 items-end">
        <select className="border rounded p-2" value={sel} onChange={e=>setSel(e.target.value)}>
          <option value="">Plantilla…</option>
          {tpl.map((t:any)=>(<option key={t.id} value={t.id}>{t.doctor_id? "Mi: ":"Org: "}{t.name}</option>))}
        </select>
        <button className="px-3 py-2 border rounded" onClick={loadTpl}>Cargar</button>
      </div>
      <div className="grid grid-cols-2 gap-2 text-sm">
        <input type="datetime-local" className="border rounded p-2" value={form.admission_at} onChange={e=>setForm({...form,admission_at:e.target.value})} />
        <input type="datetime-local" className="border rounded p-2" value={form.discharge_at} onChange={e=>setForm({...form,discharge_at:e.target.value})} />
        <textarea className="col-span-2 border rounded p-2" rows={2} placeholder="Diagnóstico" value={form.diagnosis} onChange={e=>setForm({...form,diagnosis:e.target.value})}/>
        <textarea className="col-span-2 border rounded p-2" rows={3} placeholder="Resumen" value={form.summary} onChange={e=>setForm({...form,summary:e.target.value})}/>
        <textarea className="col-span-2 border rounded p-2" rows={2} placeholder="Recomendaciones" value={form.recommendations} onChange={e=>setForm({...form,recommendations:e.target.value})}/>
        <input type="datetime-local" className="border rounded p-2" value={form.follow_up_at} onChange={e=>setForm({...form,follow_up_at:e.target.value})} />
      </div>
      <div className="flex gap-2">
        <button className="px-3 py-2 bg-black text-white rounded" onClick={save}>Guardar + PDF</button>
      </div>
    </div>
  );
}
