// MODE: session (user-scoped, cookies)
// POST /api/modules/sonrisa/quotes/stripe/checkout
// { org_id, quote_id, success_url, cancel_url }
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

  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret) {
    return NextResponse.json(
      { ok: false, error: { code: "NOT_CONFIGURED", message: "Stripe no configurado" } },
      { status: 501 },
    );
  }

  const body = (await req.json().catch(() => null)) as {
    org_id?: string;
    quote_id?: string;
    success_url?: string;
    cancel_url?: string;
  };
  if (!body?.org_id || !body?.quote_id || !body?.success_url || !body?.cancel_url) {
    return NextResponse.json(
      {
        ok: false,
        error: { code: "BAD_REQUEST", message: "org_id, quote_id, success_url y cancel_url requeridos" },
      },
      { status: 400 },
    );
  }

  // obtener total
  const { data: q, error: e1 } = await supa
    .from("sonrisa_quotes")
    .select("id, org_id, total_cents, currency, status")
    .eq("id", body.quote_id)
    .eq("org_id", body.org_id)
    .single();

  if (e1 || !q) {
    return NextResponse.json(
      { ok: false, error: { code: "NOT_FOUND", message: "Presupuesto no encontrado" } },
      { status: 404 },
    );
  }
  if (!q.total_cents || q.total_cents <= 0) {
    return NextResponse.json(
      { ok: false, error: { code: "EMPTY_TOTAL", message: "Total inválido" } },
      { status: 400 },
    );
  }

  // Crear checkout
  const stripe = new (await import("stripe")).default(secret, { apiVersion: "2024-06-20" });
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    success_url: body.success_url,
    cancel_url: body.cancel_url,
    currency: (q.currency || "mxn").toLowerCase(),
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: (q.currency || "mxn").toLowerCase(),
          product_data: { name: `Presupuesto dental #${q.id}` },
          unit_amount: q.total_cents,
        },
      },
    ],
    metadata: { quote_id: q.id, org_id: q.org_id, module: "sonrisa" },
  });

  return NextResponse.json({ ok: true, data: { id: session.id, url: session.url } });
}
