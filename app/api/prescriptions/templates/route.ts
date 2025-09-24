import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";

/** GET: lista plantillas del doctor + org */
export async function GET() {
  const supabase = createRouteHandlerClient({ cookies });
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
  const { data } = await supabase
    .from("prescription_templates")
    .select("*")
    .eq("org_id", org_id)
    .or(`doctor_id.is.null,doctor_id.eq.${user.id}`)
    .order("doctor_id", { ascending: false });

  return NextResponse.json({ items: data || [] });
}

/** POST: crear plantilla (doctor_scope=true => privada del doctor) */
export async function POST(req: Request) {
  const supabase = createRouteHandlerClient({ cookies });
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No auth" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const { name, items = [], doctor_scope = true, specialty = null } = body || {};

  const { data: mem } = await supabase
    .from("organization_members")
    .select("org_id")
    .eq("user_id", user.id)
    .maybeSingle();

  const org_id = mem?.org_id;
  const payload = { org_id, doctor_id: doctor_scope ? user.id : null, specialty, name, items };

  const { data, error } = await supabase
    .from("prescription_templates")
    .insert(payload)
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: "create_failed" }, { status: 500 });
  return NextResponse.json({ item: data });
}
