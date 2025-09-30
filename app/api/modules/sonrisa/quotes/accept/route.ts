// MODE: session (user-scoped, cookies)
// POST /api/modules/sonrisa/quotes/accept
// { org_id, quote_id, signature_data_url }
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
    quote_id?: string;
    signature_data_url?: string;
  };
  if (!body?.org_id || !body?.quote_id || !body?.signature_data_url) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "BAD_REQUEST",
          message: "org_id, quote_id y signature_data_url son requeridos",
        },
      },
      { status: 400 },
    );
  }

  // Validar existencia y pertenencia
  const { data: quote, error: e1 } = await supa
    .from("sonrisa_quotes")
    .select("id, org_id, status")
    .eq("id", body.quote_id)
    .eq("org_id", body.org_id)
    .single();

  if (e1) {
    return NextResponse.json(
      { ok: false, error: { code: "NOT_FOUND", message: "Presupuesto no encontrado" } },
      { status: 404 },
    );
  }
  if (quote!.status === "accepted" || quote!.status === "paid") {
    return NextResponse.json(
      { ok: false, error: { code: "ALREADY_ACCEPTED", message: "Ya aceptado/pagado" } },
      { status: 409 },
    );
  }

  const { data, error } = await supa
    .from("sonrisa_quotes")
    .update({
      status: "accepted",
      signed_at: new Date().toISOString(),
      signed_by: u.user.id,
      signature_data_url: String(body.signature_data_url).slice(0, 1_000_000), // límite prudente
    })
    .eq("id", body.quote_id)
    .select("id, status, signed_at, total_cents")
    .single();

  if (error) {
    return NextResponse.json(
      { ok: false, error: { code: "DB_ERROR", message: error.message } },
      { status: 400 },
    );
  }
  return NextResponse.json({ ok: true, data });
}
