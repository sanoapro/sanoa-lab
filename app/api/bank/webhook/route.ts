export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createServiceClient } from "@/lib/supabase/service";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2024-06-20" });
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(req: NextRequest) {
  let event: Stripe.Event;
  const raw = await req.text();
  const sig = req.headers.get("stripe-signature") ?? "";

  try {
    if (!endpointSecret) throw new Error("STRIPE_WEBHOOK_SECRET no configurado");
    event = stripe.webhooks.constructEvent(raw, sig, endpointSecret);
  } catch (err: any) {
    return new NextResponse(`Webhook Error: ${err.message}`, { status: 400 });
  }

  try {
    const supa = createServiceClient();

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const org_id = (session.metadata as any)?.org_id;
      const feature = (session.metadata as any)?.feature;

      if (org_id && feature) {
        const patch: Record<string, any> = { org_id, [feature]: true, updated_at: new Date().toISOString() };
        await supa.from("org_features").upsert(patch, { onConflict: "org_id" });
      }
    }

    if (event.type === "invoice.paid") {
      // no-op (ya quedó activo en checkout)
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "server_error" }, { status: 500 });
  }
}
