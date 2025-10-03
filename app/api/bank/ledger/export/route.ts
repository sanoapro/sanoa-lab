import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const svc = createServiceClient();
  const { searchParams } = new URL(req.url);
  const org_id = searchParams.get("org_id");
  const since = searchParams.get("since");
  const until = searchParams.get("until");
  if (!org_id) return NextResponse.json({ error: "Falta org_id" }, { status: 400 });

  let q = svc
    .from("org_ledger_transactions")
    .select(
      "created_at, type, amount_cents, currency, description, stripe_payment_intent_id, stripe_charge_id, stripe_invoice_id, meta",
    )
    .eq("org_id", org_id)
    .order("created_at", { ascending: true });

  if (since) q = q.gte("created_at", since);
  if (until) q = q.lte("created_at", until);

  const { data, error } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  const rows = [
    [
      "created_at",
      "type",
      "amount_cents",
      "currency",
      "description",
      "payment_intent",
      "charge",
      "invoice",
      "meta_json",
    ],
    ...(data || []).map((r: any) => [
      r.created_at,
      r.type,
      String(r.amount_cents),
      r.currency || "mxn",
      (r.description || "").replace(/\n/g, " "),
      r.stripe_payment_intent_id || "",
      r.stripe_charge_id || "",
      r.stripe_invoice_id || "",
      r.meta ? JSON.stringify(r.meta) : "",
    ]),
  ];
  const csv = rows
    .map((r: any) => r.map((cell: any) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    .join("\n");

  return new NextResponse(new Blob([csv]), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="sanoa_ledger_${org_id}.csv"`,
    },
  });
}
