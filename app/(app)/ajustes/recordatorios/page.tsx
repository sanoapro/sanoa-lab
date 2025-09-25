'use client';

import { useEffect, useState } from 'react';
import AccentHeader from '@/components/ui/AccentHeader';

type Template = { id?:string; org_id:string; name:string; channel:'sms'|'whatsapp'; body:string; active:boolean };

export default function RecordatoriosSettings(){
  const [orgId] = useState<string>(() => (typeof window!=='undefined' ? localStorage.getItem('org_id') || '' : ''));
  const [list, setList] = useState<Template[]>([]);
  const [form, setForm] = useState<Template>({ org_id:'', name:'Recordatorio estándar', channel:'whatsapp', body:'{org_name}: Te esperamos el {date} a las {time}', active:true });

  useEffect(()=>{
    (async()=>{
      if (!orgId) return;
      const r = await fetch(`/api/ajustes/recordatorios/templates?org_id=${orgId}`);
      const j = await r.json();
      setList(j?.data || []);
    })();
  }, [orgId]);

  async function save(){
    const payload = { ...form, org_id: orgId };
    const r = await fetch('/api/reminders/templates/upsert', {
      method:'POST', headers:{'content-type':'application/json'}, body: JSON.stringify(payload)
    });
    const j = await r.json();
    if (!r.ok) return alert(j.error||'Error');
    alert('Plantilla guardada');
    setForm({ ...form, id: j.data.id });
    // refresh
    const rr = await fetch(`/api/ajustes/recordatorios/templates?org_id=${orgId}`);
    setList((await rr.json())?.data || []);
  }

  async function sendTest(){
    const to = prompt('Número WhatsApp (e.g. +52XXXXXXXXXX):');
    if (!to) return;
    const payload = {
      org_id: orgId,
      channel: form.channel,
      address: form.channel === 'whatsapp' ? `whatsapp:${to}` : to,
      payload: { org_name:'Sanoa', patient_name:'Paciente Demo', date:'hoy', time:'10:00' }
    };
    const rr = await fetch('/api/reminders/schedule', {
      method:'POST', headers:{'content-type':'application/json'}, body: JSON.stringify(payload)
    });
    const j = await rr.json();
    if (!rr.ok) return alert(j.error || 'Error al programar');
    // Corre el runner inmediato
    await fetch('/api/jobs/reminders/run');
    alert('Recordatorio de prueba programado/enviado (revisa WhatsApp/SMS).');
  }

  return (
    <div className="p-6 space-y-6 max-w-3xl">
      <AccentHeader emoji="⏰">Recordatorios</AccentHeader>

      <section className="space-y-3">
        <div className="font-medium">Plantillas</div>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="block text-sm">
              Nombre
              <input className="border p-2 rounded w-full" value={form.name} onChange={e=>setForm({...form, name:e.target.value})} />
            </label>
            <label className="block text-sm">
              Canal
              <select className="border p-2 rounded w-full" value={form.channel} onChange={e=>setForm({...form, channel: e.target.value as any})}>
                <option value="whatsapp">WhatsApp</option>
                <option value="sms">SMS</option>
              </select>
            </label>
            <label className="block text-sm">
              Cuerpo (placeholders: {'{org_name}, {patient_name}, {date}, {time}'})
              <textarea className="border p-2 rounded w-full" rows={6} value={form.body} onChange={e=>setForm({...form, body:e.target.value})}/>
            </label>
            <div className="flex gap-2">
              <button onClick={save} className="px-3 py-2 rounded bg-black text-white">Guardar</button>
              <button onClick={sendTest} className="px-3 py-2 rounded border">Enviar prueba</button>
            </div>
          </div>

          <div>
            <div className="text-sm opacity-80 mb-2">Plantillas guardadas</div>
            <ul className="space-y-2">
              {list.map(t=>(
                <li key={t.id} className="border rounded p-2">
                  <div className="font-medium">{t.name}</div>
                  <div className="text-xs opacity-70">Canal: {t.channel} · Activa: {t.active ? 'sí' : 'no'}</div>
                  <pre className="text-xs bg-black/5 p-2 rounded mt-1">{t.body}</pre>
                  <button className="text-xs underline mt-1" onClick={()=>setForm(t)}>Editar</button>
                </li>
              ))}
              {list.length === 0 && <li className="text-sm opacity-70">Aún no hay plantillas.</li>}
            </ul>
          </div>
        </div>
      </section>

      <section className="space-y-2">
        <div className="font-medium">Automatización</div>
        <p className="text-sm opacity-80">
          Programa un CRON cada 5 minutos a <code>/api/jobs/reminders/run</code>.  
          Programa el resumen diario (ej. 20:00) a <code>/api/reports/daily-summary/send</code> con <code>{"{ org_id, to }"}</code>.
        </p>
      </section>
    </div>
  );
}
