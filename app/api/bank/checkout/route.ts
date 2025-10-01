import { NextResponse } from "next/server";
import { stripe } from "@/lib/billing/stripe";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const { sku, org_id, success_url = `${process.env.NEXT_PUBLIC_SITE_URL}/banco?ok=1`, cancel_url = `${process.env.NEXT_PUBLIC_SITE_URL}/banco?c=1` } = body ?? {};
  if (!sku || !org_id) return NextResponse.json({ error: "sku y org_id requeridos" }, { status: 400 });

  try {
    const client = stripe;
    if (!client) {
      return NextResponse.json(
        { error: "Stripe no está configurado" },
        { status: 500 },
      );
    }
    const session = await client.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: sku, quantity: 1 }],
      allow_promotion_codes: true,
      metadata: { org_id },
      success_url,
      cancel_url
    });
    return NextResponse.json({ ok: true, url: session.url }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
