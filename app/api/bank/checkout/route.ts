export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseServer } from "@/lib/supabase/server";
import { stripe, getBaseUrl } from "@/lib/billing/stripe";

const Body = z.object({
  org_id: z.string().uuid(),
  product: z.enum(["mente", "pulso", "sonrisa", "equilibrio"]),
  return_path: z.string().default("/banco"),
});

const PRICE_ENV: Record<string, string | undefined> = {
  mente: process.env.STRIPE_PRICE_MENTE,
  pulso: process.env.STRIPE_PRICE_PULSO,
  sonrisa: process.env.STRIPE_PRICE_SONRISA,
  equilibrio: process.env.STRIPE_PRICE_EQUILIBRIO,
};

function stripeNotConfigured() {
  return !process.env.STRIPE_SECRET_KEY || !process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || !stripe;
}

export async function GET(req: NextRequest) {
  const product = req.nextUrl.searchParams.get("product") ?? "mente";

  if (stripeNotConfigured()) {
    return NextResponse.json(
      {
        error:
          "Stripe no configurado. Define STRIPE_SECRET_KEY/NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY.",
      },
      { status: 501 },
    );
  }

  const supabase = await getSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  // TODO: crea la sesión de Checkout según tu modelo de productos/planes.
  return NextResponse.json({ ok: true, product, href: "/banco" });
}

export async function POST(req: NextRequest) {
  if (stripeNotConfigured()) {
    return NextResponse.json(
      {
        error:
          "Stripe no configurado. Define STRIPE_SECRET_KEY/NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY.",
      },
      { status: 501 },
    );
  }

  try {
    const { org_id, product, return_path } = Body.parse(await req.json());
    const price = PRICE_ENV[product];
    if (!price) return NextResponse.json({ error: `Falta PRICE para ${product}` }, { status: 400 });

    const base = process.env.NEXT_PUBLIC_SITE_URL ?? getBaseUrl();
    const stripeClient = stripe!;

    const session = await stripeClient.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price, quantity: 1 }],
      success_url: `${base}${return_path}?success=1`,
      cancel_url: `${base}${return_path}?canceled=1`,
      metadata: { org_id, product },
    });

    return NextResponse.json({ url: session.url });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "server_error" }, { status: 500 });
  }
}
