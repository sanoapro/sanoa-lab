import { NextRequest, NextResponse } from "next/server";

/** Éxito consistente */
export function jsonOk<T = any>(data?: T, status = 200) {
  return NextResponse.json({ ok: true, data }, { status });
}

/** Error consistente */
export function jsonError(code: string, message: string, status = 400) {
  return NextResponse.json({ ok: false, error: { code, message } }, { status });
}

/** Parseo robusto de JSON en body */
export async function parseJson<T = any>(req: NextRequest): Promise<T | undefined> {
  const ctype = req.headers.get("content-type") || "";
  if (!ctype.includes("application/json")) return undefined;
  try {
    return (await req.json()) as T;
  } catch {
    return undefined;
  }
}
