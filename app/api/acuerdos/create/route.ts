import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const { contract_type = "specialist_patient", org_id = null, subject_id = null, subject_type = null, version = "1.0.0" } = body ?? {};

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("agreements")
    .insert([{ contract_type, org_id, subject_id, subject_type, version }])
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true, agreement: data }, { status: 200 });
}
