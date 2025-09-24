"use client";
import { useEffect, useMemo, useState } from "react";

const TYPE_LABEL: Record<string,string> = {
  prescription: "Receta",
  referral: "Interconsulta",
  discharge: "Alta",
  lab_request: "Solicitud de lab",
};

const pdfHref = (t:string,id:string)=> (
  t==="prescription" ? `/api/prescriptions/${id}/pdf` :
  t==="referral"     ? `/api/referrals/${id}/pdf` :
  t==="discharge"    ? `/api/discharges/${id}/pdf` :
  t==="lab_request"  ? `/api/labs/requests/${id}/pdf` : "#"
);

const printHref = (t:string,id:string)=> (
  t==="prescription" ? `/print/prescriptions/${id}` :
  t==="referral"     ? `/print/referrals/${id}` :
  t==="discharge"    ? `/print/discharges/${id}` :
  "" // lab_request: opcional si implementas
);

export default function PatientDocs({ params }: { params: { id: string } }){
  const patientId = params.id;
  const [items, setItems] = useState<any[]>([]);
  const [filter, setFilter] = useState<string[]>([]);
  const [query, setQuery] = useState("");

  const load = async ()=> {
    const j = await fetch(`/api/patients/${patientId}/docs/list`).then(r=>r.json());
    setItems(j.items||[]);
  };
  useEffect(()=>{ load(); }, [patientId]);

  const filtered = useMemo(()=> (items||[]).filter(it =>
    (filter.length? filter.includes(it.type) : true) &&
    (query
      ? (TYPE_LABEL[it.type]||"").toLowerCase().includes(query.toLowerCase())
        || String(it.folio||"").includes(query)
      : true)
  ), [items, filter, query]);

  const ensureFolio = async (t:string, id:string) => {
    const r = await fetch("/api/docs/ensure-folio", { method:"POST", headers:{ "content-type":"application/json" }, body: JSON.stringify({ type: t, id }) });
    const j = await r.json();
    if(!r.ok) return alert(j.error || "Error");
    load();
  };

  const verifyUrl = (it:any) => it.verify_code
    ? `${window.location.origin}/api/docs/verify?type=${it.type}&id=${it.id}&code=${it.verify_code}`
    : "";

  return (
    <div className="p-4 max-w-5xl mx-auto space-y-3">
      <h1 className="text-2xl font-semibold">Documentos</h1>
      <div className="flex items-end gap-2">
        <input className="border rounded p-2" placeholder="Buscar por tipo o folio" value={query} onChange={e=>setQuery(e.target.value)} />
        <div className="ml-auto flex gap-2 text-sm">
          {Object.keys(TYPE_LABEL).map(t=> (
            <button key={t}
                    className={"px-3 py-1 border rounded "+(filter.includes(t)?"bg-black text-white":"")}
                    onClick={()=> setFilter(s => s.includes(t)? s.filter(x=>x!==t) : [...s,t])}>
              {TYPE_LABEL[t]}
            </button>
          ))}
        </div>
      </div>

      <div className="border rounded">
        <div className="grid grid-cols-7 text-xs font-medium p-2 bg-gray-50">
          <div className="col-span-2">Tipo</div>
          <div>Folio</div>
          <div>Fecha</div>
          <div>Estado</div>
          <div>Acciones</div>
          <div>Verificación</div>
        </div>

        {filtered.map(it=> (
          <div key={`${it.type}-${it.id}`} className="grid grid-cols-7 items-center p-2 border-t text-sm">
            <div className="col-span-2">{TYPE_LABEL[it.type]}</div>
            <div>{it.folio || <button className="text-xs underline" onClick={()=>ensureFolio(it.type, it.id)}>Generar</button>}</div>
            <div>{new Date(it.created_at).toLocaleString()}</div>
            <div>
              {it.revoked_at
                ? <span className="px-2 py-0.5 rounded bg-red-100 text-red-700 text-xs">REVOCADO</span>
                : <span className="px-2 py-0.5 rounded bg-green-100 text-green-700 text-xs">VIGENTE</span>}
            </div>
            <div className="flex gap-2">
              <a className="underline" href={`/pacientes/${patientId}/documentos/${it.type}/${it.id}`}>Ver</a>
              {pdfHref(it.type,it.id) !== "#" && <a className="underline" href={pdfHref(it.type,it.id)} target="_blank" rel="noreferrer">PDF</a>}
              {printHref(it.type,it.id) && <a className="underline" href={printHref(it.type,it.id)} target="_blank" rel="noreferrer">Imprimir</a>}
            </div>
            <div>
              {it.verify_code
                ? <button className="text-xs underline" onClick={()=> navigator.clipboard.writeText(verifyUrl(it))}>Copiar link</button>
                : <span className="text-gray-500">—</span>}
            </div>
          </div>
        ))}
        {filtered.length===0 && <div className="p-4 text-sm text-gray-600">Sin documentos</div>}
      </div>
    </div>
  );
}
