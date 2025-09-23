"use client";

import { useEffect, useState } from "react";
import { getActiveOrg } from "@/lib/org-local";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { showToast } from "@/components/Toaster";
import { listPatients, type Patient } from "@/lib/patients";

type Req = { id:string; org_id:string; patient_id:string; title:string; status:string; due_at:string|null; created_at:string };

export default function LabPage() {
  const org = getActiveOrg();
  const [items, setItems] = useState<Req[]>([]);
  const [loading, setLoading] = useState(false);

  async function load() {
    if (!org.id) return;
    setLoading(true);
    try {
      const j = await fetch(`/api/lab/requests/list?org_id=${org.id}`).then(r=>r.json());
      setItems(j.items || []);
    } catch (e:any) { showToast({ title:"Error", description:e.message, variant:"destructive" }); }
    finally { setLoading(false); }
  }
  useEffect(()=>{ void load(); /* eslint-disable-next-line */ }, [org.id]);

  return (
    <div className="max-w-5xl mx-auto p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl md:text-3xl font-semibold">Laboratorio</h1>
        <Button onClick={()=>void load()} disabled={loading}>Actualizar</Button>
      </div>

      <NewRequestCard onCreated={()=>void load()} />

      <div className="border rounded-xl bg-white dark:bg-slate-900 divide-y">
        {items.length===0 && <div className="p-4 text-sm text-slate-600 dark:text-slate-300">Sin solicitudes.</div>}
        {items.map(r=>(
          <div key={r.id} className="p-3 flex items-center justify-between">
            <div>
              <div className="font-medium">{r.title}</div>
              <div className="text-xs text-slate-600 dark:text-slate-400">
                Paciente: {r.patient_id.slice(0,8)}… · Estado: {r.status} · {new Date(r.created_at).toLocaleString()}
              </div>
            </div>
            <div className="flex gap-2">
              <a className="inline-flex" href={`/pacientes/${r.patient_id}/laboratorio`}><Button variant="secondary">Ver del paciente</Button></a>
              <CancelButton id={r.id} onDone={()=>void load()} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function NewRequestCard({ onCreated }: { onCreated: ()=>void }) {
  const org = getActiveOrg();

  // Autocompletar paciente
  const [q, setQ] = useState("");
  const [suggest, setSuggest] = useState<Patient[]>([]);
  const [patientId, setPatientId] = useState("");
  const [email, setEmail] = useState("");

  const [title, setTitle] = useState("Biometría hemática");
  const [instructions, setInstructions] = useState("Acude en ayuno de 8 horas.");
  const [tests, setTests] = useState([{ name: "Glucosa en ayuno", code: "" }]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancel = false;
    async function run() {
      const term = q.trim();
      if (!term) { setSuggest([]); return; }
      const res = await listPatients({ q: term, page: 1, pageSize: 8, sortBy: "nombre", direction: "asc" });
      if (!cancel) setSuggest(res.items);
    }
    run();
    return () => { cancel = true; };
  }, [q]);

  function pick(p: Patient) {
    setPatientId(p.id);
    setEmail((p as any).email || "");
    const nombre = (p as any).nombre || p["full_name"] || "";
    setQ(nombre || (p as any).email || p.id);
    setSuggest([]);
  }

  async function createReq() {
    if (!org.id || !patientId || !title) { showToast({ title:"Faltan datos" }); return; }
    setBusy(true);
    try {
      const res = await fetch("/api/lab/requests/create", {
        method:"POST", headers:{ "Content-Type":"application/json" },
        body: JSON.stringify({ org_id: org.id, patient_id: patientId, email: email || null, title, instructions, items: tests })
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "No se pudo crear");
      showToast({ title:"Solicitud enviada", description:"Se envió el link por email si aplica." });
      setTests([{ name: "Glucosa en ayuno", code: "" }]);
      onCreated();
    } catch (e:any) { showToast({ title:"Error", description:e.message, variant:"destructive" }); }
    finally { setBusy(false); }
  }

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="text-sm text-slate-600 dark:text-slate-300 block mb-1">Paciente</label>
          <Input value={q} onChange={(e)=>{ setQ(e.target.value); setPatientId(""); }} placeholder="Escribe nombre o email…" />
          {suggest.length>0 && (
            <div className="mt-1 border rounded-md max-h-60 overflow-auto bg-white dark:bg-slate-900">
              {suggest.map(p => (
                <button key={p.id} onClick={()=>pick(p)} className="w-full text-left px-3 py-2 hover:bg-gray-50 dark:hover:bg-white/10 border-b">
                  <div className="font-medium">{(p as any).nombre || (p as any).full_name || "(sin nombre)"}</div>
                  <div className="text-xs text-slate-600 dark:text-slate-400">{(p as any).email || "—"}</div>
                </button>
              ))}
            </div>
          )}
        </div>
        <div>
          <label className="text-sm text-slate-600 dark:text-slate-300 block mb-1">Email del paciente</label>
          <Input value={email} onChange={(e)=>setEmail(e.target.value)} placeholder="persona@correo.com" />
        </div>
        <div className="sm:col-span-2">
          <label className="text-sm block mb-1">Título</label>
          <Input value={title} onChange={(e)=>setTitle(e.target.value)} />
        </div>
        <div className="sm:col-span-2">
          <label className="text-sm block mb-1">Instrucciones</label>
          <textarea className="w-full border rounded-md p-2" value={instructions} onChange={(e)=>setInstructions(e.target.value)} />
        </div>
      </div>

      <div className="space-y-2">
        <div className="text-sm font-medium">Pruebas</div>
        {tests.map((t, i)=>(
          <div key={i} className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <Input placeholder="Nombre de prueba" value={t.name} onChange={(e)=>setTests(ts => ts.map((x,ix)=>ix===i?{...x, name:e.target.value}:x))} />
            <Input placeholder="Código (opcional)" value={t.code} onChange={(e)=>setTests(ts => ts.map((x,ix)=>ix===i?{...x, code:e.target.value}:x))} />
            <div className="flex gap-2">
              <Button variant="secondary" onClick={()=>setTests(ts => [...ts, { name:"", code:"" }])}>Añadir</Button>
              {tests.length>1 && <Button variant="destructive" onClick={()=>setTests(ts => ts.filter((_,ix)=>ix!==i))}>Quitar</Button>}
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-end">
        <Button onClick={()=>void createReq()} disabled={busy || !patientId}>Crear solicitud</Button>
      </div>
    </div>
  );
}

function CancelButton({ id, onDone }:{ id:string; onDone:()=>void }) {
  async function cancel() {
    const r = await fetch("/api/lab/requests/cancel", { method:"POST", headers:{ "Content-Type":"application/json" }, body: JSON.stringify({ request_id: id }) });
    const j = await r.json();
    if (!r.ok) { showToast({ title:"Error", description:j.error, variant:"destructive" }); return; }
    onDone();
  }
  return <Button variant="destructive" onClick={()=>void cancel()}>Cancelar</Button>;
}
