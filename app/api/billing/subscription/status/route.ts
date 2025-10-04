import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: Request) {
  const supa = await createClient();
  const { searchParams } = new URL(req.url);
  const org_id = searchParams.get("org_id");
  if (!org_id) return NextResponse.json({ error: "Falta org_id" }, { status: 400 });

  const { data, error } = await supa
    .from("org_subscriptions")
    .select("stripe_status, current_period_end, stripe_customer_id, modules, bank_ready")
    .eq("org_id", org_id)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  const d: any = data;
  const status = d?.stripe_status ?? null;
  const active = typeof status === "string" && ["active", "trialing", "past_due"].includes(status);
  const modules = (d?.modules as Record<string, boolean> | null) ?? {};
  const bankReady = Boolean(d?.bank_ready ?? null);

  return NextResponse.json({
    ok: true,
    data: {
      stripe_status: status,
      current_period_end: d?.current_period_end ?? null,
      stripe_customer_id: d?.stripe_customer_id ?? null,
      active,
      modules,
      bank_ready: bankReady,
    },
  });
}
