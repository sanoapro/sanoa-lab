// /workspaces/sanoa-lab/lib/supabase/client.ts
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { DatabaseExtended } from "@/types/database-extended";

let client: SupabaseClient<DatabaseExtended> | null = null;

export function getSupabaseClient(): SupabaseClient<DatabaseExtended> {
  if (client) return client;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anon) {
    throw new Error("Supabase no está configurado en el entorno del cliente.");
  }

  client = createClient<DatabaseExtended>(url, anon);
  return client;
}
