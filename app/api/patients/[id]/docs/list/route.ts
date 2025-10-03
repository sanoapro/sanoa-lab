import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const supabase = createRouteHandlerClient({ cookies });
  const patient_id = params.id;
  const out: any[] = [];

  // Trae documentos (ajusta limit si lo necesitas)
  const [rx, rf, ds, lr] = await Promise.all([
    supabase
      .from("prescriptions")
      .select("id, created_at, doctor_id")
      .eq("patient_id", patient_id)
      .order("created_at", { ascending: false })
      .limit(200),
    supabase
      .from("referrals")
      .select("id, created_at, doctor_id")
      .eq("patient_id", patient_id)
      .order("created_at", { ascending: false })
      .limit(200),
    supabase
      .from("discharges")
      .select("id, created_at, doctor_id")
      .eq("patient_id", patient_id)
      .order("created_at", { ascending: false })
      .limit(200),
    supabase
      .from("lab_requests")
      .select("id, created_at, requested_by")
      .eq("patient_id", patient_id)
      .order("created_at", { ascending: false })
      .limit(200)
      .maybeSingle()
      .then((r: any) => {
        // si no existe tabla o RLS, ignora silencioso
        if (!r || (r as any).error) return { data: [] as any[] };
        return {
          data: Array.isArray((r as any).data)
            ? (r as any).data
            : (r as any).data
              ? [(r as any).data]
              : [],
        };
      }),
  ] as any);

  const push = (rows: any[], type: string, doctorKey: string) => {
    for (const r of rows || [])
      out.push({ type, id: r.id, created_at: r.created_at, doctor_id: r[doctorKey] });
  };
  push(rx?.data || [], "prescription", "doctor_id");
  push(rf?.data || [], "referral", "doctor_id");
  push(ds?.data || [], "discharge", "doctor_id");
  push(lr?.data || [], "lab_request", "requested_by");

  // Folios/verify/revocado
  const allIdsByType = out.reduce((acc: any, r: any) => {
    (acc[r.type] ||= []).push(r.id);
    return acc;
  }, {});
  const ledByKey = new Map<string, any>();

  for (const t of Object.keys(allIdsByType)) {
    const ids = allIdsByType[t];
    if (!ids.length) continue;
    const { data } = await supabase
      .from("document_ledger")
      .select("doc_type, doc_id, folio, verify_code, revoked_at")
      .eq("doc_type", t)
      .in("doc_id", ids);
    for (const row of data || []) ledByKey.set(`${row.doc_type}#${row.doc_id}`, row);
  }

  for (const r of out) {
    const k = `${r.type}#${r.id}`;
    const led = ledByKey.get(k);
    r.folio = led?.folio || null;
    r.verify_code = led?.verify_code || null;
    r.revoked_at = led?.revoked_at || null;
  }

  out.sort((a: any, b: any) => b.created_at.localeCompare(a.created_at));
  return NextResponse.json({ items: out });
}
