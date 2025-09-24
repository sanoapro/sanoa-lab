"use client";
import { useEffect, useState } from "react";

export default function NewReferral({ params }: { params: { id: string } }){
  const patientId = params.id;
  const [tpl, setTpl] = useState<any[]>([]);
  const [sel, setSel] = useState("");
  const [form, setForm] = useState<any>({ to_specialty:"", to_doctor_name:"", reason:"", summary:"", plan:"" });
  useEffect(()=>{ (async()=>{ const j = await fetch("/api/referrals/templates").then(r=>r.json()); setTpl(j.items||[]); })(); }, []);
  const loadTpl = ()=>{ const t = tpl.find((x:any)=> x.id===sel); if(t) setForm({ ...form, ...t.body }); };
  const save = async ()=>{
    if(!(form.to_specialty || form.to_doctor_name)) return alert("Falta: Especialidad o Dr. destino");
    if(!(form.reason || form.summary)) return alert("Falta: Motivo o Resumen");
    const r = await fetch("/api/referrals/create",{ method:"POST", headers:{ "content-type":"application/json" }, body: JSON.stringify({ patient_id: patientId, ...form }) });
    const j = await r.json(); if(!j.id) return alert("Error al crear");
    window.open(`/api/referrals/${j.id}/pdf`, "_blank");
  };
  return (
    <div className="p-4 max-w-3xl space-y-3">
      <h1 className="text-2xl font-semibold">Nueva interconsulta</h1>
      <div className="flex gap-2 items-end">
        <select className="border rounded p-2" value={sel} onChange={e=>setSel(e.target.value)}>
          <option value="">Plantilla…</option>
          {tpl.map((t:any)=>(<option key={t.id} value={t.id}>{t.doctor_id? "Mi: ":"Org: "}{t.name}</option>))}
        </select>
        <button className="px-3 py-2 border rounded" onClick={loadTpl}>Cargar</button>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <input className="border rounded p-2" placeholder="Especialidad destino" value={form.to_specialty} onChange={e=>setForm({...form,to_specialty:e.target.value})}/>
        <input className="border rounded p-2" placeholder="Dr(a) destinatario" value={form.to_doctor_name} onChange={e=>setForm({...form,to_doctor_name:e.target.value})}/>
        <textarea className="col-span-2 border rounded p-2" rows={2} placeholder="Motivo" value={form.reason} onChange={e=>setForm({...form,reason:e.target.value})}/>
        <textarea className="col-span-2 border rounded p-2" rows={3} placeholder="Resumen" value={form.summary} onChange={e=>setForm({...form,summary:e.target.value})}/>
        <textarea className="col-span-2 border rounded p-2" rows={2} placeholder="Plan sugerido" value={form.plan} onChange={e=>setForm({...form,plan:e.target.value})}/>
      </div>
      <div className="flex gap-2">
        <button className="px-3 py-2 bg-black text-white rounded" onClick={save}>Guardar + PDF</button>
      </div>
    </div>
  );
}
