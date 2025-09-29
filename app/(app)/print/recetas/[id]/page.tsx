// app/(app)/print/recetas/[id]/page.tsx
import { getSupabaseServer } from "@/lib/supabase/server";

export default async function PrintRecetaPage({ params }: { params: { id: string } }) {
  const supa = await getSupabaseServer();
  const id = params.id;
  const { data: rec } = await supa
    .from("prescriptions")
    .select(
      "id, org_id, patient_id, doctor_id, clinician_id, letterhead_path, signature_path, notes, issued_at"
    )
    .eq("id", id)
    .single();
  const { data: items } = await supa
    .from("prescription_items")
    .select("drug, dose, route, frequency, duration, instructions")
    .eq("prescription_id", id)
    .order("created_at", { ascending: true });

  return (
    <main className="p-6 print:p-0 text-slate-900">
      <section className="max-w-[800px] mx-auto space-y-4">
        {rec?.letterhead_path ? (
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
              Emitida: {rec?.issued_at ? new Date(rec.issued_at).toLocaleString() : "—"}
            </p>
            {rec?.notes ? <p className="text-sm text-slate-600 mt-1">Notas: {rec.notes}</p> : null}
          </div>
          <div className="text-right">
            {rec?.signature_path ? (
              <>
                <img
                  src={`/api/storage/signatures/${encodeURIComponent(rec.signature_path)}`}
                  alt="Firma"
                  className="h-20 inline-block"
                />
                <div className="text-xs text-slate-500">Firma del especialista</div>
              </>
            ) : null}
          </div>
        </header>

        <section className="rounded-2xl border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="text-left px-3 py-2 w-1/4">Fármaco</th>
                <th className="text-left px-3 py-2 w-1/4">Dosis / Vía</th>
                <th className="text-left px-3 py-2 w-1/4">Frecuencia / Duración</th>
                <th className="text-left px-3 py-2 w-1/4">Indicaciones</th>
              </tr>
            </thead>
            <tbody>
              {(items || []).map((it, i) => (
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
                  <td className="px-3 py-2">{it.instructions}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </section>
    </main>
  );
}
