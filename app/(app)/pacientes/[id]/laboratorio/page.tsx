"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getActiveOrg } from "@/lib/org-local";
import { Button } from "@/components/ui/button";

type Req = { id:string; title:string; status:string; created_at:string };
type Res = { id:string; file_name:string; created_at:string };

export default function PatientLabPage() {
  const org = getActiveOrg();
  const { id } = useParams<{id:string}>();
  const [reqs, setReqs] = useState<Req[]>([]);
  const [busy, setBusy] = useState(false);

  async function load() {
    if (!org.id) return;
    setBusy(true);
    try {
      const j = await fetch(`/api/lab/requests/list?org_id=${org.id}&patient_id=${id}`).then(r=>r.json());
      setReqs(j.items || []);
    } finally { setBusy(false); }
  }
  useEffect(()=>{ void load(); /* eslint-disable-next-line */ }, [org.id, id]);

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Laboratorio del paciente</h1>
        <Button variant="secondary" onClick={()=>void load()} disabled={busy}>Actualizar</Button>
      </div>

      <div className="border rounded-xl bg-white dark:bg-slate-900 divide-y">
        {reqs.length===0 && <div className="p-4 text-sm text-slate-600 dark:text-slate-300">Sin solicitudes.</div>}
        {reqs.map(r=>(
          <div key={r.id} className="p-3">
            <div className="font-medium">{r.title}</div>
            <div className="text-xs text-slate-600 dark:text-slate-400">Estado: {r.status} · {new Date(r.created_at).toLocaleString()}</div>
            {/* TODO: aquí podrías listar resultados con un endpoint /api/lab/results?request_id=... */}
          </div>
        ))}
      </div>
    </div>
  );
}
