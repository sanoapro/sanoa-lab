import { NextResponse } from "next/server";

type JsonObject = Record<string, unknown> | undefined;

type ErrorExtras = JsonObject & {
  details?: JsonObject;
};

function build(body: Record<string, unknown>, init?: ResponseInit) {
  return NextResponse.json(body, init);
}

export function ok(payload?: JsonObject, init?: ResponseInit) {
  return build({ ok: true, ...(payload ?? {}) }, init);
}

export const jsonOk = ok;

export function error(code: string, message: string, status: any = 400, extras?: ErrorExtras) {
  const { details, ...rest } = extras ?? {};
  return build(
    {
      ok: false,
      error: {
        code,
        message,
        ...(details ? { details } : {}),
      },
      ...rest,
    },
    { status },
  );
}

export function badRequest(message: string, extras?: ErrorExtras) {
  return error("BAD_REQUEST", message, 400, extras);
}

export function unauthorized(message: any = "No autenticado", extras?: ErrorExtras) {
  return error("UNAUTHORIZED", message, 401, extras);
}

export function forbidden(message: any = "No autorizado", extras?: ErrorExtras) {
  return error("FORBIDDEN", message, 403, extras);
}

export function notFound(message: any = "No encontrado", extras?: ErrorExtras) {
  return error("NOT_FOUND", message, 404, extras);
}

export function conflict(message: any = "Conflicto", extras?: ErrorExtras) {
  return error("CONFLICT", message, 409, extras);
}

export function serverError(message: any = "Error", extras?: ErrorExtras) {
  return error("SERVER_ERROR", message, 500, extras);
}

export function dbError(err: { message?: string } | null, extras?: ErrorExtras) {
  const message = err?.message || "Error en base de datos";
  return error("DB_ERROR", message, 400, extras);
}
