import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  const svc = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  const body = await req.json().catch(()=>null);
  const { type, id } = body || {};
  if (!type || !id) return NextResponse.json({ error: "bad_request" }, { status: 400 });

  const { data, error } = await svc.rpc("ensure_document_folio", { p_doc_type: type, p_doc_id: id });
  if (error) return NextResponse.json({ error: "failed" }, { status: 500 });
  return NextResponse.json({ ledger: data });
}
