import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";

type RxItem = {
  drug: string;
  dose?: string | null;
  route?: string | null;
  frequency?: string | null;
  duration?: string | null;
  instructions?: string | null;
};

export async function POST(req: Request) {
  const supabase = createRouteHandlerClient({ cookies });
  const body = await req.json().catch(() => null);
  const { patient_id, diagnosis = null, notes = null, items = [] as RxItem[] } = body || {};

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

  const { data: rx, error: e1 } = await supabase
    .from("prescriptions")
    .insert({ org_id, patient_id, doctor_id: user.id, diagnosis, notes })
    .select("id")
    .single();

  if (e1) return NextResponse.json({ error: "create_failed" }, { status: 500 });

  const rows = (items || []).map((it: RxItem) => ({
    prescription_id: rx.id,
    drug: it.drug,
    dose: it.dose || null,
    route: it.route || null,
    frequency: it.frequency || null,
    duration: it.duration || null,
    instructions: it.instructions || null,
  }));

  if (rows.length) {
    const { error: e2 } = await supabase.from("prescription_items").insert(rows);
    if (e2) return NextResponse.json({ error: "items_failed" }, { status: 500 });
  }

  return NextResponse.json({ id: rx.id });
}
