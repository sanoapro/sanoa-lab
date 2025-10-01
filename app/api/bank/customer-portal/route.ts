export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { z } from "zod";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2024-06-20" });

const Body = z.object({
  customer_id: z.string().min(1),
  return_path: z.string().default("/banco"),
});

export async function POST(req: NextRequest) {
  try {
    const { customer_id, return_path } = Body.parse(await req.json());
    const base = process.env.NEXT_PUBLIC_SITE_URL ?? req.nextUrl.origin;

    const session = await stripe.billingPortal.sessions.create({
      customer: customer_id,
      return_url: `${base}${return_path}`,
    });

    return NextResponse.json({ url: session.url });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "server_error" }, { status: 500 });
  }
}
