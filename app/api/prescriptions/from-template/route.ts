import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";

export async function POST(req: Request) {
  const supabase = createRouteHandlerClient({ cookies });
  const body = await req.json().catch(() => null);
  const { patient_id, template_id, diagnosis = null, notes = null } = body || {};

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No auth" }, { status: 401 });

  const { data: mem } = await supabase
    .from("organization_members")
    .select("org_id")
    .eq("user_id", user.id)
    .maybeSingle();
  const org_id = mem?.org_id;

  const { data: tpl } = await supabase
    .from("prescription_templates")
    .select("*")
    .eq("id", template_id)
    .maybeSingle();

  if (!tpl) return NextResponse.json({ error: "Template not found" }, { status: 404 });

  const { data: rx, error: e1 } = await supabase
    .from("prescriptions")
    .insert({ org_id, patient_id, doctor_id: user.id, diagnosis, notes })
    .select("id")
    .single();
  if (e1) return NextResponse.json({ error: "create_failed" }, { status: 500 });

  const items = (tpl.items || []).map((it: any) => ({
    prescription_id: rx.id,
    drug: it.drug_name,
    dose: it.dose || null,
    route: it.route || null,
    frequency: it.frequency || null,
    duration: it.duration || null,
    instructions: it.instructions || null,
  }));
  if (items.length) await supabase.from("prescription_items").insert(items);

  return NextResponse.json({ id: rx.id });
}
