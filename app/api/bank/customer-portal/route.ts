export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { stripe, getBaseUrl } from "@/lib/billing/stripe";

const Body = z.object({
  customer_id: z.string().min(1),
  return_path: z.string().default("/banco"),
});

export async function POST(req: NextRequest) {
  // Verifica configuración de Stripe
  if (!stripe) {
    return NextResponse.json(
      { error: "Stripe no configurado (faltan STRIPE_SECRET_KEY/NEXT_PUBLIC_SITE_URL)" },
      { status: 501 },
    );
  }

  try {
    const { customer_id, return_path } = Body.parse(await req.json());

    // Normaliza base y path
    const base = getBaseUrl();
    const normalizedPath = return_path.startsWith("/") ? return_path : `/${return_path}`;
    const returnUrl = `${base}${normalizedPath}`;

    // Crea sesión del portal del cliente
    const session = await stripe.billingPortal.sessions.create({
      customer: customer_id,
      return_url: returnUrl,
    });

    return NextResponse.json({ url: session.url });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "server_error" }, { status: 500 });
  }
}
