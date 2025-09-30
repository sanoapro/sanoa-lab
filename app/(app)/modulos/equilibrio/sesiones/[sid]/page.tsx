import { createClient } from "@/lib/supabase/server";
import AccentHeader from "@/components/ui/AccentHeader";

export default async function SessionDetail({ params }: { params: { sid: string } }) {
  const supa = await createClient();
  const { data } = await supa.from("rehab_sessions").select("*").eq("id", params.sid).single();
  const soap = (data?.soap || {}) as Record<string, string>;

  return (
    <div className="p-6 space-y-4 max-w-3xl">
      <AccentHeader emoji="🧘">Sesión — Detalle</AccentHeader>
      <div className="text-sm opacity-70">
        Fecha: {new Date(data?.date || Date.now()).toLocaleString()}
      </div>
      <div className="grid md:grid-cols-2 gap-4">
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
      </div>
      <div>
        <a
          className="underline text-sm"
          href={`/print/equilibrio/sesiones/${params.sid}`}
          target="_blank"
          rel="noreferrer"
        >
          Abrir versión para imprimir
        </a>
      </div>
    </div>
  );
}
