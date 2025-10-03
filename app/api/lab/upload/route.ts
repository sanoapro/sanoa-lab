// app/api/lab/upload/route.ts
import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { createServiceClient } from "@/lib/supabase/server";
import { ok, badRequest, error as jsonError, serverError } from "@/lib/api/responses";

export const runtime = "nodejs";
export const maxDuration = 60;

const bucket = process.env.LAB_RESULTS_BUCKET || "lab-results";
const MAX_MB = Number(process.env.NEXT_PUBLIC_UPLOAD_MAX_MB || 10);
const ALLOWED = (process.env.NEXT_PUBLIC_UPLOAD_ALLOWED ?? "pdf,jpg,png")
  .split(",")
  .map((s: string) => s.trim().toLowerCase())
  .filter(Boolean);

function supaAdmin() {
  return createServiceClient();
}

async function ensureBucket() {
  const supa = supaAdmin();
  const { data: list } = await supa.storage.listBuckets();
  const buckets = (list ?? []) as Array<{ name: string }>;
  const exists = buckets.some((b) => b.name === bucket);
  if (!exists) {
    await supa.storage
      .createBucket(bucket, {
        public: false,
        fileSizeLimit: `${MAX_MB}MB`,
      })
      .catch(() => {});
  }
}

function inferMimeFromName(name: string): string {
  const ext = (name.split(".").pop() || "").toLowerCase();
  if (ext === "pdf") return "application/pdf";
  if (ext === "jpg" || ext === "jpeg") return "image/jpeg";
  if (ext === "png") return "image/png";
  return "application/octet-stream";
}

function mimeAllowed(mime: string, filename: string) {
  const ext = (filename.split(".").pop() || "").toLowerCase();
  if (ALLOWED.includes(ext)) return true;
  if (mime === "application/pdf" && ALLOWED.includes("pdf")) return true;
  if (mime === "image/jpeg" && (ALLOWED.includes("jpg") || ALLOWED.includes("jpeg"))) return true;
  if (mime === "image/png" && ALLOWED.includes("png")) return true;
  return false;
}

function cors(res: NextResponse) {
  res.headers.set("Access-Control-Allow-Origin", "*");
  res.headers.set("Access-Control-Allow-Methods", "GET,POST,OPTIONS,HEAD");
  res.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  return res;
}

export async function OPTIONS() {
  return cors(ok());
}

export async function HEAD() {
  return cors(new NextResponse(null, { status: 200 }));
}

export async function GET(req: NextRequest) {
  const urlObj = new URL(req.url);
  const token = urlObj.searchParams.get("token")?.trim();

  if (!token) {
    return cors(ok({ hint: "Usa ?token=..." }));
  }

  const supa = supaAdmin();
  const { data, error } = await supa
    .from("lab_upload_tokens")
    .select("id, request_id, expires_at, used_at, lab_requests(title)")
    .eq("token", token)
    .single();

  if (error) {
    return cors(jsonError("TOKEN_ERROR", error.message));
  }

  const now = new Date();
  if (!data) {
    return cors(jsonError("TOKEN_INVALID", "Token inválido", 400));
  }

  if (data.used_at) {
    return cors(jsonError("TOKEN_USED", "Este enlace ya fue usado", 410));
  }

  if (new Date(data.expires_at) < now) {
    return cors(jsonError("TOKEN_EXPIRED", "El enlace expiró", 410));
  }

  return cors(
    ok({
      request: { id: data.request_id, title: (data as any)?.lab_requests?.title ?? "Estudio" },
      expires_at: data.expires_at,
    }),
  );
}

export async function POST(req: NextRequest) {
  try {
    await ensureBucket();

    const form = await req.formData();
    const token = String(form.get("token") || "").trim();
    const file = form.get("file") as File | null;
    const notes = String(form.get("notes") || "").slice(0, 500);

    if (!token || !file) {
      return cors(badRequest("token y file requeridos"));
    }

    const sizeMB = (file.size || 0) / (1024 * 1024);
    if (sizeMB > MAX_MB) {
      return cors(jsonError("FILE_TOO_LARGE", `Máximo ${MAX_MB}MB`, 413));
    }

    const originalName = file.name || "archivo";
    const incomingMime = file.type || inferMimeFromName(originalName);
    if (!mimeAllowed(incomingMime, originalName)) {
      return cors(
        jsonError("UNSUPPORTED_FORMAT", `Formato no permitido (${ALLOWED.join(", ")})`, 415),
      );
    }

    const supa = supaAdmin();

    const { data: tokenRow, error: tokenError } = await supa
      .from("lab_upload_tokens")
      .select("id, request_id, expires_at, used_at")
      .eq("token", token)
      .single();

    if (tokenError) {
      return cors(jsonError("TOKEN_ERROR", tokenError.message));
    }
    if (!tokenRow) {
      return cors(jsonError("TOKEN_INVALID", "Token inválido", 400));
    }
    if (tokenRow.used_at) {
      return cors(jsonError("TOKEN_USED", "Este enlace ya fue usado", 410));
    }
    if (new Date(tokenRow.expires_at) < new Date()) {
      return cors(jsonError("TOKEN_EXPIRED", "El enlace expiró", 410));
    }

    // Nombre seguro y clave de storage
    const safeName = originalName.replace(/[^\w.-]+/g, "_");
    const key = `${tokenRow.request_id}/${Date.now()}_${randomUUID().slice(0, 8)}_${safeName}`;

    // Metadata estrictamente string->string
    const metadata: Record<string, string> = {
      original_name: originalName,
      uploaded_at: new Date().toISOString(),
    };
    if (notes) metadata.notes = notes;

    // Subir: pasa el propio File (o un Blob/ArrayBuffer si prefieres)
    const { error: uploadError } = await supa.storage.from(bucket).upload(key, file, {
      contentType: incomingMime,
      upsert: false,
      metadata,
    });

    if (uploadError) {
      return cors(jsonError("UPLOAD_ERROR", uploadError.message));
    }

    await supa
      .from("lab_upload_tokens")
      .update({ used_at: new Date().toISOString() })
      .eq("id", tokenRow.id)
      .catch(() => {});
    await supa
      .from("lab_requests")
      .update({ status: "uploaded" })
      .eq("id", tokenRow.request_id)
      .catch(() => {});
    await supa
      .from("lab_results")
      .insert({ request_id: tokenRow.request_id, path: key, notes: notes || null })
      .catch(() => {});

    return cors(ok({ request_id: tokenRow.request_id, path: key }));
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return cors(serverError("No se pudo subir el archivo", { details: { message } }));
  }
}
