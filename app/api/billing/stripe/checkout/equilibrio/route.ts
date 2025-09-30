import { NextResponse } from "next/server";
import { stripe, getBaseUrl } from "@/lib/billing/stripe";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const { org_id, qty = 1 } = await req.json();
    if (!org_id) return NextResponse.json({ error: "Falta org_id" }, { status: 400 });

    const price = process.env.STRIPE_PRICE_EQUILIBRIO_PRO!;
    if (!price)
      return NextResponse.json({ error: "Falta STRIPE_PRICE_EQUILIBRIO_PRO" }, { status: 400 });

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price, quantity: qty }],
      success_url: `${getBaseUrl()}/ajustes/plan?checkout=success`,
      cancel_url: `${getBaseUrl()}/ajustes/plan?checkout=cancel`,
      metadata: { org_id, module: "equilibrio" },
    });

    return NextResponse.json({ ok: true, url: session.url });
  } catch (e: any) {
    return NextResponse.json({ error: String(e?.message || e) }, { status: 400 });
  }
}
