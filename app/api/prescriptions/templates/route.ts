import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase/server";

/* ---------- Tipos compatibles ---------- */
type TemplateItemInput = {
  drug?: string;
  drug_name?: string;
  dose?: string | null;
  route?: string | null;
  freq?: string | null;
  frequency?: string | null;
  duration?: string | null;
  instructions?: string | null;
};

type LegacyBody = {
  name?: string;
  items?: TemplateItemInput[];
  doctor_scope?: boolean;     // si false -> template “global” (sin doctor_id)
  specialty?: string | null;
};

type ModernBody = {
  org_id?: string | null;
  name?: string;
  notes?: string | null;
  items?: TemplateItemInput[];
  active?: boolean;
  doctor_scope?: boolean;     // compatible con moderno también
  specialty?: string | null;
};

type TemplateBody = LegacyBody & ModernBody;

/* ---------- Helpers ---------- */
function sanitizeItems(items: TemplateItemInput[] = []) {
  return items.map((it) => {
    const freq = it?.freq ?? it?.frequency ?? null;
    const drugName = String(it?.drug ?? it?.drug_name ?? "").slice(0, 200);
    return {
      drug: drugName,
      drug_name: drugName,
      dose: it?.dose ? String(it.dose).slice(0, 120) : null,
      route: it?.route ? String(it.route).slice(0, 80) : null,
      freq: freq ? String(freq).slice(0, 120) : null,       // alias legacy
      frequency: freq ? String(freq).slice(0, 120) : null,  // campo normalizado
      duration: it?.duration ? String(it.duration).slice(0, 120) : null,
      instructions: it?.instructions ? String(it.instructions).slice(0, 500) : null,
    };
  });
}

/* ======================= GET: listar plantillas ======================= */
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

  const search = url.searchParams.get("q") ?? "";
  const mine = url.searchParams.get("mine");

  let query = supa
    .from("prescription_templates")
    .select("id, org_id, name, notes, items, active, created_at, created_by, doctor_id")
    .eq("org_id", orgId)
    .order("created_at", { ascending: false });

  if (search) {
    query = query.ilike("name", `%${search}%`);
  }

  if (mine === "1") {
    // Trae sólo las del usuario: creadas por él o asociadas a su doctor_id
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

/* ======================= POST: crear/actualizar plantilla ======================= */
export async function POST(req: NextRequest) {
  const supa = await getSupabaseServer();
  const { data: au } = await supa.auth.getUser();
  if (!au?.user) {
    return NextResponse.json(
      { ok: false, error: { code: "UNAUTHORIZED", message: "No autenticado" } },
      { status: 401 }
    );
  }

  const rawBody = (await req.json().catch(() => null)) as TemplateBody | null;
  const isLegacy = !!rawBody && ("doctor_scope" in rawBody || !rawBody?.org_id);

  // org_id: del body o por membership
  let orgId = rawBody?.org_id ?? null;
  if (!orgId) {
    const { data: mem } = await supa
      .from("organization_members")
      .select("org_id")
      .eq("user_id", au.user.id)
      .maybeSingle();
    orgId = mem?.org_id ?? null;
  }

  if (!orgId || !rawBody?.name) {
    return NextResponse.json(
      { ok: false, error: { code: "BAD_REQUEST", message: "org_id, name e items requeridos" } },
      { status: 400 }
    );
  }

  const safeItems = sanitizeItems(rawBody.items || []);
  if (safeItems.length === 0) {
    return NextResponse.json(
      { ok: false, error: { code: "BAD_REQUEST", message: "org_id, name e items requeridos" } },
      { status: 400 }
    );
  }

  if (isLegacy) {
    // Crea una plantilla (modo legacy), doctor_scope=false => plantilla “global”
    const payload: Record<string, any> = {
      org_id: orgId,
      doctor_id: rawBody.doctor_scope === false ? null : au.user.id,
      specialty: typeof rawBody.specialty !== "undefined" ? rawBody.specialty : null,
      name: String(rawBody.name).slice(0, 200),
      items: safeItems,
      created_by: au.user.id,
      active: true,
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

    return NextResponse.json({ ok: true, data });
  }

  // Modo moderno: upsert por (org_id, name)
  const payload: Record<string, any> = {
    org_id: orgId,
    name: String(rawBody.name).slice(0, 200),
    notes: rawBody.notes ? String(rawBody.notes).slice(0, 2000) : null,
    items: safeItems,
    active: rawBody.active ?? true,
    created_by: au.user.id,
    doctor_id: rawBody.doctor_scope === false ? null : au.user.id,
  };

  if (typeof rawBody.specialty !== "undefined") {
    payload.specialty = rawBody.specialty;
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
