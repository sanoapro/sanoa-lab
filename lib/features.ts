import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
import { createClient as createServerClient } from "@/lib/supabase/server";

/**
 * Devuelve el cliente de Supabase de manera SINCRÓNICA.
 * Si tu helper `createServerClient` ya es síncrono, esto funciona tal cual.
 * (Si lo volviste async en otro cambio, regrésalo a síncrono para evitar Promises aquí.)
 */
const supa = (): SupabaseClient<Database> => createServerClient();

/**
 * Verifica si una organización tiene un feature habilitado.
 * Usa un HEAD con count para no traer filas completas.
 */
export async function hasFeatureServer(orgId: string, featureId: string): Promise<boolean> {
  const { count, error } = await supa()
    .from("org_features")
    .select("feature_id", { count: "exact", head: true })
    .eq("org_id", orgId)
    .eq("feature_id", featureId);

  if (error) {
    // Opcional: console.warn("hasFeatureServer error", error);
    return false;
  }
  return (count ?? 0) > 0;
}
