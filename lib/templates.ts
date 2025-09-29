// /workspaces/sanoa-lab/lib/templates.ts
// Utilidades: interpolación {{variable}}, validación E.164/Email y normalización simple.

/** Interpola {{variable}} en el cuerpo y reporta faltantes/extras */
export function interpolateTemplate(
  body: string,
  vars: Record<string, string | number | null | undefined>,
  allowed?: string[],
): { text: string; missing: string[]; extra: string[] } {
  const allowedSet = new Set((allowed ?? []).map((s) => s.trim()).filter(Boolean));
  const missing = new Set<string>();
  const used = new Set<string>();

  const text = body.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_, k: string) => {
    used.add(k);
    const v = vars?.[k];
    if (v === null || typeof v === "undefined" || String(v).trim() === "") {
      missing.add(k);
      return "";
    }
    return String(v);
  });

  const extra = allowed ? Object.keys(vars ?? {}).filter((k) => !allowedSet.has(k)) : [];
  return { text, missing: Array.from(missing), extra };
}

/** E.164: +[country][number] sin espacios ni guiones, 8–15 dígitos aprox. */
export function isE164(s: string): boolean {
  return /^\+[1-9]\d{7,14}$/.test(s.trim());
}

/** Normaliza a formato E.164 “best effort” (quita separadores y convierte 00→+) */
export function normalizeE164(s: string): string {
  return s.replace(/[^\d+]/g, "").replace(/^00/, "+").trim();
}

/** Email bastante estricto (sin unicode avanzado) */
export function isEmail(raw: string): boolean {
  const s = raw.trim();
  // local@domain.tld (mínimo 2 letras TLD)
  return /^[^\s@]+@[^\s@]+\.[A-Za-z]{2,}$/.test(s);
}
