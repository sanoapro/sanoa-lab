import { createClientComponentClient, type SupabaseClient } from "@supabase/auth-helpers-nextjs";
import type { Database } from "./database.types";

let _client: SupabaseClient<Database> | null = null;

export function getSupabaseBrowser(): SupabaseClient<Database> {
  if (!_client) _client = createClientComponentClient<Database>();
  return _client;
}
