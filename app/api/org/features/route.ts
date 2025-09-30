import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: Request) {
  const supa = await createClient();
  const { searchParams } = new URL(req.url);
  const org_id = searchParams.get("org_id");
  if (!org_id) return NextResponse.json({ error: "Falta org_id" }, { status: 400 });

  const { data, error } = await supa.from("org_features").select("feature_id").eq("org_id", org_id);

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true, features: (data || []).map((x) => x.feature_id) });
}
