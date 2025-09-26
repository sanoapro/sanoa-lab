// /workspaces/sanoa-lab/app/api/billing/stripe/webhook/route.ts
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { stripe, PRICE_TO_FEATURES } from "@/lib/billing/stripe";
import { createServiceClient } from "@/lib/supabase/service";

export const runtime = "nodejs";

function ok() { return NextResponse.json({ received: true }); }
function bad(msg: string, code = 400) { return NextResponse.json({ error: msg }, { status: code }); }

export async function POST(req: Request) {
  const sig = req.headers.get("stripe-signature");
  if (!sig) return bad("Missing Stripe-Signature header");

  const whsec = process.env.STRIPE_WEBHOOK_SECRET;
  if (!whsec) return bad("Missing STRIPE_WEBHOOK_SECRET in env", 500);

  const payload = await req.text();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(payload, sig, whsec);
  } catch (err: any) {
    return bad(`Invalid signature: ${err.message}`);
  }

  // ⚙️ DB client sólo si lo necesitamos
  const supa = createServiceClient();

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const s = event.data.object as Stripe.Checkout.Session;
        // metadata recomendada: org_id, purpose, price_id
        const orgId = (s.metadata?.org_id as string) || null;
        const priceId = (s.metadata?.price_id as string) || (s.subscription ? undefined : undefined);

        // Si fue “add funds” (one-off): carga en ledger
        if (s.mode === "payment" && s.payment_status === "paid") {
          const amount = s.amount_total ?? 0;
          if (orgId && amount > 0) {
            // Inserta en un ledger (si lo tienes). Envuelto en try/catch por si aún no existe.
            await supa
              .from("bank_ledger")
              .insert({
                org_id: orgId,
                type: "credit",
                source: "stripe_checkout",
                amount_cents: amount,
                currency: s.currency?.toUpperCase() || "MXN",
                external_id: s.id,
                note: "Recarga vía Stripe Checkout",
              });
          }
        }

        // Si fue suscripción: habilita feature por price_id
        if (s.mode === "subscription") {
          const p = priceId ?? (s.line_items?.data?.[0]?.price?.id as string | undefined);
          const feat = p ? PRICE_TO_FEATURES[p] : undefined;
          if (orgId && feat?.feature_key) {
            await supa.from("org_features").upsert(
              { org_id: orgId, feature_id: feat.feature_key, enabled: true },
              { onConflict: "org_id,feature_id" }
            );
          }
        }
        break;
      }

      case "invoice.payment_succeeded": {
        // Renovación de suscripción: podrías marcar “activo”/extender vigencia
        break;
      }

      case "invoice.payment_failed": {
        // Podrías notificar suspensión o reintentos
        break;
      }

      case "payment_intent.succeeded": {
        // Cobro one-off (e.g. add funds desde PaymentIntent directo)
        const pi = event.data.object as Stripe.PaymentIntent;
        const orgId = (pi.metadata?.org_id as string) || null;
        if (orgId && pi.amount_received) {
          await supa.from("bank_ledger").insert({
            org_id: orgId,
            type: "credit",
            source: "stripe_pi",
            amount_cents: pi.amount_received,
            currency: (pi.currency || "mxn").toUpperCase(),
            external_id: pi.id,
            note: pi.description ?? "Recarga vía Payment Intent",
          });
        }
        break;
      }

      case "charge.refunded": {
        // Reflejar reembolso como débito en ledger
        const ch = event.data.object as Stripe.Charge;
        const orgId = (ch.metadata?.org_id as string) || null;
        const refunded = ch.amount_refunded ?? 0;
        if (orgId && refunded > 0) {
          await supa.from("bank_ledger").insert({
            org_id: orgId,
            type: "debit",
            source: "stripe_refund",
            amount_cents: refunded,
            currency: (ch.currency || "mxn").toUpperCase(),
            external_id: ch.id,
            note: "Reembolso",
          });
        }
        break;
      }

      // customer.subscription.created/updated/deleted
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted":
      default:
        // No-op por ahora
        break;
    }
  } catch (e: any) {
    // No rompemos el 2xx para que Stripe no reintente indefinidamente si fue un tema de modelo
    console.error("[stripe webhook] handler error:", e?.message);
  }

  return ok();
}
