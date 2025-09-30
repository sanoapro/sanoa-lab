// app/api/agreements/status/route.ts
// MODE: session (user-scoped, cookies)
// GET ?org_id=...&patient_id=...
import { NextRequest } from "next/server";
import { getSupabaseServer } from "@/lib/supabase/server";
import { jsonError, jsonOk } from "@/lib/http/validate";

export async function GET(req: NextRequest) {
  const supa = await getSupabaseServer();
  const { searchParams } = new URL(req.url);
  const org_id = searchParams.get("org_id");
  const patient_id = searchParams.get("patient_id");

  if (!org_id) return jsonError("BAD_REQUEST", "Falta org_id", 400);

  const { data: auth } = await supa.auth.getUser();
  const specialist_id = auth?.user?.id || null;
  if (!specialist_id) return jsonError("UNAUTHORIZED", "Sesión requerida", 401);

  // E <-> Plataforma
  const { count: spCount } = await supa
    .from("agreements_acceptances")
    .select("*", { count: "exact", head: true })
    .eq("org_id", org_id)
    .eq("specialist_id", specialist_id)
    .eq("contract_type", "specialist_platform")
    .eq("status", "accepted");

  // E <-> P (si se pidió patient_id)
  let spc = false;
  if (patient_id) {
    const { count: pairCount } = await supa
      .from("agreements_acceptances")
      .select("*", { count: "exact", head: true })
      .eq("org_id", org_id)
      .eq("specialist_id", specialist_id)
      .eq("patient_id", patient_id)
      .eq("contract_type", "specialist_patient")
      .eq("status", "accepted");
    spc = (pairCount || 0) > 0;
  }

  return jsonOk({
    specialist_platform: (spCount || 0) > 0,
    specialist_patient: spc,
  });
}
