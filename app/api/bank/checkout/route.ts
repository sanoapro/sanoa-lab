export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { z } from "zod";
import { createServiceClient } from "@/lib/supabase/service";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2024-06-20" });

const Body = z.object({
  org_id: z.string().uuid(),
  feature: z.enum(["mente", "pulso", "sonrisa", "equilibrio"]),
  mode: z.enum(["subscription"]).default("subscription"),
});

function priceFor(feature: string) {
  const map: Record<string, string | undefined> = {
    mente: process.env.STRIPE_PRICE_MENTE,
    pulso: process.env.STRIPE_PRICE_PULSO,
    sonrisa: process.env.STRIPE_PRICE_SONRISA,
    equilibrio: process.env.STRIPE_PRICE_EQUILIBRIO,
  };
  return map[feature];
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { org_id, feature } = Body.parse(body);

    const price = priceFor(feature);
    if (!price) {
      return NextResponse.json({ error: "Falta configurar PRICE para " + feature }, { status: 400 });
    }

    const supa = createServiceClient();
    const { data: orgRow, error: orgErr } = await supa
      .from("orgs")
      .select("id")
      .eq("id", org_id)
      .maybeSingle();
    if (orgErr) console.warn(orgErr);
    if (!orgRow) return NextResponse.json({ error: "org_id inválido" }, { status: 400 });

    const origin = process.env.NEXT_PUBLIC_SITE_URL ?? req.nextUrl.origin;

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price, quantity: 1 }],
      success_url: `${origin}/banco?success=1&org_id=${org_id}&feature=${feature}`,
      cancel_url: `${origin}/banco?canceled=1&org_id=${org_id}`,
      metadata: { org_id, feature },
    });

    return NextResponse.json({ url: session.url });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "server_error" }, { status: 500 });
  }
}
