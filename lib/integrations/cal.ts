export type BuildCalLinkOptions = {
  name?: string;
  email?: string;
  phone?: string;
  notes?: string;
  fallback?: string;
};

const EVENT_URL = process.env.NEXT_PUBLIC_CAL_EVENT_URL;
const BASE_URL = process.env.NEXT_PUBLIC_CAL_BASE;
const SCHEDULING_URL = process.env.NEXT_PUBLIC_CAL_SCHEDULING_URL;

function isAbsolute(url: string) {
  return /^https?:\/\//i.test(url);
}

/**
 * Construye un link a Cal.com (o fallback) con prefill básico.
 * Acepta URLs absolutas o relativas; agrega query params compatibles.
 */
export function buildCalLink(options: BuildCalLinkOptions = {}) {
  const { name, email, phone, notes } = options;
  const fallback = options.fallback ?? "/agenda";
  const base = EVENT_URL || BASE_URL || SCHEDULING_URL || fallback;

  if (!base) return fallback;

  if (isAbsolute(base)) {
    try {
      const url = new URL(base);
      if (name) url.searchParams.set("name", name);
      if (email) url.searchParams.set("email", email);
      if (notes) url.searchParams.set("notes", notes);
      if (phone) url.searchParams.set("phone", phone);
      return url.toString();
    } catch (error) {
      // Si base es inválida, usamos el fallback.
      return fallback;
    }
  }

  const usp = new URLSearchParams();
  if (name) usp.set("prefill[name]", name);
  if (email) usp.set("prefill[email]", email);
  if (phone) usp.set("prefill[phone]", phone);
  if (notes) usp.set("prefill[notes]", notes);
  const qs = usp.toString();
  if (!qs) return base;
  return `${base}${base.includes("?") ? "&" : "?"}${qs}`;
}
