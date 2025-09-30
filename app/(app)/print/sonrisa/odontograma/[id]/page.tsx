import { createClient } from "@/lib/supabase/server";
import AccentHeader from "@/components/ui/AccentHeader";

function cellClass(st?: string) {
  switch (st) {
    case "caries":
      return "bg-red-200";
    case "restaurado":
      return "bg-emerald-200";
    case "ausente":
      return "bg-gray-300";
    default:
      return "bg-white";
  }
}

export default async function PrintOdonto({ params }: { params: { id: string } }) {
  const supa = await createClient();
  const { data } = await supa.from("dental_charts").select("*").eq("id", params.id).single();
  const chart = (data?.chart || {}) as Record<string, { status: string }>;
  const top = [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28];
  const bottom = [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38];

  return (
    <div className="p-8 print:p-0 max-w-3xl mx-auto text-sm">
      <AccentHeader emoji="😁">Odontograma</AccentHeader>

      <div className="mb-4 text-xs opacity-70">
        Registro: {data?.id} · Paciente: {data?.patient_id} · Fecha:{" "}
        {new Date(data?.created_at || Date.now()).toLocaleString()}
      </div>

      <div className="space-y-4">
        <div className="grid [grid-template-columns:repeat(16,minmax(0,1fr))] gap-1">
          {top.map((n) => {
            const st = chart[String(n)]?.status;
            return (
              <div
                key={n}
                className={`aspect-square rounded border flex items-center justify-center ${cellClass(st)}`}
              >
                {n}
              </div>
            );
          })}
        </div>
        <div className="grid [grid-template-columns:repeat(16,minmax(0,1fr))] gap-1">
          {bottom.map((n) => {
            const st = chart[String(n)]?.status;
            return (
              <div
                key={n}
                className={`aspect-square rounded border flex items-center justify-center ${cellClass(st)}`}
              >
                {n}
              </div>
            );
          })}
        </div>
      </div>

      {data?.note && (
        <div className="mt-6">
          <div className="font-medium mb-1">Notas</div>
          <div className="whitespace-pre-wrap">{data.note}</div>
        </div>
      )}

      <style>{`@media print { .no-print{ display:none } }`}</style>
    </div>
  );
}
