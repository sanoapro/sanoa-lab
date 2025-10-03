// MODE: session (user-scoped, cookies)
// POST /api/modules/sonrisa/quotes/create
// { org_id, patient_id, currency?, items:[{ description, qty, unit_price_cents, treatment_id? }], notes? }
import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const supa = await getSupabaseServer();
  const { data: u } = await supa.auth.getUser();
  if (!u?.user) {
    return NextResponse.json(
      { ok: false, error: { code: "UNAUTHORIZED", message: "No autenticado" } },
      { status: 401 },
    );
  }

  const body = (await req.json().catch(() => null)) as {
    org_id?: string;
    patient_id?: string;
    currency?: string;
    notes?: string;
    items?: Array<{
      description?: string;
      qty?: number;
      unit_price_cents?: number;
      treatment_id?: string | null;
    }>;
  };
  if (!body?.org_id || !body?.patient_id || !Array.isArray(body.items) || !body.items.length) {
    return NextResponse.json(
      {
        ok: false,
        error: { code: "BAD_REQUEST", message: "org_id, patient_id e items requeridos" },
      },
      { status: 400 },
    );
  }

  const currency = (body.currency || "mxn").toLowerCase();

  const { data: quote, error: e1 } = await supa
    .from("sonrisa_quotes")
    .insert({
      org_id: body.org_id,
      patient_id: body.patient_id,
      currency,
      status: "draft",
      notes: body.notes ? String(body.notes).slice(0, 2000) : null,
      created_by: u.user.id,
    })
    .select("id")
    .single();

  if (e1) {
    return NextResponse.json(
      { ok: false, error: { code: "DB_ERROR", message: e1.message } },
      { status: 400 },
    );
  }

  const items = body.items.map((it: any) => ({
    quote_id: quote!.id,
    treatment_id: it.treatment_id ?? null,
    description: String(it.description || "").slice(0, 300),
    qty: Math.max(1, Math.floor(Number(it.qty || 1))),
    unit_price_cents: Math.max(0, Math.floor(Number(it.unit_price_cents || 0))),
  }));

  const { error: e2 } = await supa.from("sonrisa_quote_items").insert(items);
  if (e2) {
    return NextResponse.json(
      { ok: false, error: { code: "DB_ERROR", message: e2.message } },
      { status: 400 },
    );
  }

  // total se recalcula con trigger. Devolvemos datos resumidos:
  const { data: q2, error: e3 } = await supa
    .from("sonrisa_quotes")
    .select("id, org_id, patient_id, status, currency, total_cents, created_at")
    .eq("id", quote!.id)
    .single();

  if (e3) {
    return NextResponse.json(
      { ok: false, error: { code: "DB_ERROR", message: e3.message } },
      { status: 400 },
    );
  }
  return NextResponse.json({ ok: true, data: q2 });
}
