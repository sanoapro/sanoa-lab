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
}
