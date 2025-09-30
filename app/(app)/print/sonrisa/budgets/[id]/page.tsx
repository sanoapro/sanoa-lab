import { createClient } from "@/lib/supabase/server";
import AccentHeader from "@/components/ui/AccentHeader";

export default async function PrintBudget({ params }: { params: { id: string } }) {
  const supa = await createClient();
  const { data: budget } = await supa
    .from("dental_budgets")
    .select("*")
    .eq("id", params.id)
    .single();
  const { data: items } = await supa
    .from("dental_budget_items")
    .select("*")
    .eq("budget_id", params.id);

  return (
    <div className="p-8 print:p-0 max-w-2xl mx-auto text-sm">
      <AccentHeader emoji="😁">Presupuesto dental</AccentHeader>
      <div className="opacity-70 mb-4">
        #{budget?.id} · Paciente: {budget?.patient_id} ·{" "}
        {new Date(budget?.created_at || Date.now()).toLocaleString()}
      </div>

      <table className="w-full border-collapse">
        <thead>
          <tr>
            <th className="border p-2 text-left">Concepto</th>
            <th className="border p-2">Cant</th>
            <th className="border p-2">Precio</th>
            <th className="border p-2">Total</th>
          </tr>
        </thead>
        <tbody>
          {(items || []).map((it: any) => (
            <tr key={it.id}>
              <td className="border p-2">{it.description}</td>
              <td className="border p-2 text-center">{it.qty}</td>
              <td className="border p-2 text-right">$ {Number(it.unit_price).toFixed(2)}</td>
              <td className="border p-2 text-right">$ {Number(it.line_total).toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="text-right mt-4 text-lg font-semibold">
        Total: $ {Number(budget?.total || 0).toFixed(2)}
      </div>
    </div>
  );
}
