import { getSupabaseBrowser } from "@/lib/supabase-browser";

export type PatientFile = {
  id: string;
  user_id: string;
  patient_id: string;
  path: string;
  file_name: string;
  size: number | null;
  mime_type: string | null;
  created_at: string;
};

const MAX_MB = Number(process.env.NEXT_PUBLIC_UPLOAD_MAX_MB || 10);
const ALLOWED = String(process.env.NEXT_PUBLIC_UPLOAD_ALLOWED || "image/*,application/pdf");
const SIGNED_TTL = Number(process.env.NEXT_PUBLIC_SIGNED_URL_TTL || 300);

// Soporta comodines tipo image/*, application/*
function mimeAllowed(mime: string): boolean {
  if (!mime) return false;
  const parts = ALLOWED.split(/[,\s]+/)
    .map((s) => s.trim())
    .filter(Boolean);
  return parts.some((p) =>
    p.endsWith("/*") ? mime.startsWith(p.slice(0, -1)) : mime.toLowerCase() === p.toLowerCase(),
  );
}

// Slug simple
function slugify(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w.\- ]+/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 100);
}

function randomId(len = 8): string {
  const bytes = new Uint8Array(len);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
    .slice(0, len);
}

export async function listPatientFiles(patientId: string): Promise<PatientFile[]> {
  const supabase = getSupabaseBrowser();
  const { data, error } = await supabase
    .from("patient_files")
    .select("*")
    .eq("patient_id", patientId)
    .order("created_at", { ascending: false });
  if (error)
    throw new Error(
      (error as any)?.message ?? (error as any)?.details ?? (error as any)?.hint ?? "Unknown error",
    );
  return (data || []) as PatientFile[];
}

export async function uploadPatientFile(
  patientId: string,
  file: File,
): Promise<PatientFile | null> {
  const supabase = getSupabaseBrowser();

  // Validaciones
  const userRes = await supabase.auth.getUser();
  const uid = userRes.data.user?.id;
  if (!uid) throw new Error("No hay sesión.");
  if (!file) throw new Error("Archivo requerido.");
  const sizeMB = file.size / (1024 * 1024);
  if (sizeMB > MAX_MB) throw new Error(`Archivo demasiado grande. Máximo ${MAX_MB} MB.`);
  if (!mimeAllowed(file.type || ""))
    throw new Error(`Tipo no permitido (${file.type || "desconocido"}). Permitidos: ${ALLOWED}`);

  // **CLAVE COMPATIBLE CON RLS**: <uid>/patients/<patientId>/<yyyy>/<mm>/<timestamp>-<rand>-<slug>
  const now = new Date();
  const yyyy = now.getUTCFullYear();
  const mm = String(now.getUTCMonth() + 1).padStart(2, "0");
  const ts = now.toISOString().replace(/[:.Z]/g, "").replace("T", "-");
  const key = [
    uid,
    "patients",
    patientId,
    `${yyyy}`,
    `${mm}`,
    `${ts}-${randomId(6)}-${slugify(file.name)}`,
  ].join("/");

  // Subida (bucket privado 'uploads')
  const up = await supabase.storage.from("uploads").upload(key, file, {
    contentType: file.type || "application/octet-stream",
    upsert: false,
    cacheControl: "3600",
  });
  if (up.error) throw up.error;

  // Inserta metadatos
  const { data, error } = await supabase
    .from("patient_files")
    .insert({
      user_id: uid,
      patient_id: patientId,
      path: key,
      file_name: file.name,
      size: file.size,
      mime_type: file.type || null,
    })
    .select("*")
    .single();

  if (error) {
    // Limpieza si falla el insert
    await supabase.storage
      .from("uploads")
      .remove([key])
      .catch(() => {});
    throw new Error(
      (error as any)?.message ?? (error as any)?.details ?? (error as any)?.hint ?? "Unknown error",
    );
  }

  return data as PatientFile;
}

export async function getSignedUrl(rec: PatientFile, ttlSeconds?: number): Promise<string> {
  const supabase = getSupabaseBrowser();
  const sec = Number(ttlSeconds || SIGNED_TTL || 300);
  const { data, error } = await supabase.storage.from("uploads").createSignedUrl(rec.path, sec);
  if (error)
    throw new Error(
      (error as any)?.message ?? (error as any)?.details ?? (error as any)?.hint ?? "Unknown error",
    );
  return data.signedUrl;
}

export async function deletePatientFile(id: string): Promise<void> {
  const supabase = getSupabaseBrowser();

  // Obtén key
  const { data: rec, error: e1 } = await supabase
    .from("patient_files")
    .select("id, path")
    .eq("id", id)
    .single();
  if (e1) throw e1;
  const key = rec!.path as string;

  // Borra en Storage
  const r1 = await supabase.storage.from("uploads").remove([key]);
  if (r1.error) throw r1.error;

  // Borra metadata
  const { error: e2 } = await supabase.from("patient_files").delete().eq("id", id);
  if (e2) throw e2;
}
