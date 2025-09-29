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
}
