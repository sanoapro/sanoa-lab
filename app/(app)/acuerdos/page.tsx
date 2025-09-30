// app/(app)/acuerdos/page.tsx
'use client';

import * as React from "react";
import AccentHeader from "@/components/ui/AccentHeader";
import Autocomplete from "@/components/patients/Autocomplete";

export default function AcuerdosPage() {
  const [orgId, setOrgId] = React.useState<string | null>(null);
  const [status, setStatus] = React.useState<{ specialist_platform: boolean } | null>(null);
  const [creating, setCreating] = React.useState(false);
  const [shareUrl, setShareUrl] = React.useState<string | null>(null);

  React.useEffect(() => {
    // org activa desde localStorage (cliente)
    try {
      const id = localStorage.getItem("activeOrgId");
      setOrgId(id);
    } catch {}
  }, []);

  React.useEffect(() => {
    if (!orgId) return;
    (async () => {
      try {
        const r = await fetch(`/api/agreements/status?org_id=${encodeURIComponent(orgId)}`, { cache: "no-store" });
        const j = await r.json();
        setStatus(j?.ok ? j.data : null);
      } catch {
        setStatus(null);
      }
    })();
  }, [orgId]);

  async function acceptSP() {
    if (!orgId) return;
    const r = await fetch(`/api/agreements/accept`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ org_id: orgId }),
    });
    const j = await r.json();
    if (j?.ok) {
      setStatus((prev) => ({ ...(prev || {}), specialist_platform: true }));
      alert("Contrato Especialista ↔ Plataforma aceptado.");
    } else {
      alert(j?.error?.message || "No se pudo aceptar");
    }
  }

  async function createLink(patient_id: string) {
    if (!orgId) return;
    setCreating(true);
    setShareUrl(null);
    try {
      const r = await fetch(`/api/agreements/request`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ org_id: orgId, patient_id }),
      });
      const j = await r.json();
      if (j?.ok) setShareUrl(j.data?.url || null);
      else alert(j?.error?.message || "No se pudo generar enlace");
    } finally {
      setCreating(false);
    }
  }

  return (
    <main className="p-6 md:p-10 space-y-8">
      <AccentHeader
        title="Acuerdos"
        subtitle="Contratos estandarizados y registro de aceptaciones."
        emojiToken="carpeta"
      />

      <section className="rounded-3xl border bg-white/95 p-6">
        <h3 className="font-semibold">1) Especialista ↔ Plataforma</h3>
        <p className="text-sm text-slate-600">
          Obligatorio para usar la PWA. Una vez aceptado, queda registrado y no es editable.
        </p>
        <div className="mt-3">
          {status?.specialist_platform ? (
            <span className="inline-flex items-center px-3 py-1.5 rounded-xl bg-emerald-100 text-emerald-800 border border-emerald-300">
              Aceptado
            </span>
          ) : (
            <button onClick={acceptSP} className="px-3 py-2 rounded-xl bg-blue-600 text-white">
              Aceptar ahora
            </button>
          )}
        </div>
      </section>

      <section className="rounded-3xl border bg-white/95 p-6">
        <h3 className="font-semibold">2) Especialista ↔ Paciente</h3>
        <p className="text-sm text-slate-600">
          Genera un enlace de aceptación para el paciente. La primera sesión puede realizarse sin aceptar; a partir de la segunda,
          se requiere aceptación.
        </p>

        <div className="mt-3 max-w-xl">
          <label className="text-sm font-medium">Buscar paciente</label>
          <div className="mt-2">
            <Autocomplete
              placeholder="Escribe nombre del paciente…"
              onSelect={(hit) => createLink(hit.patient_id)}
            />
          </div>
        </div>

        {creating && <p className="text-sm text-slate-500 mt-3">Generando enlace…</p>}
        {shareUrl && (
          <div className="mt-3">
            <p className="text-sm">Comparte este enlace al paciente para aceptar:</p>
            <div className="mt-1 flex items-center gap-2">
              <input readOnly value={shareUrl} className="w-full px-3 py-2 rounded-xl border" />
              <button
                onClick={() => navigator.clipboard.writeText(shareUrl)}
                className="px-3 py-2 rounded-xl border"
              >
                Copiar
              </button>
            </div>
          </div>
        )}
      </section>

      <section className="rounded-3xl border bg-white/95 p-6">
        <h3 className="font-semibold">3) Paciente ↔ Plataforma</h3>
        <p className="text-sm text-slate-600">
          Este acuerdo se solicitará en la PWA de pacientes. (Infra lista del lado servidor y base de datos).
        </p>
      </section>
    </main>
  );
}
