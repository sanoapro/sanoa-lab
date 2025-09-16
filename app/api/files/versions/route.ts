import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";

export async function GET(req: Request) {
  const supabase = createRouteHandlerClient({ cookies });
  const { searchParams } = new URL(req.url);
  const patient = String(searchParams.get("patient") || "");
  const key = String(searchParams.get("key") || "");

  if (!patient || !key) return NextResponse.json({ error: "patient y key requeridos" }, { status: 400 });

  const { data, error } = await supabase.rpc("list_file_versions", { p_patient_id: patient, p_group_key: key });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json(data || []);
}