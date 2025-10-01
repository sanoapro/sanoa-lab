// /workspaces/sanoa-lab/app/api/billing/stripe/webhook/route.ts
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { stripe } from "@/lib/billing/stripe";
import { createServiceClient } from "@/lib/supabase/service";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const sig = req.headers.get("stripe-signature");
  if (!sig) return NextResponse.json({ error: "Missing Stripe-Signature header" }, { status: 400 });

  const whsec = process.env.STRIPE_WEBHOOK_SECRET;
  if (!whsec) return NextResponse.json({ error: "Missing STRIPE_WEBHOOK_SECRET in env" }, { status: 500 });

  const client = stripe;
  if (!client) return NextResponse.json({ error: "Stripe no está configurado" }, { status: 500 });

  const payload = await req.text();
  let event: Stripe.Event;
  try {
    event = client.webhooks.constructEvent(payload, sig, whsec);
  } catch (err: any) {
    return NextResponse.json({ error: `Invalid signature: ${err.message}` }, { status: 400 });
  }

  try {
    if (event.type === "checkout.session.completed") {
      const cs = event.data.object as Stripe.Checkout.Session;
      const org_id = cs.metadata?.org_id;
      const product = cs.metadata?.product as "mente" | "pulso" | "sonrisa" | "equilibrio" | undefined;
      const customer = (cs.customer as string) ?? undefined;
      const subscription = (cs.subscription as string) ?? undefined;

      if (org_id) {
        const supa = createServiceClient();

        if (product) {
          const patch: Record<string, unknown> = { org_id, [product]: true };
          await supa.from("org_features").upsert(patch, { onConflict: "org_id" });
        }

        await supa
          .from("org_billing")
          .upsert(
            { org_id, stripe_customer_id: customer, stripe_subscription_id: subscription },
            { onConflict: "org_id" },
          );
      }
    }

    return NextResponse.json({ received: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "server_error" }, { status: 500 });
  }
}
