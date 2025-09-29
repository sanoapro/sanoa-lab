import { getSupabaseServer } from "@/lib/supabase/server";
import { getUserLetterheadURL, renderLetterheadHTML } from "@/lib/branding/letterhead";

type PrescriptionJson = {
  id: string;
  org_id: string;
  patient?: { name?: string; age?: string; id?: string } | null;
  doctor?: { id: string; name: string; specialty?: string | null } | null;
  issued_at?: string | null;
  items?: Array<{ name: string; dose?: string; freq?: string; notes?: string }> | null;
  notes?: string | null;
};

export default async function PrintPrescriptionPage({ params }: { params: { id: string } }) {
  const supa = await getSupabaseServer();
  const { data: u } = await supa.auth.getUser();
  if (!u?.user) {
    return <div className="p-6 text-rose-700">Necesitas iniciar sesión.</div>;
  }

  // Carga JSON de la receta usando el endpoint existente (reusa cookies de SSR)
  const origin = process.env.NEXT_PUBLIC_SITE_URL || "";
  const r = await fetch(`${origin}/api/prescriptions/${params.id}/json`, { cache: "no-store" });
  const j = (await r.json().catch(() => null)) as { ok?: boolean; data?: PrescriptionJson } | null;
  if (!j?.ok || !j.data) {
    return <div className="p-6 text-rose-700">No se pudo cargar la receta.</div>;
  }
  const p = j.data;
  const specialistId = p.doctor?.id || u.user.id;

  // Membrete del especialista
  const letterheadUrl = await getUserLetterheadURL(supa as any, specialistId);
  const headerHtml = renderLetterheadHTML({
    specialistName: p.doctor?.name || "Especialista",
    specialty: p.doctor?.specialty || null,
    orgName: "", // si tienes orgName en el JSON, úsalo aquí
    letterheadUrl,
  });

  // Render minimalista imprimible
  return (
    <html>
      <head>
        <title>Receta #{p.id}</title>
        <meta name="robots" content="noindex" />
        <style>{`
          @media print { @page { margin: 20mm; } .no-print { display: none; } }
          body { font-family: ui-sans-serif, system-ui; color: #0f172a; }
          .card { max-width: 720px; margin: 24px auto; background: #fff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 24px; }
          h1 { font-size: 18px; font-weight: 700; margin: 0 0 8px; }
          h2 { font-size: 14px; font-weight: 600; margin: 16px 0 8px; }
          .muted { color: #475569; }
          .item { border: 1px solid #e2e8f0; border-radius: 12px; padding: 12px; margin-top: 8px; }
        `}</style>
      </head>
      <body>
        <div className="card">
          {/* header injectado */}
          <div dangerouslySetInnerHTML={{ __html: headerHtml }} />
          <h1>Receta médica</h1>
          <div className="muted">Folio: {p.id} — Emitida: {p.issued_at || "—"}</div>

          <h2>Paciente</h2>
          <div>
            {p.patient?.name || "—"}{" "}
            {p.patient?.age ? <span className="muted">({p.patient.age})</span> : null}
          </div>

          <h2>Indicaciones</h2>
          {p.items?.length ? (
            p.items.map((it, i) => (
              <div className="item" key={i}>
                <div>
                  <strong>{it.name}</strong>
                </div>
                <div className="muted">{[it.dose, it.freq].filter(Boolean).join(" · ")}</div>
                {it.notes ? <div>{it.notes}</div> : null}
              </div>
            ))
          ) : (
            <div className="muted">Sin ítems</div>
          )}

          {p.notes ? (
            <>
              <h2>Notas</h2>
              <div>{p.notes}</div>
            </>
          ) : null}

          <div className="no-print" style={{ marginTop: 16 }}>
            <button onClick={() => window.print()} className="border rounded-lg px-3 py-2">
              Imprimir
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
