"use client";

import { useState } from "react";
import { getActiveOrg } from "@/lib/org-local";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { showToast } from "@/components/Toaster";

type Result = { kind: "note"|"file"; id: string|null; patient_id: string; ref: string|null; snippet: string; score: number };

export default function SearchPage() {
  const org = getActiveOrg();
  const [q, setQ] = useState("");
  const [rows, setRows] = useState<Result[]>([]);
  const [mode, setMode] = useState<"semantic"|"keyword"|"">("");
  const [loading, setLoading] = useState(false);

  async function run() {
    if (!org.id) { showToast({ title:"Selecciona organización activa" }); return; }
    setLoading(true);
    try {
      const j = await fetch(`/api/search/query?q=${encodeURIComponent(q)}&org=${org.id}`).then(r=>r.json());
      setRows(j.results || []);
      setMode(j.mode || "");
    } catch (e:any) {
      showToast({ title:"Error", description:e.message, variant:"destructive" });
    } finally { setLoading(false); }
  }

  async function reindex(scope: "notes"|"files") {
    if (!org.id) return;
    setLoading(true);
    try {
      const j = await fetch(`/api/search/index`, { method:"POST", headers:{ "Content-Type":"application/json" }, body: JSON.stringify({ org_id: org.id, scope }) }).then(r=>r.json());
      if (!j.ok) throw new Error(j.error || "Falló el indexado");
      showToast({ title:"Indexado", description:`${scope}: ${j.indexed} registros (${j.model})` });
    } catch (e:any) {
      showToast({ title:"Error indexando", description:e.message, variant:"destructive" });
    } finally { setLoading(false); }
  }

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-4">
      <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">Buscador</h1>
      <div className="glass rounded-xl p-4 space-y-3">
        <div className="flex gap-2">
          <Input value={q} onChange={(e)=>setQ(e.target.value)} placeholder="Ej: ansiedad, informe laboratorio, etc." />
          <Button onClick={()=>void run()} disabled={loading}>Buscar</Button>
        </div>
        <div className="text-xs text-slate-600 dark:text-slate-300">
          <Button variant="secondary" onClick={()=>void reindex("notes")} disabled={loading}>Reindexar notas</Button>
          <Button variant="secondary" className="ml-2" onClick={()=>void reindex("files")} disabled={loading}>Reindexar archivos</Button>
          {mode && <span className="ml-3">Modo: <strong>{mode}</strong></span>}
        </div>
      </div>

      <div className="glass rounded-xl divide-y divide-black/5 dark:divide-white/10">
        {rows.length===0 && <div className="p-4 text-sm text-slate-600 dark:text-slate-300">Sin resultados.</div>}
        {rows.map((r, i)=>(
          <div key={i} className="p-3">
            <div className="text-xs text-slate-600 dark:text-slate-300">
              {r.kind === "note" ? "Nota" : "Archivo"} · Paciente {r.patient_id.slice(0,8)}… · score {r.score.toFixed(2)}
            </div>
            <div className="text-slate-900 dark:text-white whitespace-pre-wrap">{r.snippet}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
