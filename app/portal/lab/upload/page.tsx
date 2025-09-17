"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { showToast } from "@/components/Toaster";

export default function LabUploadPortal() {
  const sp = useSearchParams();
  const token = sp.get("token") || "";
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [ok, setOk] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function upload() {
    if (!file) { showToast({ title:"Selecciona un archivo" }); return; }
    setBusy(true); setErr(null);
    try {
      const arr = Array.from(new Uint8Array(await file.arrayBuffer()));
      const res = await fetch("/api/lab/upload", {
        method: "POST",
        headers: { "Content-Type":"application/json" },
        body: JSON.stringify({ token, file_name: file.name, content_type: file.type, bytes: arr })
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "No se pudo subir");
      setOk(true);
    } catch (e:any) { setErr(e.message); }
    finally { setBusy(false); }
  }

  useEffect(()=>{ if(!token){ setErr("Falta token"); } }, [token]);

  return (
    <div className="min-h-[60vh] grid place-content-center p-4">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-3 text-center">
        <h1 className="text-xl font-semibold">Subir estudio de laboratorio</h1>
        {ok ? (
          <div className="text-green-600 dark:text-green-400">¡Gracias! Tu archivo fue recibido.</div>
        ) : (
          <>
            <Input type="file" accept="application/pdf,image/*" onChange={(e)=>setFile(e.target.files?.[0]||null)} />
            <Button onClick={()=>void upload()} disabled={!token || busy}>Subir</Button>
            {err && <div className="text-sm text-rose-600">{err}</div>}
          </>
        )}
      </div>
    </div>
  );
}
