import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";

/**
 * GET /api/lab/requests/list?org_id=UUID[&patient_id=UUID][&status=uploaded|awaiting_upload][&limit=100]
 *
 * Respuesta:
 *   { ok:true, rows:[{ id, org_id, patient_id, title, status, due_at, created_at, lab_results:[{ path }] }] }
 * - Incluye la relación lab_results(path) para saber si ya hay archivo subido.
 * - Requiere sesión válida (auth.user) y org_id.
 */
export async function GET(req: Request) {
  const supa = createRouteHandlerClient({ cookies });

  // Autenticación (evita filtrar datos a anónimos)
  const { data: auth } = await supa.auth.getUser();
  if (!auth.user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const org_id = searchParams.get("org_id") || "";
  const patient_id = searchParams.get("patient_id") || undefined;
  const status = searchParams.get("status") || undefined;

  // Límite seguro (1–200, por defecto 100)
  const limitRaw = Number(searchParams.get("limit") || 100);
  const limit = Number.isFinite(limitRaw) ? Math.min(200, Math.max(1, limitRaw)) : 100;

  if (!org_id) {
    return NextResponse.json({ error: "org_id requerido" }, { status: 400 });
  }

  // Selecciona columnas + relación con resultados (para saber si hay archivo)
  let q = supa
    .from("lab_requests")
    .select(
      `
      id, org_id, patient_id, title, status, due_at, created_at,
      lab_results ( path )
    `,
    )
    .eq("org_id", org_id)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (patient_id) q = q.eq("patient_id", patient_id);
  if (status) q = q.eq("status", status as any);

  const { data, error } = await q;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true, rows: data ?? [] });
}
