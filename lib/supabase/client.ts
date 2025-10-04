import type { Database } from "@/types/database.types";
import type { Database } from "@/types/database.types";
import type { Database } from "@/types/database.types";
// /workspaces/sanoa-lab/lib/supabase/client.ts
"use client";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

let client: SupabaseClient<Database> | null = null;

export function getSupabaseClient(): SupabaseClient<Database> {
  // Evita que se use desde SSR por accidente
  if (typeof window === "undefined") {
    throw new Error(
      "getSupabaseClient() solo debe usarse en el cliente. Usa getSupabaseServer() en server."
    );
  }

  if (client) return client;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anon) {
    throw new Error("Supabase no está configurado en variables públicas (NEXT_PUBLIC_*).");
  }

  client = createClient<Database>(url, anon, {
    auth: {
      flowType: "pkce",
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
    global: {
      headers: { "x-client-info": "sanoa-web" },
    },
  });

  return client;
}

// Export práctico (misma instancia)
export const supabase = getSupabaseClient();
