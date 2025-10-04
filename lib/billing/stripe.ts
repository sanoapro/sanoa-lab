// lib/billing/stripe.ts
import Stripe from "stripe";

export type { Stripe as StripeNS } from "stripe";

// Mantén una sola versión consistente en todo el proyecto
export const STRIPE_API_VERSION: any = "2024-06-20";

// Singleton de Stripe (o null si no hay secret configurado)
const secret = process.env.STRIPE_SECRET_KEY || "";
export const stripe = secret
  ? new Stripe(secret, { apiVersion: STRIPE_API_VERSION })
  : null;

// Base URL segura para callbacks/redirects
export function getBaseUrl(): string {
  // Prod: usa NEXT_PUBLIC_SITE_URL si está definida
  const publicUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
  if (publicUrl) return publicUrl;

  // Vercel: VERCEL_URL viene sin protocolo
  const vercelUrl = process.env.VERCEL_URL?.replace(/\/$/, "");
  if (vercelUrl) return vercelUrl.startsWith("http") ? vercelUrl : `https://${vercelUrl}`;

  // Local fallback
  return "http://localhost:3000";
}

// Mapa de precios -> features (ajusta según tus envs/planes)
export const PRICE_TO_FEATURES: Record<string, string[]> = {
  [process.env.STRIPE_PRICE_MENTE || ""]: ["mente"],
  [process.env.STRIPE_PRICE_PULSO || ""]: ["pulso"],
  [process.env.STRIPE_PRICE_SONRISA || ""]: ["sonrisa"],
  [process.env.STRIPE_PRICE_EQUILIBRIO || ""]: ["equilibrio"],
};

// Helpers de URL de retorno (puedes personalizar el path)
export function successUrl(path: string = "/banco/ajustes"): string {
  const base = getBaseUrl();
  const url = new URL(path, `${base}/`);
  url.searchParams.set("status", "success");
  return url.toString();
}

export function cancelUrl(path: string = "/banco/ajustes"): string {
  const base = getBaseUrl();
  const url = new URL(path, `${base}/`);
  url.searchParams.set("status", "cancel");
  return url.toString();
}
