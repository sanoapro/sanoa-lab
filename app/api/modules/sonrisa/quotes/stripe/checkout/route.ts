// MODE: session (user-scoped, cookies)
// POST /api/modules/sonrisa/quotes/stripe/checkout
// { org_id, quote_id, success_url?, cancel_url? }
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseServer } from "@/lib/supabase/server";
import { stripe, getBaseUrl } from "@/lib/billing/stripe";

const Body = z.object({
  org_id: z.string().uuid(),
  quote_id: z.string().uuid(),
  success_url: z.string().optional(), // puede ser URL completa o path
  cancel_url: z.string().optional(),  // puede ser URL completa o path
});

function normalizeUrl(input: string | undefined, fallbackPath: string) {
  const base = getBaseUrl();
  const candidate = (input && input.trim()) || fallbackPath;
  if (/^https?:\/\//i.test(candidate)) return candidate;
  const path = candidate.startsWith("/") ? candidate : `/${candidate}`;
  return `${base}${path}`;
}

export async function POST(req: NextRequest) {
  // Autenticación de sesión
  const supa = await getSupabaseServer();
  const { data: u } = await supa.auth.getUser();
  if (!u?.user) {
    return NextResponse.json(
      { ok: false, error: { code: "UNAUTHORIZED", message: "No autenticado" } },
      { status: 401 },
    );
  }

  // Stripe configurado
  if (!stripe) {
    return NextResponse.json(
      { ok: false, error: { code: "NOT_CONFIGURED", message: "Stripe no configurado" } },
      { status: 501 },
    );
  }

  // Body
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: { code: "BAD_REQUEST", message: "Parámetros inválidos" } },
      { status: 400 },
    );
  }
  const { org_id, quote_id, success_url, cancel_url } = parsed.data;

  // Cargar presupuesto
  const { data: q, error: e1 } = await supa
    .from("sonrisa_quotes")
    .select("id, org_id, total_cents, currency, status")
    .eq("id", quote_id)
    .eq("org_id", org_id)
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

  // URLs normalizadas
  const successUrl = normalizeUrl(success_url, "/banco/ajustes?status=success");
  const cancelUrl = normalizeUrl(cancel_url, "/banco/ajustes?status=cancel");

  // Crear sesión de Checkout
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    success_url: successUrl,
    cancel_url: cancelUrl,
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
