import { createClient } from "@/lib/supabase/server";
import AccentHeader from "@/components/ui/AccentHeader";

export default async function PrintSession({ params }: { params: { id: string } }) {
  const supa = await createClient();
  const { data } = await supa.from("rehab_sessions").select("*").eq("id", params.id).single();
  const soap = (data?.soap || {}) as Record<string, string>;

  return (
    <div className="p-8 print:p-0 max-w-2xl mx-auto text-sm">
      <AccentHeader emoji="🧘">Sesión SOAP</AccentHeader>
      <div className="opacity-70 mb-4">
        ID: {data?.id} · Paciente: {data?.patient_id} · Fecha:{" "}
        {new Date(data?.date || Date.now()).toLocaleString()}
      </div>

      <section className="space-y-3">
        <div>
          <div className="font-medium mb-1">S — Subjetivo</div>
          <div className="whitespace-pre-wrap">{soap.S || "—"}</div>
        </div>
        <div>
          <div className="font-medium mb-1">O — Objetivo</div>
          <div className="whitespace-pre-wrap">{soap.O || "—"}</div>
        </div>
        <div>
          <div className="font-medium mb-1">A — Análisis</div>
          <div className="whitespace-pre-wrap">{soap.A || "—"}</div>
        </div>
        <div>
          <div className="font-medium mb-1">P — Plan</div>
          <div className="whitespace-pre-wrap">{soap.P || "—"}</div>
        </div>
      </section>

      <style>{`@media print { .no-print{ display:none } }`}</style>
    </div>
  );
}
