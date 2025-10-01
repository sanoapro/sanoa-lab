// lib/billing/stripe.ts
import Stripe from "stripe";

const stripeSecret = process.env.STRIPE_SECRET_KEY;

// Usa la misma versión que configuraste en el endpoint del webhook.
// Si prefieres usar la versión por defecto de tu cuenta, elimina la línea `apiVersion`.
export const stripe = stripeSecret
  ? new Stripe(stripeSecret, {
      apiVersion: "2025-08-27.basil",
    })
  : null;

// Base URL seguras para callback/redirect
export function getBaseUrl() {
  // En producción usa la variable pública si existe; local cae al localhost
  const publicUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
  if (publicUrl) return publicUrl;

  const vercelUrl = process.env.VERCEL_URL;
  if (!vercelUrl) return "http://localhost:3000";

  return vercelUrl.startsWith("http")
    ? vercelUrl
    : `https://${vercelUrl}`;
}

// Mapas de precios -> features (si ya lo tienes, puedes conservar el tuyo)
export const PRICE_TO_FEATURES: Record<string, string[]> = {
  [process.env.STRIPE_PRICE_MENTE || ""]: ["mente"],
  [process.env.STRIPE_PRICE_SONRISA || ""]: ["sonrisa"],
  [process.env.STRIPE_PRICE_EQUILIBRIO || ""]: ["equilibrio"],
};

// Helpers de URLs
export function successUrl() {
  const base = getBaseUrl();
  return `${base}/banco/ajustes?status=success`;
}
export function cancelUrl() {
  const base = getBaseUrl();
  return `${base}/banco/ajustes?status=cancel`;
}
