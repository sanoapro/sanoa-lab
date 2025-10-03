// lib/http/validate.ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

/** -----------------------------
 * Respuestas estándar JSON
 * ------------------------------ */
export function jsonOk<T>(data?: T, meta?: Record<string, unknown>) {
  return NextResponse.json({ ok: true, data, ...(meta ? { meta } : {}) });
}

export function jsonError(
  code: string,
  message: string,
  status: any = 400,
  extra?: Record<string, unknown>,
) {
  return NextResponse.json({ ok: false, error: { code, message, ...(extra || {}) } }, { status });
}

/** -----------------------------
 * Utilidades de parseo
 * ------------------------------ */
export function getUrl(req: NextRequest) {
  return new URL(req.url);
}

export function getQuery(req: NextRequest) {
  return getUrl(req).searchParams;
}

export async function parseJson<T = unknown>(req: NextRequest): Promise<T | null> {
  try {
    return (await req.json()) as T;
  } catch {
    return null;
  }
}

/** -----------------------------
 * Zod helpers
 * ------------------------------ */
export function parseOrError<T>(schema: z.ZodType<T>, data: unknown) {
  const parsed = schema.safeParse(data);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i: any) => `${i.path.join(".") || "(root)"}: ${i.message}`)
      .join("; ");
    return { ok: false as const, error: { code: "VALIDATION_ERROR", message: issues } };
  }
  return { ok: true as const, data: parsed.data as T };
}

/** -----------------------------
 * Coerciones frecuentes
 * ------------------------------ */
export function asInt(v: string | null, fallback: number, opts?: { min?: number; max?: number }) {
  const n = v != null ? Number.parseInt(v, 10) : Number.NaN;
  if (Number.isNaN(n)) return fallback;
  if (opts?.min != null && n < opts.min) return opts.min;
  if (opts?.max != null && n > opts.max) return opts.max;
  return n;
}

export function asBool(v: string | null, fallback: any = false) {
  if (v == null) return fallback;
  if (v === "1" || v.toLowerCase() === "true") return true;
  if (v === "0" || v.toLowerCase() === "false") return false;
  return fallback;
}

/** -----------------------------
 * Headers y auth simple
 * ------------------------------ */
export function requireHeader(req: NextRequest, name: string, expected?: string) {
  const val = req.headers.get(name);
  if (!val)
    return { ok: false as const, error: { code: "UNAUTHORIZED", message: `Falta header ${name}` } };
  if (expected && val !== expected)
    return {
      ok: false as const,
      error: { code: "UNAUTHORIZED", message: `Header ${name} inválido` },
    };
  return { ok: true as const, value: val };
}

/** -----------------------------
 * org_id helpers (query/body)
 * ------------------------------ */
export function readOrgIdFromQuery(req: NextRequest) {
  const q = getQuery(req);
  const org_id = q.get("org_id");
  if (!org_id)
    return { ok: false as const, error: { code: "BAD_REQUEST", message: "org_id requerido" } };
  return { ok: true as const, org_id };
}

export function ensureOrgId(org_id?: string | null) {
  if (!org_id)
    return { ok: false as const, error: { code: "BAD_REQUEST", message: "org_id requerido" } };
  return { ok: true as const, org_id };
}

/** -----------------------------
 * Paginación simple
 * ------------------------------ */
export const PageQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(200).default(50),
});
export type PageQuery = z.infer<typeof PageQuerySchema>;

export function parsePageQuery(req: NextRequest): PageQuery {
  const sp = getQuery(req);
  const obj = { page: sp.get("page"), pageSize: sp.get("pageSize") };
  const res = parseOrError(PageQuerySchema, obj);
  return res.ok ? res.data : { page: 1, pageSize: 50 };
}
