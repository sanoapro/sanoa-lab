// app/share/agreement/[token]/page.tsx
'use client';

import * as React from "react";
import { useParams } from "next/navigation";

export default function ShareAgreementPage() {
  const { token } = useParams<{ token: string }>();
  const [loading, setLoading] = React.useState(true);
  const [doc, setDoc] = React.useState<{ title: string; body: string } | null>(null);
  const [done, setDone] = React.useState(false);
  const [err, setErr] = React.useState<string | null>(null);
  const [patientName, setPatientName] = React.useState("");

  React.useEffect(() => {
    (async () => {
      try {
        const r = await fetch(`/api/agreements/share/get?token=${encodeURIComponent(token)}`, { cache: "no-store" });
        const j = await r.json();
        if (j?.ok) setDoc(j.data);
        else setErr(j?.error?.message || "No disponible");
      } catch {
        setErr("No disponible");
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  async function accept() {
    try {
      const r = await fetch(`/api/agreements/share/accept`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ token, patient_name: patientName || undefined }),
      });
      const j = await r.json();
      if (j?.ok) setDone(true);
      else setErr(j?.error?.message || "No se pudo aceptar");
    } catch {
      setErr("No se pudo aceptar");
    }
  }

  if (loading) return <main className="p-6"><p>Cargando…</p></main>;
  if (err) return <main className="p-6"><p className="text-rose-600">{err}</p></main>;
  if (done) return <main className="p-6"><h1 className="text-xl font-semibold">¡Listo!</h1><p>Tu aceptación ha sido registrada.</p></main>;

  return (
    <main className="p-6 max-w-3xl mx-auto space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">{doc?.title || "Acuerdo"}</h1>
      </header>
      <article className="prose prose-slate dark:prose-invert">
        {doc?.body.split("\n").map((l, i) => <p key={i}>{l}</p>)}
      </article>

      <section className="rounded-3xl border bg-white/95 p-4">
        <label className="text-sm font-medium">Tu nombre (opcional, para el registro)</label>
        <input
          value={patientName}
          onChange={(e) => setPatientName(e.target.value)}
          placeholder="Nombre y apellidos"
          className="mt-1 w-full px-3 py-2 rounded-xl border"
        />
        <div className="mt-3">
          <button onClick={accept} className="px-4 py-2 rounded-xl bg-blue-600 text-white">
            Aceptar acuerdo
          </button>
        </div>
      </section>
    </main>
  );
}
