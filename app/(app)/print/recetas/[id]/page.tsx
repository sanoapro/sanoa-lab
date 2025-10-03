// app/(app)/print/recetas/[id]/page.tsx
import { getSupabaseServer } from "@/lib/supabase/server";

type PrescriptionRecord = {
  id: string;
  org_id: string;
  patient_id: string;
  clinician_id: string;
  letterhead_path: string | null;
  signature_path: string | null;
  notes: string | null;
  issued_at: string | null;
};

type PrescriptionItem = {
  drug: string;
  dose: string | null;
  route: string | null;
  frequency: string | null;
  duration: string | null;
  instructions: string | null;
};

export default async function PrintRecetaPage({
  params,
}: {
  params: { id: string };
}) {
  const supa = await getSupabaseServer();

  // Verifica sesión
  const { data: au } = await supa.auth.getUser();
  if (!au?.user) {
    return <div className="p-6 text-rose-700">Necesitas iniciar sesión.</div>;
  }

  const id = params.id;

  // Cabecera de la receta
  const { data: rec } = await supa
    .from("prescriptions")
    .select(
      "id, org_id, patient_id, clinician_id, letterhead_path, signature_path, notes, issued_at",
    )
    .eq("id", id)
    .maybeSingle<PrescriptionRecord>();

  // Items de la receta
  const { data: items } = await supa
    .from("prescription_items")
    .select(
      "drug, dose, route, frequency, duration, instructions",
    )
    .eq("prescription_id", id)
    .order("created_at", { ascending: true })
    .returns<PrescriptionItem[]>();

  if (!rec) {
    return <div className="p-6 text-rose-700">No se encontró la receta.</div>;
  }

  return (
    <main className="p-6 print:p-0 text-slate-900">
      <section className="mx-auto max-w-[800px] space-y-4">
        {rec.letterhead_path ? (
          <img
            src={`/api/storage/letterheads/${encodeURIComponent(rec.letterhead_path)}`}
            alt="Membrete"
            className="w-full rounded-xl border"
          />
        ) : null}

        <header className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold">Receta</h1>
            <p className="text-sm text-slate-500">
              Emitida:{" "}
              {rec.issued_at ? new Date(rec.issued_at).toLocaleString() : "—"}
            </p>
            {rec.notes ? (
              <p className="mt-1 text-sm text-slate-600">Notas: {rec.notes}</p>
            ) : null}
          </div>
          <div className="text-right">
            {rec.signature_path ? (
              <>
                <img
                  src={`/api/storage/signatures/${encodeURIComponent(rec.signature_path)}`}
                  alt="Firma"
                  className="inline-block h-20"
                />
                <div className="text-xs text-slate-500">
                  Firma del especialista
                </div>
              </>
            ) : null}
          </div>
        </header>

        <section className="overflow-hidden rounded-2xl border">
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="w-1/4 px-3 py-2 text-left">Fármaco</th>
                <th className="w-1/4 px-3 py-2 text-left">Dosis / Vía</th>
                <th className="w-1/4 px-3 py-2 text-left">
                  Frecuencia / Duración
                </th>
                <th className="w-1/4 px-3 py-2 text-left">Indicaciones</th>
              </tr>
            </thead>
            <tbody>
              {(items ?? []).map((it: PrescriptionItem, i: number) => (
                <tr key={i} className="border-t">
                  <td className="px-3 py-2">
                    <strong>{it.drug}</strong>
                  </td>
                  <td className="px-3 py-2">
                    {[it.dose, it.route].filter(Boolean).join(" / ")}
                  </td>
                  <td className="px-3 py-2">
                    {[it.frequency, it.duration].filter(Boolean).join(" / ")}
                  </td>
                  <td className="px-3 py-2">{it.instructions ?? ""}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </section>
    </main>
  );
}
