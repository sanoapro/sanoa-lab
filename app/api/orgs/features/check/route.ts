import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  const { org_id, feature_id } = await req.json();
  if (!org_id || !feature_id) {
    return NextResponse.json({ ok: false, error: "Faltan parámetros" }, { status: 400 });
  }
  const supa = await createClient();
  const { data } = await supa
    .from("org_features")
    .select("feature_id")
    .eq("org_id", org_id)
    .eq("feature_id", feature_id)
    .maybeSingle();
  return NextResponse.json({ ok: true, has: !!data });
}
