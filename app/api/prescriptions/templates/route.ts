import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase/server";

type TemplateItemInput = {
  drug?: string;
  drug_name?: string;
  dose?: string;
  route?: string;
  freq?: string;
  frequency?: string;
  duration?: string;
  instructions?: string | null;
};

type LegacyBody = {
  name?: string;
  items?: TemplateItemInput[];
  doctor_scope?: boolean;
  specialty?: string | null;
};

type ModernBody = {
  org_id?: string | null;
  name?: string;
  notes?: string | null;
  items?: TemplateItemInput[];
  active?: boolean;
};

function sanitizeItems(items: TemplateItemInput[] = []) {
  return items.map((it) => ({
    drug: String(it?.drug ?? it?.drug_name ?? "").slice(0, 200),
    drug_name: String(it?.drug ?? it?.drug_name ?? "").slice(0, 200),
    dose: it?.dose ? String(it.dose).slice(0, 120) : null,
    route: it?.route ? String(it.route).slice(0, 80) : null,
    freq: it?.freq ? String(it.freq).slice(0, 120) : it?.frequency ? String(it.frequency).slice(0, 120) : null,
    frequency: it?.frequency ? String(it.frequency).slice(0, 120) : it?.freq ? String(it.freq).slice(0, 120) : null,
    duration: it?.duration ? String(it.duration).slice(0, 120) : null,
    instructions: it?.instructions ? String(it.instructions).slice(0, 500) : null,
  }));
}

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
    orgId = mem?.org_id ?? undefined;
  }

  if (!orgId) {
    return NextResponse.json(
      { ok: false, error: { code: "BAD_REQUEST", message: "org_id requerido" } },
      { status: 400 }
    );
  }

  let query = supa
    .from("prescription_templates")
    .select("id, org_id, name, notes, items, active, doctor_id, created_at, created_by")
    .eq("org_id", orgId)
    .order("created_at", { ascending: false });

  const search = url.searchParams.get("q");
  if (search) {
    query = query.ilike("name", `%${search}%`);
  }

  const mine = url.searchParams.get("mine");
  if (mine === "1") {
    query = query.or(`created_by.eq.${au.user.id},doctor_id.eq.${au.user.id}`);
  }

  const { data, error } = await query.limit(200);
  if (error) {
    return NextResponse.json(
      { ok: false, error: { code: "DB_ERROR", message: error.message } },
      { status: 400 }
    );
  }

  return NextResponse.json({ ok: true, data: data ?? [], items: data ?? [] });
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

  const rawBody = (await req.json().catch(() => null)) as (LegacyBody & ModernBody) | null;
  const isLegacy = !!rawBody && ("doctor_scope" in rawBody || !rawBody?.org_id);
  const orgId = rawBody?.org_id ?? null;

  let effectiveOrgId = orgId;
  if (!effectiveOrgId) {
    const { data: mem } = await supa
      .from("organization_members")
      .select("org_id")
      .eq("user_id", au.user.id)
      .maybeSingle();
    effectiveOrgId = mem?.org_id ?? null;
  }

  if (!effectiveOrgId || !rawBody?.name) {
    return NextResponse.json(
      { ok: false, error: { code: "BAD_REQUEST", message: "org_id, name e items requeridos" } },
      { status: 400 }
    );
  }

  const safeItems = sanitizeItems(rawBody.items || []);
  if (!safeItems.length) {
    return NextResponse.json(
      { ok: false, error: { code: "BAD_REQUEST", message: "org_id, name e items requeridos" } },
      { status: 400 }
    );
  }

  if (isLegacy) {
    const payload: Record<string, any> = {
      org_id: effectiveOrgId,
      doctor_id: rawBody.doctor_scope === false ? null : au.user.id,
      specialty: rawBody.specialty ?? null,
      name: String(rawBody.name).slice(0, 200),
      items: safeItems,
      created_by: au.user.id,
    };

    const { data, error } = await supa
      .from("prescription_templates")
      .insert(payload)
      .select("id, org_id, name, notes, items, active, doctor_id, created_at, created_by")
      .single();

    if (error) {
      return NextResponse.json(
        { ok: false, error: { code: "DB_ERROR", message: error.message } },
        { status: 400 }
      );
    }

    return NextResponse.json({ ok: true, data, item: data });
  }

  const payload = {
    org_id: effectiveOrgId,
    name: String(rawBody.name).slice(0, 200),
    notes: rawBody.notes ? String(rawBody.notes).slice(0, 2000) : null,
    items: safeItems,
    active: rawBody.active ?? true,
    created_by: au.user.id,
  };

  const { data, error } = await supa
    .from("prescription_templates")
    .upsert(payload, { onConflict: "org_id,name" })
    .select("id, org_id, name, notes, items, active, doctor_id, created_at, created_by")
    .single();

  if (error) {
    return NextResponse.json(
      { ok: false, error: { code: "DB_ERROR", message: error.message } },
      { status: 400 }
    );
  }

  return NextResponse.json({ ok: true, data, item: data });
}
