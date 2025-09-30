// MODE: session (user-scoped, cookies)
// GET /api/patients/autocomplete?org_id=<uuid>&q=<text>&scope=mine|org
import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const supa = await getSupabaseServer();
  const { data: u } = await supa.auth.getUser();
  if (!u?.user) {
    return NextResponse.json(
      { ok: false, error: { code: "UNAUTHORIZED", message: "No autenticado" } },
      { status: 401 },
    );
  }

  const url = new URL(req.url);
  const org_id = url.searchParams.get("org_id");
  const q = (url.searchParams.get("q") || "").trim();
  const scope = (url.searchParams.get("scope") || "mine").toLowerCase();
  if (!org_id || !q) {
    return NextResponse.json(
      { ok: false, error: { code: "BAD_REQUEST", message: "org_id y q requeridos" } },
      { status: 400 },
    );
  }

  // Intentar RPC (recomendado por rendimiento y precisión de "mis pacientes")
  const { data: rpc, error: erpc } = await supa.rpc("patients_autocomplete", {
    org: org_id,
    q,
    uid: u.user.id,
    show_org: scope === "org",
  });
  if (!erpc && rpc) {
    return NextResponse.json({ ok: true, data: rpc });
  }

  // Fallback simple si RPC aún no está disponible: buscar en tabla patients (existe en la mayoría de proyectos)
  // Nota: esto no impone "sólo mis pacientes" sin el esquema; el RPC es lo correcto a activar.
  const { data, error } = await supa
    .from("patients")
    .select("id, full_name")
    .eq("org_id", org_id)
    .ilike("full_name", `%${q}%`)
    .limit(20);

  if (error) {
    return NextResponse.json(
      { ok: false, error: { code: "DB_ERROR", message: error.message } },
      { status: 400 },
    );
  }
  return NextResponse.json({
    ok: true,
    data: (data || []).map((x) => ({ id: x.id, label: x.full_name })),
  });
}
