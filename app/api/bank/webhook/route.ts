export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";
import { stripe } from "@/lib/billing/stripe";
import { createServiceClient } from "@/lib/supabase/service";

export async function POST(req: NextRequest) {
  // Validación de configuración
  if (!stripe) {
    return NextResponse.json(
      { error: "Stripe no configurado (STRIPE_SECRET_KEY faltante)" },
      { status: 501 },
    );
  }

  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET || "";
  if (!endpointSecret) {
    return NextResponse.json(
      { error: "Webhook secret no configurado (STRIPE_WEBHOOK_SECRET faltante)" },
      { status: 501 },
    );
  }

  // Construcción del evento con el cuerpo *sin parsear*
  let event: Stripe.Event;
  try {
    const raw = await req.text();
    const sig = req.headers.get("stripe-signature") ?? "";
    event = stripe.webhooks.constructEvent(raw, sig, endpointSecret);
  } catch (err: any) {
    return NextResponse.json({ error: `Webhook Error: ${err?.message || "invalid signature"}` }, { status: 400 });
  }

  try {
    const supa = createServiceClient();

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const md = session.metadata as Record<string, string> | null | undefined;
      const org_id = md?.org_id ?? undefined;
      const product = md?.feature as
        | "mente"
        | "pulso"
        | "sonrisa"
        | "equilibrio"
        | undefined;

      if (org_id && product) {
        const row: any = {
          org_id,
          feature_id: product,
          source: "stripe",
          equilibrio: product === "equilibrio" ? true : undefined,
          mente: product === "mente" ? true : undefined,
          pulso: product === "pulso" ? true : undefined,
          sonrisa: product === "sonrisa" ? true : undefined,
        };
        await supa.from("org_features").upsert(row, { onConflict: "org_id,feature_id" });
      }
    }

    if (event.type === "invoice.paid") {
      // no-op: la activación se hace al completar checkout
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "server_error" }, { status: 500 });
  }
}
