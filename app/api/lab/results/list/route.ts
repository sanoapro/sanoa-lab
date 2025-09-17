import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";

export async function GET(req: Request) {
  const supa = createRouteHandlerClient({ cookies });
  const { searchParams } = new URL(req.url);
  const request_id = searchParams.get("request_id");
  const patient_id = searchParams.get("patient_id");

  if (!request_id && !patient_id) {
    return NextResponse.json({ error: "request_id o patient_id requerido" }, { status: 400 });
  }

  let q = supa
    .from("lab_results")
    .select("id, request_id, patient_id, file_path, file_name, mime_type, size_bytes, notes, created_at, reviewed_by, reviewed_at")
    .order("created_at", { ascending: false });

  if (request_id) q = q.eq("request_id", request_id);
  if (patient_id) q = q.eq("patient_id", patient_id);

  const { data, error } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ results: data || [] });
}
