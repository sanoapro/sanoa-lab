"use client";
import { useEffect, useState } from "react";

export default function VerifyPage() {
  const [info, setInfo] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const sp = new URLSearchParams(window.location.search);
      const type = sp.get("type") || "";
      const id = sp.get("id") || "";
      const code = sp.get("code") || "";
      if (!type || !id || !code) {
        setError("Parámetros incompletos");
        return;
      }
      const j = await fetch(
        `/api/docs/verify?type=${encodeURIComponent(type)}&id=${encodeURIComponent(id)}&code=${encodeURIComponent(code)}`,
      ).then((r) => r.json());
      setInfo(j);
    })();
  }, []);

  if (error) return <div className="p-6 max-w-xl mx-auto">{error}</div>;
  if (!info) return <div className="p-6 max-w-xl mx-auto">Verificando…</div>;

  const badge = info.revoked ? (
    <span className="px-2 py-1 rounded bg-red-100 text-red-700 text-xs">REVOCADO</span>
  ) : (
    <span className="px-2 py-1 rounded bg-green-100 text-green-700 text-xs">VIGENTE</span>
  );

  return (
    <div className="p-6 max-w-xl mx-auto space-y-2">
      <h1 className="text-xl font-semibold">Verificación de documento</h1>
      <div>Estado: {badge}</div>
      <div>
        Folio: <b>{info.folio || "—"}</b>
      </div>
      <div>Emitido: {info.created_at ? new Date(info.created_at).toLocaleString() : "—"}</div>
      {info.revoked && (
        <div>Revocado: {info.revoked_at ? new Date(info.revoked_at).toLocaleString() : "—"}</div>
      )}
      <div className="text-xs text-gray-500 mt-2">
        Este comprobante refleja el estado en tiempo real.
      </div>
    </div>
  );
}
