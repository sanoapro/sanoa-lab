import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase/server";

type TemplateItem = {
  drug?: string;
  drug_name?: string;
  dose?: string | null;
  route?: string | null;
  freq?: string | null;
  frequency?: string | null;
  duration?: string | null;
  instructions?: string | null;
};

type TemplateBody = {
  org_id?: string;
  name?: string;
  notes?: string | null;
  active?: boolean;
  items?: TemplateItem[];
  doctor_scope?: boolean;
  specialty?: string | null;
};

export async function GET(req: NextRequest) {
  const supa = await getSupabaseServer();
  const { data: au } = await supa.auth.getUser();
  if (!au?.user) {
    return NextResponse.json(
      { ok: false, error: { code: "UNAUTHORIZED", message: "No autenticado" } },
      { status: 401 }
    );
  }

  const url = new URL(req.url);
  let orgId = url.searchParams.get("org_id");
  if (!orgId) {
    const { data: mem } = await supa
      .from("organization_members")
      .select("org_id")
      .eq("user_id", au.user.id)
      .maybeSingle();
    orgId = mem?.org_id ?? null;
  }

  if (!orgId) {
    return NextResponse.json(
      { ok: false, error: { code: "BAD_REQUEST", message: "org_id requerido" } },
      { status: 400 }
    );
  }

  let query = supa
    .from("prescription_templates")
    .select("id, org_id, name, notes, items, active, created_at, created_by, doctor_id")
    .eq("org_id", orgId)
    .order("created_at", { ascending: false })
    .limit(200);

  const search = url.searchParams.get("q");
  if (search) {
    query = query.ilike("name", `%${search}%`);
  }

  const { data, error } = await query;
  if (error) {
    return NextResponse.json(
      { ok: false, error: { code: "DB_ERROR", message: error.message } },
      { status: 400 }
    );
  }

  let rows = data ?? [];
  const mine = url.searchParams.get("mine");
  if (mine === "1") {
    rows = rows.filter(
      (tpl) => (tpl.created_by ?? tpl.doctor_id ?? null) === au.user.id
    );
  }

  return NextResponse.json({ ok: true, data: rows, items: rows });
}

export async function POST(req: NextRequest) {
  const supa = await getSupabaseServer();
  const { data: au } = await supa.auth.getUser();
  if (!au?.user) {
    return NextResponse.json(
      { ok: false, error: { code: "UNAUTHORIZED", message: "No autenticado" } },
      { status: 401 }
    );
  }

  const body = (await req.json().catch(() => null)) as TemplateBody | null;
  let orgId = body?.org_id ?? null;
  if (!orgId) {
    const { data: mem } = await supa
      .from("organization_members")
      .select("org_id")
      .eq("user_id", au.user.id)
      .maybeSingle();
    orgId = mem?.org_id ?? null;
  }

  if (!orgId || !body?.name || !Array.isArray(body.items) || body.items.length === 0) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "BAD_REQUEST",
          message: "org_id, name e items requeridos",
        },
      },
      { status: 400 }
    );
  }

  const safeItems = body.items.map((it) => {
    const freq = it.freq ?? it.frequency ?? null;
    return {
      drug: String(it.drug ?? it.drug_name ?? "").slice(0, 200),
      dose: it.dose ? String(it.dose).slice(0, 120) : null,
      route: it.route ? String(it.route).slice(0, 80) : null,
      freq: freq ? String(freq).slice(0, 120) : null,
      frequency: freq ? String(freq).slice(0, 120) : null,
      duration: it.duration ? String(it.duration).slice(0, 120) : null,
      instructions: it.instructions ? String(it.instructions).slice(0, 500) : null,
    };
  });

  const payload: Record<string, any> = {
    org_id: orgId,
    name: String(body.name).slice(0, 200),
    notes: body.notes ? String(body.notes).slice(0, 2000) : null,
    items: safeItems,
    active: body.active ?? true,
    created_by: au.user.id,
    doctor_id: body.doctor_scope === false ? null : au.user.id,
  };

  if (typeof body.specialty !== "undefined") {
    payload.specialty = body.specialty;
  }

  const { data, error } = await supa
    .from("prescription_templates")
    .upsert(payload, { onConflict: "org_id,name" })
    .select("id, org_id, name, notes, items, active, created_at, created_by, doctor_id")
    .single();

  if (error) {
    return NextResponse.json(
      { ok: false, error: { code: "DB_ERROR", message: error.message } },
      { status: 400 }
    );
  }

  return NextResponse.json({ ok: true, data });
}
