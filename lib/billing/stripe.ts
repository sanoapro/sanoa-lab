// lib/billing/stripe.ts
import Stripe from "stripe";

// Usa la misma versión que configuraste en el endpoint del webhook.
// Si prefieres usar la versión por defecto de tu cuenta, elimina la línea `apiVersion`.
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-08-27.basil",
});

// Base URL seguras para callback/redirect
export function getBaseUrl() {
  // En producción usa la variable pública si existe; local cae al localhost
  return process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "")
    || process.env.VERCEL_URL?.startsWith("http") ? process.env.VERCEL_URL! : `https://${process.env.VERCEL_URL}`
    || "http://localhost:3000";
}

// Mapas de precios -> features (si ya lo tienes, puedes conservar el tuyo)
export const PRICE_TO_FEATURES: Record<string, string[]> = {
  [process.env.STRIPE_PRICE_MENTE  || ""]: ["mente"],
  [process.env.STRIPE_PRICE_SONRISA|| ""]: ["sonrisa"],
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
