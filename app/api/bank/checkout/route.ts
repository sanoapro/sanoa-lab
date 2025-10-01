import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const { plan } = await req.json().catch(() => ({}));
    if (!plan) {
      return NextResponse.json({ message: "Falta plan" }, { status: 400 });
    }

    const hasStripe = !!process.env.STRIPE_SECRET_KEY;
    if (!hasStripe) {
      return NextResponse.json(
        {
          message:
            "Stripe no está configurado. Define STRIPE_SECRET_KEY y NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY.",
          url: "/ajustes?missing=stripe",
        },
        { status: 200 },
      );
    }

    return NextResponse.json(
      {
        message: "Checkout Stripe pendiente de integrar con lib/billing/stripe.ts",
      },
      { status: 501 },
    );
  } catch {
    return NextResponse.json({ message: "Error de servidor" }, { status: 500 });
  }
}
