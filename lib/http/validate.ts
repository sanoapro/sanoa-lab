// lib/http/validate.ts
import { NextRequest, NextResponse } from "next/server";
import { ZodSchema } from "zod";

export function jsonOk<T>(data: T, meta?: Record<string, unknown>) {
  return NextResponse.json({ ok: true, data, meta }, { status: 200 });
}
export function jsonError(code: string, message: string, status = 400) {
  return NextResponse.json({ ok: false, error: { code, message } }, { status });
}

export async function parseJson(req: NextRequest) {
  try { return await req.json(); } catch { return {}; }
}

export function parseOrError<T>(schema: ZodSchema<T>, obj: unknown):
  { ok: true; data: T } | { ok: false; error: { code: string; message: string } } {
  const r = schema.safeParse(obj);
  if (r.success) return { ok: true, data: r.data };
  const msg = r.error.issues.map(i => `${i.path.join(".")}: ${i.message}`).join("; ");
  return { ok: false, error: { code: "VALIDATION_ERROR", message: msg } };
}
