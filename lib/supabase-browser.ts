"use client";

import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
// Si tienes tipos de DB, puedes poner: createClientComponentClient<Database>()
let _client: ReturnType<typeof createClientComponentClient> | null = null;

export function getSupabaseBrowser() {
  if (!_client) _client = createClientComponentClient();
  return _client;
}
