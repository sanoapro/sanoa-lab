<<<<<<< HEAD
// lib/integrations/cal.ts
/**
 * Genera un deep-link a Cal.com con prefill de name/email/notes.
 * Usa NEXT_PUBLIC_CAL_EVENT_URL (link de evento) o NEXT_PUBLIC_CAL_BASE (usuario/equipo).
 * Docs oficiales: se aceptan parámetros "name" y "email" en el query. (ver Help/Docs Cal.com)
 */
export function buildCalLink({
  name,
  email,
  notes,
  fallback = "/agenda",
}: {
  name?: string;
  email?: string;
  notes?: string;
  fallback?: string;
}) {
  const base =
    process.env.NEXT_PUBLIC_CAL_EVENT_URL ||
    process.env.NEXT_PUBLIC_CAL_BASE ||
    "";
  if (!base) return fallback;
  const url = new URL(base);
  if (name) url.searchParams.set("name", name);
  if (email) url.searchParams.set("email", email);
  if (notes) url.searchParams.set("notes", notes);
  return url.toString();
=======
export type BuildCalLinkOptions = {
  name?: string;
  email?: string;
  phone?: string;
  notes?: string;
};

const DEFAULT_URL = process.env.NEXT_PUBLIC_CAL_SCHEDULING_URL || "/agenda";

/**
 * Construye un link a Cal.com (o fallback) con prefill básico.
 * Acepta URLs absolutas o relativas; agrega query params tipo prefill[name].
 */
export function buildCalLink(opts: BuildCalLinkOptions = {}) {
  const base = DEFAULT_URL;
  const usp = new URLSearchParams();
  if (opts.name) usp.set("prefill[name]", opts.name);
  if (opts.email) usp.set("prefill[email]", opts.email);
  if (opts.phone) usp.set("prefill[phone]", opts.phone);
  if (opts.notes) usp.set("prefill[notes]", opts.notes);
  const qs = usp.toString();
  if (!qs) return base;
  return `${base}${base.includes("?") ? "&" : "?"}${qs}`;
>>>>>>> df93bf6ae291c2e0088aa2717e0cc181720354ac
}
