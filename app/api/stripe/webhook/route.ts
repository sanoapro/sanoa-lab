export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";
import { stripe } from "@/lib/billing/stripe";
import { createServiceClient } from "@/lib/supabase/service";

export async function POST(req: NextRequest) {
  // Validaciones de configuración
  const sig = req.headers.get("stripe-signature");
  const secret = process.env.STRIPE_WEBHOOK_SECRET || "";

  if (!stripe) {
    return NextResponse.json(
      { error: "Stripe no configurado (STRIPE_SECRET_KEY faltante)" },
      { status: 501 },
    );
  }
  if (!secret) {
    return NextResponse.json(
      { error: "Webhook secret no configurado (STRIPE_WEBHOOK_SECRET faltante)" },
      { status: 501 },
    );
  }
  if (!sig) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    // Stripe requiere el cuerpo sin parsear
    const raw = await req.text();
    event = stripe.webhooks.constructEvent(raw, sig, secret);
  } catch (e: any) {
    return NextResponse.json({ error: `Invalid signature: ${e?.message || "unknown"}` }, { status: 400 });
  }

  try {
    if (event.type === "checkout.session.completed") {
      const cs = event.data.object as Stripe.Checkout.Session;
      const org_id = cs.metadata?.org_id;
      const product = cs.metadata?.product as "mente" | "pulso" | "sonrisa" | "equilibrio" | undefined;

      if (org_id && product) {
        const supa = createServiceClient();
        // upsert en org_features activando la bandera del producto
        await supa
          .from("org_features")
          .upsert({ org_id, [product]: true }, { onConflict: "org_id" });
      }
    }

    // Puedes manejar más tipos (invoice.paid, customer.subscription.updated, etc.) aquí si lo necesitas

    return NextResponse.json({ received: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "server_error" }, { status: 500 });
  }
}
