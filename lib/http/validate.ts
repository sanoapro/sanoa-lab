// lib/http/validate.ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

export function jsonOk<T = any>(data: T, init?: number | ResponseInit) {
  return NextResponse.json({ ok: true, data }, typeof init === "number" ? { status: init } : init);
}
export function jsonError(code: string, message: string, status = 400) {
  return NextResponse.json({ ok: false, error: { code, message } }, { status });
}

export async function parseJson(req: NextRequest) {
  try {
    return await req.json();
  } catch {
    return {};
  }
}
export function parseOrError<T>(schema: z.Schema<T>, data: any): { ok: true; data: T } | { ok: false; error: { code: string; message: string } } {
  const res = schema.safeParse(data);
  if (res.success) return { ok: true, data: res.data };
  const msg = res.error.issues.map(i => `${i.path.join(".") || "(root)"}: ${i.message}`).join("; ");
  return { ok: false, error: { code: "VALIDATION_ERROR", message: msg } };
}

export function requireHeader(req: NextRequest, name: string, expected?: string | null) {
  const v = req.headers.get(name);
  if (!v) return { ok: false, error: { code: "UNAUTHORIZED", message: `Missing header ${name}` } };
  if (expected && v !== expected) return { ok: false, error: { code: "UNAUTHORIZED", message: `Bad ${name}` } };
  return { ok: true, value: v };
}

export function readOrgIdFromQuery(req: NextRequest) {
  const qp = new URL(req.url).searchParams;
  const org_id = qp.get("org_id") ?? undefined;
  if (!org_id) return { ok: false as const, error: { code: "BAD_REQUEST", message: "Falta org_id" } };
  return { ok: true as const, org_id };
}
