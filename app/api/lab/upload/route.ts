// app/api/lab/upload/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";

export const runtime = "nodejs"; // necesitamos Buffer en Node
export const maxDuration = 60;   // defensa vs timeouts largos

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const bucket = process.env.LAB_RESULTS_BUCKET || "lab-results";

const MAX_MB = Number(process.env.NEXT_PUBLIC_UPLOAD_MAX_MB || 10);
const ALLOWED = String(process.env.NEXT_PUBLIC_UPLOAD_ALLOWED || "pdf,jpg,png")
  .split(",")
  .map((s) => s.trim().toLowerCase())
  .filter(Boolean);

function supaAdmin() {
  return createClient(url, serviceKey, { auth: { persistSession: false } });
}

async function ensureBucket() {
  const supa = supaAdmin();
  const { data: list } = await supa.storage.listBuckets();
  if (!list?.some((b) => b.name === bucket)) {
    // bucket privado + límite de tamaño por archivo
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
  res.headers.set("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  return res;
}

// -------- Health/CORS --------
export async function OPTIONS() {
  return cors(NextResponse.json({ ok: true }));
}
export async function HEAD() {
  return cors(new NextResponse(null, { status: 200 }));
}

// -------- Validación del token (para el portal) --------
export async function GET(req: Request) {
  const urlObj = new URL(req.url);
  const token = urlObj.searchParams.get("token")?.trim();

  // Health quick-check si no mandan token
  if (!token) {
    return cors(NextResponse.json({ ok: true, hint: "Usa ?token=..." }));
  }

  const supa = supaAdmin();
  const { data, error } = await supa
    .from("lab_upload_tokens")
    .select("id, request_id, expires_at, used_at, lab_requests(title)")
    .eq("token", token)
    .single();

  if (error) return cors(NextResponse.json({ ok: false, error: error.message }, { status: 400 }));

  const now = new Date();
  if (data.used_at) return cors(NextResponse.json({ ok: false, error: "Este enlace ya fue usado" }, { status: 410 }));
  if (new Date(data.expires_at) < now)
    return cors(NextResponse.json({ ok: false, error: "El enlace expiró" }, { status: 410 }));

  return cors(
    NextResponse.json({
      ok: true,
      request: { id: data.request_id, title: (data as any)?.lab_requests?.title ?? "Estudio" },
      expires_at: data.expires_at,
    }),
  );
}

// -------- Carga del archivo (FormData: token, file, notes) --------
export async function POST(req: Request) {
  try {
    await ensureBucket();

    const form = await req.formData();
    const token = String(form.get("token") || "").trim();
    const file = form.get("file") as unknown as File | null;
    const notes = String(form.get("notes") || "").slice(0, 500);

    if (!token || !file) {
      return cors(NextResponse.json({ ok: false, error: "token y file requeridos" }, { status: 400 }));
    }

    const sizeMB = (file.size || 0) / (1024 * 1024);
    if (sizeMB > MAX_MB) {
      return cors(NextResponse.json({ ok: false, error: `Máximo ${MAX_MB}MB` }, { status: 413 }));
    }

    const originalName = (file as any).name || "archivo";
    const incomingMime = file.type || inferMimeFromName(originalName);
    if (!mimeAllowed(incomingMime, originalName)) {
      return cors(
        NextResponse.json(
          { ok: false, error: `Formato no permitido (${ALLOWED.join(", ")})` },
          { status: 415 },
        ),
      );
    }

    const supa = supaAdmin();

    // 1) Valida token
    const { data: t, error: eTok } = await supa
      .from("lab_upload_tokens")
      .select("id, request_id, expires_at, used_at")
      .eq("token", token)
      .single();

    if (eTok) return cors(NextResponse.json({ ok: false, error: eTok.message }, { status: 400 }));
    if (!t) return cors(NextResponse.json({ ok: false, error: "Token inválido" }, { status: 400 }));
    if (t.used_at) return cors(NextResponse.json({ ok: false, error: "Este enlace ya fue usado" }, { status: 410 }));
    if (new Date(t.expires_at) < new Date())
      return cors(NextResponse.json({ ok: false, error: "El enlace expiró" }, { status: 410 }));

    // 2) Subir a Storage
    const arrayBuf = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuf);

    const safeName = originalName.replace(/[^\w.\-]+/g, "_");
    const key = `${t.request_id}/${Date.now()}_${randomUUID().slice(0, 8)}_${safeName}`;

    const { error: eUp } = await supa.storage.from(bucket).upload(key, buffer, {
      contentType: incomingMime,
      upsert: false,
      // Puedes adjuntar metadata útil que luego mostrarás en UI/listados:
      metadata: {
        original_name: originalName,
        uploaded_at: new Date().toISOString(),
      } as any,
    });
    if (eUp) return cors(NextResponse.json({ ok: false, error: eUp.message }, { status: 400 }));

    // 3) Side-effects (idempotentes suaves)
    await supa.from("lab_upload_tokens").update({ used_at: new Date().toISOString() }).eq("id", t.id);
    await supa.from("lab_requests").update({ status: "uploaded" as any }).eq("id", t.request_id).catch(() => {});
    await supa
      .from("lab_results")
      .insert({ request_id: t.request_id, path: key, notes: notes || null })
      .catch(() => {}); // ignora si la tabla aún no existe

    return cors(NextResponse.json({ ok: true, request_id: t.request_id, path: key }));
  } catch (e: any) {
    return cors(
      NextResponse.json(
        { ok: false, error: "No se pudo subir el archivo", detail: e?.message || String(e) },
        { status: 500 },
      ),
    );
  }
}
