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
  const status = data?.stripe_status ?? null;
  const active = typeof status === "string" && ["active", "trialing", "past_due"].includes(status);
  const modules = (data?.modules as Record<string, boolean> | null) ?? {};
  const bankReady = Boolean((data as { bank_ready?: boolean | null } | null)?.bank_ready);

  return NextResponse.json({
    ok: true,
    data: {
      stripe_status: status,
      current_period_end: data?.current_period_end ?? null,
      stripe_customer_id: data?.stripe_customer_id ?? null,
      active,
      modules,
      bank_ready: bankReady,
    },
  });
}
