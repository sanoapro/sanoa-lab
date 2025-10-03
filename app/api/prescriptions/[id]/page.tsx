"use client";
import { useEffect, useState } from "react";

export default function PrintRx({ params }: { params: { id: string } }) {
  const id = params.id;
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    (async () => {
      const rx = await fetch(`/api/prescriptions/${id}/json`).then((r: any) => r.json());
      setData(rx);
      setTimeout(() => window.print(), 400);
    })();
  }, [id]);

  if (!data) return <div className="p-4">Cargando…</div>;

  const { letterhead, footer, prescription, items, patient, ledger } = data;

  return (
    <div className="p-8 print:p-8 max-w-3xl mx-auto">
      <div className="flex items-start gap-4">
        {letterhead?.logo_url && (
          <img
            src={`/api/storage/letterheads/${letterhead.logo_url}`}
            alt="logo"
            className="h-16"
          />
        )}
        <div className="flex-1">
          <div className="font-semibold text-lg">{letterhead?.display_name || "Médico/a"}</div>
          <div className="text-sm">{letterhead?.credentials}</div>
          <div className="text-sm whitespace-pre-line">{letterhead?.clinic_info}</div>
        </div>
        <div className="text-right text-sm">
          <div>
            Folio: <b>{ledger?.folio}</b>
          </div>
          <div>{new Date(prescription.created_at).toLocaleString()}</div>
        </div>
      </div>

      <hr className="my-4" />

      <div className="text-sm">
        <div>
          <b>Paciente:</b> {patient?.full_name || prescription.patient_id}
        </div>
        {patient?.external_id && (
          <div>
            <b>ID:</b> {patient.external_id}
          </div>
        )}
      </div>

      {prescription.diagnosis && (
        <>
          <h2 className="mt-4 font-medium">Diagnóstico</h2>
          <p className="whitespace-pre-line text-sm">{prescription.diagnosis}</p>
        </>
      )}

      <h2 className="mt-4 font-medium">Prescripción</h2>
      <ul className="list-disc pl-6 text-sm">
        {items.map((it: any) => (
          <li key={it.id} className="mb-1">
            <div>
              <b>{it.drug}</b> {it.dose || ""} {it.route || ""} • {it.frequency || ""} •{" "}
              {it.duration || ""}
            </div>
            {it.instructions && <div className="text-gray-600">{it.instructions}</div>}
          </li>
        ))}
      </ul>

      <div className="mt-8 flex items-center justify-between">
        <div className="text-xs text-gray-600 max-w-md whitespace-pre-line">{footer}</div>
        {letterhead?.signature_url && (
          <img
            src={`/api/storage/signatures/${letterhead.signature_url}`}
            alt="firma"
            className="h-20"
          />
        )}
      </div>

      <style jsx global>{`
        @media print {
          @page {
            size: A4;
            margin: 16mm;
          }
          a,
          button {
            display: none !important;
          }
          body {
            -webkit-print-color-adjust: exact;
          }
        }
      `}</style>
    </div>
  );
}
