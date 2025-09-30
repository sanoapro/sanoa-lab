import { NextRequest, NextResponse } from "next/server";
import { ZodSchema, ZodError } from "zod";

/** Respuesta de éxito consistente */
export function jsonOk<T = unknown>(data?: T, meta?: Record<string, unknown>) {
  return NextResponse.json({ ok: true, data: data ?? null, meta: meta ?? undefined });
}

/** Respuesta de error consistente */
export function jsonError(code: string, message: string, status = 400, extra?: Record<string, unknown>) {
  return NextResponse.json({ ok: false, error: { code, message, ...(extra || {}) } }, { status });
}

/** Lee JSON con control de errores */
export async function parseJson<T = unknown>(req: NextRequest): Promise<T | null> {
  try {
    return (await req.json()) as T;
  } catch {
    return null;
  }
}

/** Valida contra un ZodSchema devolviendo estructura {ok, data|error} */
export function parseOrError<T>(schema: ZodSchema<T>, value: unknown):
  | { ok: true; data: T }
  | { ok: false; error: { code: string; message: string; issues?: string[] } } {
  try {
    const data = schema.parse(value);
    return { ok: true, data };
  } catch (e) {
    const issues =
      e instanceof ZodError ? e.issues.map((i) => `${i.path.join(".")}: ${i.message}`) : ["Invalid payload"];
    return { ok: false, error: { code: "VALIDATION_ERROR", message: issues.join("; "), issues } };
  }
}
