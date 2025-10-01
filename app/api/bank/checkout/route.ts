export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { z } from "zod";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2024-06-20" });

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

export async function POST(req: NextRequest) {
  try {
    const { org_id, product, return_path } = Body.parse(await req.json());
    const price = PRICE_ENV[product];
    if (!price) return NextResponse.json({ error: `Falta PRICE para ${product}` }, { status: 400 });

    const base = process.env.NEXT_PUBLIC_SITE_URL ?? req.nextUrl.origin;

    const session = await stripe.checkout.sessions.create({
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
