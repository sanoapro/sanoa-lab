import { NextResponse } from "next/server";
import { stripe, getBaseUrl } from "@/lib/billing/stripe";
import { createServiceClient } from "@/lib/supabase/service";

export const runtime = "nodejs";
const CURRENCY = "mxn"; // ajusta si requieres otra

export async function POST(req: Request) {
  const supa = createServiceClient();
  try {
    const { org_id, amount_cents } = await req.json();
    if (!org_id) return NextResponse.json({ error: "Falta org_id" }, { status: 400 });
    const amount = Number(amount_cents);
    if (!Number.isFinite(amount) || amount < 5000) {
      // mínimo 50.00 MXN
      return NextResponse.json({ error: "Monto mínimo 50.00" }, { status: 400 });
    }

    // Asegura customer
    let customerId: string | undefined;
    const { data: sub } = await supa
      .from("org_subscriptions")
      .select("stripe_customer_id")
      .eq("org_id", org_id)
      .maybeSingle();
    if (sub?.stripe_customer_id) {
      customerId = sub.stripe_customer_id;
    } else {
      const c = await stripe.customers.create({ metadata: { org_id } });
      customerId = c.id;
      await supa
        .from("org_subscriptions")
        .upsert({ org_id, stripe_customer_id: customerId }, { onConflict: "org_id" });
    }

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer: customerId,
      success_url: `${getBaseUrl()}/banco?deposit=success`,
      cancel_url: `${getBaseUrl()}/banco?deposit=cancel`,
      line_items: [
        {
          price_data: {
            currency: CURRENCY,
            product_data: { name: "Sanoa Bank — Depósito" },
            unit_amount: amount,
          },
          quantity: 1,
        },
      ],
      payment_intent_data: {
        metadata: { org_id, type: "deposit" },
      },
      metadata: { org_id, kind: "bank_deposit" },
    });

    return NextResponse.json({ ok: true, url: session.url });
  } catch (e: any) {
    return NextResponse.json({ error: String(e?.message || e) }, { status: 400 });
  }
}
