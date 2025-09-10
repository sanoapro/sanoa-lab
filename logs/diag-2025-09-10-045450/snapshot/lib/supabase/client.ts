import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let _client: SupabaseClient | null = null;

function envOrThrow(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

export function getSupabaseAnon(): SupabaseClient {
  if (!_client) {
    const url = envOrThrow("NEXT_PUBLIC_SUPABASE_URL");
    const anon = envOrThrow("NEXT_PUBLIC_SUPABASE_ANON_KEY");
    _client = createClient(url, anon);
  }
  return _client;
}

export const getSupabaseClient = getSupabaseAnon;

export const supabase = getSupabaseAnon();
export default supabase;
