// /workspaces/sanoa-lab/lib/supabase/client.ts
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { DatabaseExtended } from "@/types/database-extended";

export function getSupabaseClient(): SupabaseClient<DatabaseExtended> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient<DatabaseExtended>(url, anon);
}

export const supabase = getSupabaseClient();
