export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { createServiceClient } from "@/lib/supabase/service";
import { stripe, getBaseUrl } from "@/lib/billing/stripe";

const Body = z.object({
  org_id: z.string().uuid(),
  return_path: z.string().default("/banco"),
});

export async function POST(req: NextRequest) {
  // Verifica Stripe configurado
  if (!stripe) {
    return NextResponse.json(
      { error: "Stripe no configurado (faltan STRIPE_SECRET_KEY/NEXT_PUBLIC_SITE_URL)" },
      { status: 501 },
    );
  }

  try {
    const { org_id, return_path } = Body.parse(await req.json());

    // Busca el customer vinculado a la organización
    const supa = createServiceClient();
    const { data, error } = await supa
      .from("org_billing")
      .select("stripe_customer_id")
      .eq("org_id", org_id)
      .single();

    if (error || !data?.stripe_customer_id) {
      return NextResponse.json(
        { error: "No hay customer vinculado a esta organización" },
        { status: 400 },
      );
    }

    // Normaliza base y path
    const base = getBaseUrl();
    const normalizedPath = return_path.startsWith("/") ? return_path : `/${return_path}`;
    const returnUrl = `${base}${normalizedPath}`;

    // Crea sesión del portal de facturación
    const sess = await stripe.billingPortal.sessions.create({
      customer: data.stripe_customer_id,
      return_url: returnUrl,
    });

    return NextResponse.json({ url: sess.url });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "server_error" }, { status: 500 });
  }
}
