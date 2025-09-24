"use client";
import { useEffect, useState } from "react";

export default function PrintLabReq({ params }: { params: { id: string } }) {
  const id = params.id;
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    (async () => {
      const j = await fetch(`/api/labs/requests/${id}/json`).then((r) => r.json());
      setData(j);
      setTimeout(() => window.print(), 400);
    })();
  }, [id]);

  if (!data) return <div className="p-4">Cargando…</div>;
  const { letterhead, footer, request, items, patient, ledger } = data;

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
          <div>{new Date(request.created_at).toLocaleString()}</div>
        </div>
      </div>

      <hr className="my-4" />

      <div className="text-sm">
        <div>
          <b>Paciente:</b> {patient?.full_name || request.patient_id}
        </div>
        {patient?.external_id && (
          <div>
            <b>ID:</b> {patient.external_id}
          </div>
        )}
      </div>

      <h2 className="mt-4 font-medium">Solicitud de estudios de laboratorio</h2>
      {request.title && (
        <div className="mt-1 text-sm">
          <b>Título:</b> {request.title}
        </div>
      )}
      {request.due_at && (
        <div className="text-sm">
          <b>Fecha límite:</b> {new Date(request.due_at).toLocaleString()}
        </div>
      )}
      {request.instructions && (
        <div className="mt-2 whitespace-pre-line text-sm">
          <b>Instrucciones:</b> {request.instructions}
        </div>
      )}

      <h3 className="mt-4 font-medium">Estudios</h3>
      <ul className="list-disc pl-6 text-sm">
        {(items || []).map((it: any) => (
          <li key={it.id} className="mb-1">
            <div>
              <b>{it.test_name || "(sin nombre)"}</b>
              {it.test_code ? ` [${it.test_code}]` : ""}
            </div>
            {it.notes && <div className="text-gray-600">{it.notes}</div>}
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
