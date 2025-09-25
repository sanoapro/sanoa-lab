import { NextResponse } from 'next/server';
import { stripe, PRICE_TO_FEATURES } from '@/lib/billing/stripe';
import { createServiceClient } from '@/lib/supabase/service';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  const sig = req.headers.get('stripe-signature') || '';
  const secret = process.env.STRIPE_WEBHOOK_SECRET!;
  const rawBody = await req.text();

  let event: any;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, secret);
  } catch (err:any) {
    return NextResponse.json({ error: `Firma inválida: ${err.message}` }, { status: 400 });
  }

  const supa = createServiceClient();

  try {
    // ========== CHECKOUT (suscripción) ==========
    if (event.type === 'checkout.session.completed') {
      const s = event.data.object;
      const org_id = s.metadata?.org_id;
      const customer = s.customer as string | undefined;
      const subscriptionId = s.subscription as string | undefined;

      if (subscriptionId) {
        const sub = await stripe.subscriptions.retrieve(subscriptionId);
        const prices = sub.items.data.map(i => i.price.id);
        await enableFeaturesForPrices(supa, org_id, prices);

        if (org_id) {
          await supa.from('org_subscriptions').upsert({
            org_id,
            stripe_customer_id: customer || null,
            stripe_status: sub.status,
            current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
          }, { onConflict: 'org_id' });
        }
      }
    }

    // ========== SUBSCRIPTION UPDATE ==========
    if (event.type === 'customer.subscription.updated' || event.type === 'customer.subscription.created') {
      const sub = event.data.object;
      const customerId = sub.customer as string;

      const { data: os } = await supa
        .from('org_subscriptions').select('org_id').eq('stripe_customer_id', customerId).maybeSingle();

      if (os?.org_id) {
        const prices = (sub.items?.data || []).map((i:any)=> i.price.id);
        await enableFeaturesForPrices(supa, os.org_id, prices);

        await supa.from('org_subscriptions').upsert({
          org_id: os.org_id,
          stripe_customer_id: customerId,
          stripe_status: sub.status,
          current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
        }, { onConflict: 'org_id' });
      }
    }

    // ========== INVOICES (débitos de plan) ==========
    if (event.type === 'invoice.paid' || event.type === 'invoice.payment_succeeded') {
      const inv = event.data.object;
      const customerId = inv.customer as string | undefined;
      if (customerId) {
        const { data: os } = await supa
          .from('org_subscriptions').select('org_id').eq('stripe_customer_id', customerId).maybeSingle();
        const org_id = os?.org_id;

        if (org_id) {
          // Guarda copia de invoice
          await supa.from('org_invoices').upsert({
            org_id,
            stripe_invoice_id: inv.id,
            status: inv.status,
            amount_due_cents: inv.amount_paid ?? inv.amount_due ?? 0,
            currency: inv.currency || 'mxn',
            hosted_invoice_url: inv.hosted_invoice_url,
            invoice_pdf: inv.invoice_pdf,
            period_start: inv.lines?.data?.[0]?.period?.start ? new Date(inv.lines.data[0].period.start*1000).toISOString() : null,
            period_end: inv.lines?.data?.[0]?.period?.end ? new Date(inv.lines.data[0].period.end*1000).toISOString() : null
          }, { onConflict: 'stripe_invoice_id' });

          // Asiento contable (débito)
          const amount = (inv.amount_paid ?? inv.amount_due ?? 0) * -1;
          await supa.from('org_ledger_transactions').insert({
            org_id,
            amount_cents: amount,
            currency: inv.currency || 'mxn',
            type: 'invoice',
            description: `Invoice ${inv.number || inv.id}`,
            stripe_invoice_id: inv.id,
            meta: { lines: inv.lines?.data?.length || 0 }
          });
        }
      }
    }

    // ========== PAYMENT INTENT (depósitos Sanoa Bank) ==========
    if (event.type === 'payment_intent.succeeded') {
      const pi = event.data.object;
      const org_id = pi.metadata?.org_id;
      const kind = pi.metadata?.type; // 'deposit' cuando viene de add-funds
      if (org_id && kind === 'deposit') {
        const amount = pi.amount_received ?? pi.amount ?? 0;
        await supa.from('org_ledger_transactions').insert({
          org_id,
          amount_cents: amount,
          currency: pi.currency || 'mxn',
          type: 'deposit',
          description: 'Depósito Sanoa Bank',
          stripe_payment_intent_id: pi.id,
          stripe_charge_id: pi.latest_charge || null,
          meta: { payment_method: pi.payment_method_types }
        });
      }
    }

    // (opcional) Refunds
    if (event.type === 'charge.refunded') {
      const ch = event.data.object;
      const piId = ch.payment_intent as string | undefined;
      let org_id = undefined;
      if (piId) {
        const pi = await stripe.paymentIntents.retrieve(piId);
        org_id = (pi.metadata?.org_id) || undefined;
      }
      if (org_id) {
        const amount = (ch.amount_refunded || 0) * -1;
        await supa.from('org_ledger_transactions').insert({
          org_id,
          amount_cents: amount,
          currency: ch.currency || 'mxn',
          type: 'refund',
          description: 'Reembolso',
          stripe_payment_intent_id: piId || null,
          stripe_charge_id: ch.id,
          meta: { reason: ch.refunds?.data?.[0]?.reason || null }
        });
      }
    }

    return NextResponse.json({ received: true });
  } catch (e:any) {
    return NextResponse.json({ error: String(e?.message || e) }, { status: 500 });
  }
}

async function enableFeaturesForPrices(supa: ReturnType<typeof createServiceClient>, org_id: string, prices: string[]){
  if (!org_id) return;
  const features = new Set<string>();
  for (const p of prices) {
    const list = PRICE_TO_FEATURES[p] || [];
    list.forEach(f => features.add(f));
  }
  const rows = Array.from(features).map(f => ({ org_id, feature_id: f, source: 'plan' }));
  if (rows.length) {
    await supa.from('org_features').upsert(rows, { onConflict: 'org_id,feature_id' });
  }
}
