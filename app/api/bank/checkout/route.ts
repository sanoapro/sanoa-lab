export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { stripe as stripeClient } from "@/lib/billing/stripe";

const Body = z.object({
  org_id: z.string().uuid(),
  product: z.enum(["mente", "pulso", "sonrisa", "equilibrio"]),
  return_path: z.string().default("/banco"),
});

const PRICE_ENV: Record<string, string | undefined> = {
  mente: process.env.STRIPE_PRICE_MENTE,
  pulso: process.env.STRIPE_PRICE_PULSO,
  sonrisa: process.env.STRIPE_PRICE_SONRISA,
  equilibrio: process.env.STRIPE_PRICE_EQUILIBRIO,
};

export async function POST(req: NextRequest) {
  try {
    const { org_id, product, return_path } = Body.parse(await req.json());
    const price = PRICE_ENV[product];
    if (!price) return NextResponse.json({ error: `Falta PRICE para ${product}` }, { status: 400 });

    const client = stripeClient;
    if (!client) {
      return NextResponse.json({ error: "Stripe no está configurado" }, { status: 501 });
    }

    const envBase = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
    const base = (envBase && envBase.length > 0 ? envBase : req.nextUrl.origin).replace(/\/$/, "");
    const normalizedPath = return_path.startsWith("/") ? return_path : `/${return_path}`;
    const successUrl = new URL(normalizedPath, `${base}/`);
    successUrl.searchParams.set("success", "1");
    const cancelUrl = new URL(normalizedPath, `${base}/`);
    cancelUrl.searchParams.set("canceled", "1");

    const session = await client.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price, quantity: 1 }],
      success_url: successUrl.toString(),
      cancel_url: cancelUrl.toString(),
      metadata: { org_id, product },
    });

    return NextResponse.json({ url: session.url });
  } catch (e: any) {
    if (e instanceof z.ZodError) {
      return NextResponse.json(
        { error: e.issues?.[0]?.message ?? "Parámetros inválidos" },
        { status: 400 },
      );
    }
    return NextResponse.json({ error: e?.message ?? "server_error" }, { status: 500 });
  }
}
