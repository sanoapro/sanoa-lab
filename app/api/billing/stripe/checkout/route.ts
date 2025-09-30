import { NextResponse } from "next/server";
import { stripe, getBaseUrl } from "@/lib/billing/stripe";

export const runtime = "nodejs"; // obligatorio para Stripe SDK

export async function POST(req: Request) {
  try {
    const { org_id, price_id, qty = 1 } = await req.json();
    if (!org_id || !price_id) {
      return NextResponse.json({ error: "Faltan org_id o price_id" }, { status: 400 });
    }

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: price_id, quantity: qty }],
      success_url: `${getBaseUrl()}/ajustes?checkout=success`,
      cancel_url: `${getBaseUrl()}/ajustes?checkout=cancel`,
      metadata: { org_id },
    });

    return NextResponse.json({ ok: true, url: session.url });
  } catch (e: any) {
    return NextResponse.json({ error: String(e?.message || e) }, { status: 400 });
  }
}
