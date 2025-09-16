import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";

export async function GET(req: Request) {
  const supabase = createRouteHandlerClient({ cookies });
  const { searchParams } = new URL(req.url);
  const patient = String(searchParams.get("patient") || "");

  if (!patient) return NextResponse.json({ error: "patient requerido" }, { status: 400 });

  const { data, error } = await supabase.rpc("list_latest_files", { p_patient_id: patient });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  // Normaliza a interfaz simple
  const items = (data || []).map((r: any) => ({
    name: r.name as string,
    path: r.path as string,
    version: r.version as number,
    size: Number(r.size_bytes || 0),
    created_at: r.created_at as string,
    updated_at: r.created_at as string,
    group_key: r.group_key as string,
  }));

  return NextResponse.json(items);
}