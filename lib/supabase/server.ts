// lib/supabase/server.ts
import { cookies as nextCookies, headers as nextHeaders } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";

/** Cliente para Route Handlers / Server Components */
export async function getSupabaseServer() {
  const cookieStore = await nextCookies();   // ✅ Next 15 pide await
  const hdrs = await nextHeaders();          // ✅ Next 15 pide await

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY!;

  return createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      get: (name: string) => {
        try { return cookieStore.get(name)?.value; } catch { return undefined; }
      },
      set: () => {},
      remove: () => {},
    },
    headers: {
      get: (name: string) => {
        try { return hdrs.get(name) ?? undefined; } catch { return undefined; }
      },
    },
  });
}

/** Service role para backend (sin sesión) */
export function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(url, key, { auth: { persistSession: false } });
}

// (Mantén tus alias si ya existían)
export const supaServer = getSupabaseServer;
