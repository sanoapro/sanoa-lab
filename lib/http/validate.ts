// lib/http/validate.ts
import { NextRequest, NextResponse } from "next/server";

export function jsonOk(data?: unknown, meta?: Record<string, unknown>) {
  return NextResponse.json({ ok: true, data, ...(meta ? { meta } : {}) });
}

export function jsonError(
  code: string,
  message: string,
  status: number = 400,
  extra?: Record<string, unknown>
) {
  return NextResponse.json({ ok: false, error: { code, message, ...(extra ?? {}) } }, { status });
}

export async function parseJson(req: NextRequest): Promise<any> {
  try {
    return await req.json();
  } catch {
    return {};
  }
}

/** Estructura genérica compatible con Zod sin acoplar import directo */
type SafeParser<T> = {
  safeParse: (data: unknown) => { success: true; data: T } | { success: false; error: { issues: Array<{ path: (string|number)[]; message: string }> } };
};

export function parseOrError<T>(schema: SafeParser<T>, data: unknown):
  | { ok: true; data: T }
  | { ok: false, error: { code: "VALIDATION_ERROR"; message: string } } {
  const res = schema.safeParse(data);
  if (res.success) return { ok: true, data: res.data };
  const msg = res.error.issues.map(i => `${i.path.join(".") || "(root)"}: ${i.message}`).join("; ");
  return { ok: false, error: { code: "VALIDATION_ERROR", message: msg } };
}

/** Lee org_id de la query; devuelve bandera y valor */
export function readOrgIdFromQuery(req: NextRequest): { ok: true; org_id: string } | { ok: false } {
  const qp = new URL(req.url).searchParams;
  const org_id = qp.get("org_id");
  if (org_id && /^[0-9a-f-]{36}$/i.test(org_id)) return { ok: true, org_id };
  return { ok: false };
}
