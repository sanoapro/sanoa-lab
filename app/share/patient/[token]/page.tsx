// Página pública de solo lectura por token (no sesión)
import AccentHeader from "@/components/ui/AccentHeader";

async function load(token: string) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL ?? ""}/api/patients/share/${token}`, { cache: "no-store" });
  // fallback: si no está NEXT_PUBLIC_BASE_URL, usar ruta relativa
  if (!res.ok) {
    const r2 = await fetch(`/api/patients/share/${token}`, { cache: "no-store" });
    return r2.json();
  }
  return res.json();
}

export default async function SharedPatientPage({ params }: { params: { token: string } }) {
  const json = await load(params.token);

  return (
    <main className="p-6 md:p-10 space-y-6">
      <AccentHeader
        title="Acceso compartido"
        subtitle="Lectura segura con caducidad"
        emojiToken="pacientes"
      />
      {json?.ok ? (
        <section className="rounded-2xl border p-4 space-y-2 text-sm">
          <div><span className="text-slate-500">Nombre:</span> {json.data.patient.name ?? "—"}</div>
          <div><span className="text-slate-500">Género:</span> {json.data.patient.gender ?? "—"}</div>
          <div><span className="text-slate-500">Fecha de nacimiento:</span> {json.data.patient.dob ?? "—"}</div>
          <div><span className="text-slate-500">Tags:</span> {Array.isArray(json.data.patient.tags) && json.data.patient.tags.length ? json.data.patient.tags.join(", ") : "—"}</div>
          <p className="text-xs text-slate-500 mt-2">Este acceso queda registrado por motivos de auditoría.</p>
        </section>
      ) : (
        <p className="text-rose-700 bg-rose-50 border border-rose-200 rounded p-3">
          {json?.error?.message ?? "Este enlace no está disponible."}
        </p>
      )}
    </main>
  );
}
