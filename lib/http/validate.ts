import { NextRequest, NextResponse } from "next/server";
import { ZodSchema } from "zod";

type JsonOkInit = Parameters<typeof NextResponse.json>[1];

type JsonError = {
  code: string;
  message: string;
};

export function jsonOk<T>(data: T, init?: JsonOkInit) {
  return NextResponse.json({ ok: true, data }, init);
}

export function jsonError(code: string, message: string, status = 400, init?: JsonOkInit) {
  return NextResponse.json({ ok: false, error: { code, message } }, { status, ...init });
}

export async function parseJson(req: NextRequest) {
  try {
    return await req.json();
  } catch (error) {
    return null;
  }
}

export function parseOrError<T extends ZodSchema<any>>(schema: T, value: unknown) {
  const parsed = schema.safeParse(value);
  if (parsed.success) return { ok: true as const, data: parsed.data };

  const msg = parsed.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`).join("; ");
  return { ok: false as const, error: { code: "VALIDATION_ERROR", message: msg } satisfies JsonError };
}
