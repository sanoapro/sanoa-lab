// lib/supabase/client.ts
// Cliente perezoso (lazy): se crea sólo cuando lo pides y SÓLO si hay variables.
// Evita que la app truene al cargar si faltan env vars en desarrollo.
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let _client: SupabaseClient | null = null;

export function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anon) {
    throw new Error(
      "Faltan variables de entorno de Supabase. Define NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY en .env.local y reinicia `npm run dev`."
    );
  }

  if (!_client) {
    _client = createClient(url, anon);
  }
  return _client;
}
