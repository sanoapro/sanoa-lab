export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { z } from "zod";

import { createServiceClient } from "@/lib/supabase/service";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2024-06-20" });

const Body = z.object({
  org_id: z.string().uuid(),
  return_path: z.string().default("/banco"),
});

export async function POST(req: NextRequest) {
  try {
    const { org_id, return_path } = Body.parse(await req.json());

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

    const base = process.env.NEXT_PUBLIC_SITE_URL ?? req.nextUrl.origin;
    const sess = await stripe.billingPortal.sessions.create({
      customer: data.stripe_customer_id,
      return_url: `${base}${return_path}`,
    });

    return NextResponse.json({ url: sess.url });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "server_error" }, { status: 500 });
  }
}
