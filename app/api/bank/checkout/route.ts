Aquí tienes el archivo unificado y sin conflictos, manteniendo lo más posible de ambos lados: autenticación con Supabase en el `GET`, normalización robusta de URLs para `success_url/cancel_url`, y el uso de Stripe con `metadata` y `price` por producto.

```ts
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseServer } from "@/lib/supabase/server";
import { stripe as stripeClient, getBaseUrl } from "@/lib/billing/stripe";

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

function stripeNotConfigured() {
  return (
    !process.env.STRIPE_SECRET_KEY ||
    !process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ||
    !stripeClient
  );
}

export async function GET(req: NextRequest) {
  const product = req.nextUrl.searchParams.get("product") ?? "mente";

  if (stripeNotConfigured()) {
    return NextResponse.json(
      {
        error:
          "Stripe no configurado. Define STRIPE_SECRET_KEY/NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY.",
      },
      { status: 501 },
    );
  }

  const supabase = await getSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  // Placeholder: aquí podrías crear una sesión o devolver metadata del producto.
  return NextResponse.json({ ok: true, product, href: "/banco" });
}

export async function POST(req: NextRequest) {
  if (stripeNotConfigured()) {
    return NextResponse.json(
      {
        error:
          "Stripe no configurado. Define STRIPE_SECRET_KEY/NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY.",
      },
      { status: 501 },
    );
  }

  try {
    const { org_id, product, return_path } = Body.parse(await req.json());
    const price = PRICE_ENV[product];
    if (!price) {
      return NextResponse.json({ error: `Falta PRICE para ${product}` }, { status: 400 });
    }

    // Base URL robusta (NEXT_PUBLIC_SITE_URL > getBaseUrl() > req.origin)
    const envBase = (process.env.NEXT_PUBLIC_SITE_URL || getBaseUrl() || req.nextUrl.origin || "")
      .replace(/\/$/, "");
    const normalizedPath = return_path.startsWith("/") ? return_path : `/${return_path}`;
    const successUrl = new URL(normalizedPath, `${envBase}/`);
    successUrl.searchParams.set("success", "1");
    const cancelUrl = new URL(normalizedPath, `${envBase}/`);
    cancelUrl.searchParams.set("canceled", "1");

    const session = await stripeClient!.checkout.sessions.create({
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
```
