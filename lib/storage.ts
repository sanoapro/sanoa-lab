"use client";

import { getSupabaseBrowser } from "@/lib/supabase-browser";

/**
 * Genera una URL firmada para un objeto de Storage.
 * - bucket: por defecto usa NEXT_PUBLIC_UPLOADS_BUCKET o 'lab-results'
 * - path: clave exacta del archivo (sin slash inicial), p.ej: "REQ123/1716589000000-resultado.pdf"
 */
export async function getSignedUrl(
  path: string,
  opts?: { bucket?: string; expires?: number }
): Promise<string> {
  // Normaliza la path: sin slash inicial
  const key = path.replace(/^\/+/, "");

  const bucket =
    opts?.bucket ||
    process.env.NEXT_PUBLIC_UPLOADS_BUCKET ||
    "lab-results";

  const expires =
    typeof opts?.expires === "number"
      ? opts.expires
      : Number(process.env.NEXT_PUBLIC_SIGNED_URL_TTL || 300);

  const supabase = getSupabaseBrowser();
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(key, expires);

  if (error || !data?.signedUrl) {
    // Mensaje explícito para depurar rápido
    throw new Error(
      `${error?.message || "No se pudo generar el enlace."} [bucket=${bucket}] [path=${key}]`
    );
  }
  return data.signedUrl;
}
