import { getSupabaseBrowser } from "@/lib/supabase-browser";

/**
 * Crea un Signed URL temporal para un objeto del bucket 'uploads'.
 * @param path Ruta del objeto dentro del bucket (ej.: "1699999999-ficha.pdf")
 * @param expires Segundos de validez (por defecto 300 = 5 min)
 */
export async function getSignedUrl(path: string, expires = 300): Promise<string> {
  const supabase = getSupabaseBrowser();
  const { data, error } = await supabase.storage.from("uploads").createSignedUrl(path, expires);
  if (error || !data?.signedUrl) throw new Error(error?.message || "No se pudo generar el enlace.");
  return data.signedUrl;
}
