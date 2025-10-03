// MODE: session (user-scoped, cookies)
// GET /api/patients/autocomplete?org_id=<uuid>&q=<text>&scope=mine|org
import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase/server";

type RpcRow = { id: string; label: string };
type PatientRow = { id: string; full_name: string | null };
type Scope = "mine" | "org";

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
  const scope: Scope = ((url.searchParams.get("scope") || "mine").toLowerCase() as Scope) ?? "mine";

  if (!org_id || !q) {
    return NextResponse.json(
      { ok: false, error: { code: "BAD_REQUEST", message: "org_id y q requeridos" } },
      { status: 400 },
    );
  }

  // Intentar RPC (más eficiente)
  const { data: rpc, error: erpc } = await supa.rpc("patients_autocomplete", {
    org: org_id,
    q,
    uid: u.user.id,
    show_org: scope === "org",
  });

  if (!erpc && rpc) {
    // asumimos que RPC entrega [{ id, label }]
    return NextResponse.json({ ok: true, data: rpc as RpcRow[] });
  }

  // Fallback: buscar en `patients`
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

  const list = (data ?? []).map((row: PatientRow) => ({
    id: row.id,
    label: row.full_name ?? "",
  }));

  return NextResponse.json({ ok: true, data: list });
}
