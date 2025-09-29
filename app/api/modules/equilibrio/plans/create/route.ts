// MODE: session (user-scoped, cookies)
// POST /api/modules/equilibrio/plans/create
// { org_id, patient_id, starts_on: 'YYYY-MM-DD', items: [{ library_id, goal?, days: {mon?:bool,...}, notes? }], replace_active? }
import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase/server";

type Days = { mon?: boolean; tue?: boolean; wed?: boolean; thu?: boolean; fri?: boolean; sat?: boolean; sun?: boolean };

export async function POST(req: NextRequest) {
  const supa = await getSupabaseServer();
  const { data: auth } = await supa.auth.getUser();
  if (!auth?.user) return NextResponse.json({ ok:false, error:{ code:"UNAUTHORIZED", message:"No autenticado" } }, { status:401 });

  const body = await req.json().catch(()=>null) as {
    org_id?: string; patient_id?: string; starts_on?: string; replace_active?: boolean;
    items?: Array<{ library_id?: string; goal?: string|null; days?: Days; notes?: string|null }>;
  };

  if (!body?.org_id || !body?.patient_id || !body?.starts_on || !Array.isArray(body.items) || body.items.length === 0) {
    return NextResponse.json({ ok:false, error:{ code:"BAD_REQUEST", message:"org_id, patient_id, starts_on e items requeridos" } }, { status:400 });
  }

  const starts = new Date(body.starts_on);
  if (isNaN(starts.getTime())) {
    return NextResponse.json({ ok:false, error:{ code:"BAD_REQUEST", message:"starts_on inválido" } }, { status:400 });
  }

  // Si se pide reemplazar plan activo, lo desactiva
  if (body.replace_active) {
    await supa.from("equilibrio_plans")
      .update({ is_active: false })
      .eq("org_id", body.org_id)
      .eq("patient_id", body.patient_id)
      .eq("is_active", true);
  }

  const { data: plan, error: e1 } = await supa
    .from("equilibrio_plans")
    .insert({
      org_id: body.org_id,
      patient_id: body.patient_id,
      starts_on: starts.toISOString().slice(0,10),
      is_active: true,
      created_by: auth.user.id
    })
    .select("id")
    .single();

  if (e1) return NextResponse.json({ ok:false, error:{ code:"DB_ERROR", message:e1.message } }, { status:400 });

  const items = body.items.map(it => ({
    plan_id: plan!.id,
    library_id: it.library_id!,
    goal: it.goal ? String(it.goal).slice(0, 120) : null,
    notes: it.notes ? String(it.notes).slice(0, 500) : null,
    mon: !!it.days?.mon, tue: !!it.days?.tue, wed: !!it.days?.wed,
    thu: !!it.days?.thu, fri: !!it.days?.fri, sat: !!it.days?.sat, sun: !!it.days?.sun,
  }));

  const { error: e2 } = await supa.from("equilibrio_plan_items").insert(items);
  if (e2) return NextResponse.json({ ok:false, error:{ code:"DB_ERROR", message:e2.message } }, { status:400 });

  return NextResponse.json({ ok:true, data: { id: plan!.id } });
}
