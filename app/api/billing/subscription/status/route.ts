import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: Request) {
  const supa = createClient();
  const { searchParams } = new URL(req.url);
  const org_id = searchParams.get("org_id");
  if (!org_id) return NextResponse.json({ error: "Falta org_id" }, { status: 400 });

  const { data, error } = await supa
    .from("org_subscriptions")
    .select("stripe_status, current_period_end, stripe_customer_id")
    .eq("org_id", org_id)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true, data: data || {} });
}
