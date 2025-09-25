import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

export async function GET(req: Request) {
  const supa = createClient();
  const { searchParams } = new URL(req.url);
  const org_id = searchParams.get("org_id");
  if (!org_id) return NextResponse.json({ error: "Falta org_id" }, { status: 400 });

  const { data, error } = await supa
    .from("org_bank_settings")
    .select("*")
    .eq("org_id", org_id)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true, data: data || { org_id, low_balance_threshold_cents: 0, notify_channel: "whatsapp", notify_to: null } });
}

export async function POST(req: Request) {
  const svc = createServiceClient();
  const { org_id, low_balance_threshold_cents, notify_channel, notify_to } = await req.json();

  if (!org_id) return NextResponse.json({ error: "Falta org_id" }, { status: 400 });
  const { error } = await svc.from("org_bank_settings").upsert({
    org_id,
    low_balance_threshold_cents: Number(low_balance_threshold_cents || 0),
    notify_channel: notify_channel || "whatsapp",
    notify_to: notify_to || null,
    updated_at: new Date().toISOString(),
  }, { onConflict: "org_id" });

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
