"use client";
import { useEffect, useState } from "react";

export default function PrintDischarge({ params }: { params: { id: string } }) {
  const id = params.id;
  const [data, setData] = useState<any>(null);
  useEffect(()=>{(async()=>{ const j = await fetch(`/api/discharges/${id}/json`).then(r=>r.json()); setData(j); setTimeout(()=>window.print(), 500); })();},[id]);
  if (!data) return <div className="p-4">Cargando…</div>;
  const { letterhead, footer, discharge, patient, ledger } = data;
  return (
    <div className="p-8 print:p-8 max-w-3xl mx-auto">
      <div className="flex items-start gap-4">
        {letterhead?.logo_url && (<img src={`/api/storage/letterheads/${letterhead.logo_url}`} alt="logo" className="h-16" />)}
        <div className="flex-1">
          <div className="font-semibold text-lg">{letterhead?.display_name || "Médico/a"}</div>
          <div className="text-sm">{letterhead?.credentials}</div>
          <div className="text-sm whitespace-pre-line">{letterhead?.clinic_info}</div>
        </div>
        <div className="text-right text-sm">
          <div>Folio: <b>{ledger?.folio}</b></div>
          <div>{new Date(discharge.created_at).toLocaleString()}</div>
        </div>
      </div>
      <hr className="my-4"/>
      <div className="text-sm">
        <div><b>Paciente:</b> {patient?.full_name || discharge.patient_id}</div>
      </div>
      <h2 className="mt-4 font-medium">Resumen de alta</h2>
      <div className="space-y-2 text-sm">
        {discharge.admission_at && <div><b>Ingreso:</b> {new Date(discharge.admission_at).toLocaleString()}</div>}
        {discharge.discharge_at && <div><b>Alta:</b> {new Date(discharge.discharge_at).toLocaleString()}</div>}
        {discharge.diagnosis && <div><b>Diagnóstico:</b> <span className="whitespace-pre-line">{discharge.diagnosis}</span></div>}
        {discharge.summary && <div><b>Resumen:</b> <span className="whitespace-pre-line">{discharge.summary}</span></div>}
        {discharge.recommendations && <div><b>Recomendaciones:</b> <span className="whitespace-pre-line">{discharge.recommendations}</span></div>}
        {discharge.follow_up_at && <div><b>Seguimiento:</b> {new Date(discharge.follow_up_at).toLocaleString()}</div>}
      </div>
      <div className="mt-8 flex items-center justify-between">
        <div className="text-xs text-gray-600 max-w-md whitespace-pre-line">{footer}</div>
        {letterhead?.signature_url && (<img src={`/api/storage/signatures/${letterhead.signature_url}`} alt="firma" className="h-20"/>) }
      </div>
      <style jsx global>{`
        @media print { @page { size: A4; margin: 16mm; } a, button { display:none!important } body{-webkit-print-color-adjust:exact} }
      `}</style>
    </div>
  );
}
