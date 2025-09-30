import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const { agreement_id, accepted_by = "patient" } = body ?? {};
  if (!agreement_id) return NextResponse.json({ error: "agreement_id requerido" }, { status: 400 });

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("agreements")
    .update({ accepted_by, accepted_at: new Date().toISOString() })
    .eq("id", agreement_id)
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true, agreement: data }, { status: 200 });
}
