// lib/templates.ts
// Utilidades: interpolación con {{variable}}, validación y normalización E.164.
export function interpolateTemplate(
  body: string,
  vars: Record<string, string | number | null | undefined>,
  allowed?: string[]
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
  // variables “extra” enviadas que no están en allowed (si allowed fue provisto)
  const extra = allowed ? Object.keys(vars ?? {}).filter((k) => !allowedSet.has(k)) : [];
  return { text, missing: Array.from(missing), extra };
}

// Validación estricta E.164: +<código país><resto>, 8–15 dígitos totales (flexible pero seguro).
export function isE164(raw: string): boolean {
  return /^\+[1-9]\d{7,14}$/.test(raw.trim());
}

// Normaliza a E.164 si ya viene con + y dígitos/espacios/guiones; elimina separadores comunes.
export function normalizeE164(maybe: string): string {
  const s = String(maybe).replace(/[()\s-]/g, "");
  return s.startsWith("+") ? s : s; // no inventamos prefijos; devolvemos tal cual si ya tiene +.
}
