import { NextRequest, NextResponse } from "next/server";
import { ZodSchema } from "zod";
import { safeEquals } from "./signatures";

type JsonObject = Record<string, any>;

type ErrorPayload = {
  code: string;
  message: string;
};

type ParseSuccess<T> = { ok: true; value: T };
type ParseFailure = { ok: false; error: ErrorPayload };
export type ParseResult<T> = ParseSuccess<T> | ParseFailure;

export function jsonOk(payload?: JsonObject, init?: ResponseInit) {
  return NextResponse.json({ ok: true, ...(payload ?? {}) }, init);
}

export function jsonError(code: string, message: string, status = 400, extras?: JsonObject) {
  return NextResponse.json(
    {
      ok: false,
      error: {
        code,
        message,
      },
      ...(extras ?? {}),
    },
    { status },
  );
}

export async function parseJson<T = unknown>(req: NextRequest): Promise<T | null> {
  try {
    return (await req.json()) as T;
  } catch {
    return null;
  }
}

export function parseOrError<T>(schema: ZodSchema<T>, data: unknown): ParseResult<T> {
  const result = schema.safeParse(data);
  if (result.success) {
    return { ok: true, value: result.data };
  }

  const message = result.error.errors
    .map((err) => {
      const path = err.path.join(".");
      return path ? `${path}: ${err.message}` : err.message;
    })
    .join("; ") || "Invalid request body";

  return { ok: false, error: { code: "INVALID_BODY", message } };
}

export function requireHeader(
  req: NextRequest,
  header: string,
  expected?: string | null,
): ParseSuccess<string> | ParseFailure {
  const value = req.headers.get(header);
  if (!value) {
    return { ok: false, error: { code: "UNAUTHORIZED", message: `Missing ${header}` } };
  }
  if (expected != null) {
    if (!expected) {
      return {
        ok: false,
        error: { code: "CONFIG_ERROR", message: `Missing expected value for ${header}` },
      };
    }
    if (!safeEquals(value, expected)) {
      return { ok: false, error: { code: "UNAUTHORIZED", message: `Invalid ${header}` } };
    }
  }
  return { ok: true, value };
}
