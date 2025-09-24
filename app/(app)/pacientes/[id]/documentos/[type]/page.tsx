"use client";
import { useEffect, useMemo, useState } from "react";

const TYPE_LABEL: Record<string, string> = {
  prescription: "Receta",
  referral: "Interconsulta",
  discharge: "Alta",
  lab_request: "Solicitud de lab",
};
const pdfHref = (t: string, id: string) =>
  t === "prescription"
    ? `/api/prescriptions/${id}/pdf`
    : t === "referral"
      ? `/api/referrals/${id}/pdf`
      : t === "discharge"
        ? `/api/discharges/${id}/pdf`
        : t === "lab_request"
          ? `/api/labs/requests/${id}/pdf`
          : "#";
const printHref = (t: string, id: string) =>
  t === "prescription"
    ? `/print/prescriptions/${id}`
    : t === "referral"
      ? `/print/referrals/${id}`
      : t === "discharge"
        ? `/print/discharges/${id}`
        : "";

export default function DocViewer({
  params,
}: {
  params: { id: string; type: string; docId: string };
}) {
  const patientId = params.id;
  const type = params.type;
  const id = params.docId;
  const [mode, setMode] = useState<"pdf" | "html">("pdf");
  const [revoking, setRevoking] = useState(false);
  const [reason, setReason] = useState("");
  const [meta, setMeta] = useState<any>(null);

  useEffect(() => {
    (async () => {
      const j = await fetch(`/api/patients/${patientId}/docs/list`).then((r) => r.json());
      const row = (j.items || []).find((x: any) => x.type === type && x.id === id);
      setMeta(row || {});
    })();
  }, [patientId, type, id]);

  const iframeSrc = useMemo(
    () => (mode === "pdf" ? pdfHref(type, id) : printHref(type, id) || pdfHref(type, id)),
    [mode, type, id],
  );
  const verifyUrl = useMemo(
    () =>
      meta?.verify_code
        ? `${window.location.origin}/api/docs/verify?type=${type}&id=${id}&code=${meta.verify_code}`
        : "",
    [meta, type, id],
  );

  const revoke = async () => {
    if (!confirm("¿Revocar este documento? No se borra; sólo queda marcado como inválido.")) return;
    setRevoking(true);
    const r = await fetch("/api/docs/revoke", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ type, id, reason }),
    });
    const j = await r.json();
    setRevoking(false);
    if (!r.ok) return alert(j.error || "Error al revocar");
    alert("Documento revocado");
    window.location.reload();
  };

  return (
    <div className="p-0 h-[calc(100vh-64px)] flex flex-col">
      <div className="p-3 border-b flex items-center gap-2">
        <div className="font-medium">{TYPE_LABEL[type] || type}</div>
        <div className="ml-2 text-sm text-gray-500">Folio: {meta?.folio ?? "—"}</div>
        {meta?.verify_code && (
          <button
            className="ml-2 text-xs underline"
            onClick={() => navigator.clipboard.writeText(verifyUrl)}
          >
            Copiar link verificación
          </button>
        )}
        {meta?.revoked_at && (
          <span className="ml-2 text-xs px-2 py-0.5 rounded bg-red-100 text-red-700">REVOCADO</span>
        )}
        <div className="ml-auto flex gap-2">
          <button
            className={`px-3 py-1 border rounded ${mode === "pdf" ? "bg-black text-white" : ""}`}
            onClick={() => setMode("pdf")}
          >
            PDF
          </button>
          {printHref(type, id) && (
            <button
              className={`px-3 py-1 border rounded ${mode === "html" ? "bg-black text-white" : ""}`}
              onClick={() => setMode("html")}
            >
              HTML
            </button>
          )}
          {pdfHref(type, id) !== "#" && (
            <a
              className="px-3 py-1 border rounded"
              href={pdfHref(type, id)}
              target="_blank"
              rel="noreferrer"
            >
              Abrir
            </a>
          )}
        </div>
      </div>

      <div className="flex-1">
        <iframe src={iframeSrc} className="w-full h-full" />
      </div>

      <div className="p-3 border-t flex items-center gap-2">
        <input
          className="border rounded p-2 text-sm flex-1"
          placeholder="Motivo de revocación (opcional)"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
        <button
          disabled={revoking}
          className="px-3 py-2 border rounded text-red-700 border-red-300"
          onClick={revoke}
        >
          {revoking ? "Revocando…" : "Revocar"}
        </button>
      </div>
    </div>
  );
}
