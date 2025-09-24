import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/** Uso: /api/docs/verify?type=prescription&id=<uuid>&code=<verify_code> */
export async function GET(req: Request) {
  const svc = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  const sp = new URL(req.url).searchParams;
  const type = sp.get("type") || "";
  const id = sp.get("id") || "";
  const code = sp.get("code") || "";

  const { data: led } = await svc
    .from("document_ledger")
    .select("*")
    .eq("doc_type", type).eq("doc_id", id).eq("verify_code", code)
    .maybeSingle();

  if (!led) return NextResponse.json({ valid: false });

  let created_at: string | null = null;
  if (type === "prescription") {
    const { data } = await svc.from("prescriptions").select("created_at").eq("id", id).maybeSingle(); created_at = data?.created_at || null;
  } else if (type === "referral") {
    const { data } = await svc.from("referrals").select("created_at").eq("id", id).maybeSingle(); created_at = data?.created_at || null;
  } else if (type === "discharge") {
    const { data } = await svc.from("discharges").select("created_at").eq("id", id).maybeSingle(); created_at = data?.created_at || null;
  } else if (type === "lab_request") {
    const { data } = await svc.from("lab_requests").select("created_at").eq("id", id).maybeSingle(); created_at = data?.created_at || null;
  }

  const revoked = !!led.revoked_at;
  return NextResponse.json({ valid: !revoked, revoked, revoked_at: led.revoked_at || null, folio: led.folio, created_at });
}
