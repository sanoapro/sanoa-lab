import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";

export async function POST(req: Request) {
  const supabase = createRouteHandlerClient({ cookies });
  const body = await req.json().catch(() => null);
  const {
    patient_id,
    admission_at = null,
    discharge_at = null,
    diagnosis,
    summary,
    recommendations,
    follow_up_at = null,
  } = body || {};

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No auth" }, { status: 401 });

  const { data: mem } = await supabase
    .from("organization_members")
    .select("org_id")
    .eq("user_id", user.id)
    .maybeSingle();
  const org_id = mem?.org_id;
  if (!org_id) return NextResponse.json({ error: "Sin organización" }, { status: 400 });
  if (!patient_id) return NextResponse.json({ error: "Falta patient_id" }, { status: 400 });
  if (!diagnosis || !summary) return NextResponse.json({ error: "Faltan campos" }, { status: 400 });

  const payload = {
    org_id,
    patient_id,
    doctor_id: user.id,
    admission_at,
    discharge_at,
    diagnosis,
    summary,
    recommendations,
    follow_up_at,
  };
  const { data, error } = await supabase.from("discharges").insert(payload).select("id").single();
  if (error) return NextResponse.json({ error: "create_failed" }, { status: 500 });
  return NextResponse.json({ id: data?.id });
}
