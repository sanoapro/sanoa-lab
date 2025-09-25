// /workspaces/sanoa-lab/lib/supabase/server.ts
import { cookies, headers } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";

/**
 * Cliente de Supabase para **Route Handlers** y **Server Components**
 * - Usa ANON KEY (sesión por cookies) y cae a SERVICE_ROLE si no está (para no bloquearte).
 * - No hace set/remove de cookies (no lo solemos necesitar en handlers).
 */
export function getSupabaseServer() {
  const cookieStore = cookies();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY!;

  return createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      get: (name: string) => {
        try {
          return cookieStore.get(name)?.value;
        } catch {
          return undefined;
        }
      },
      // En server handlers normalmente no seteamos cookies:
      set: () => {},
      remove: () => {},
    },
    headers: {
      get: (name: string) => {
        try {
          return headers().get(name) ?? undefined;
        } catch {
          return undefined;
        }
      },
    },
  });
}

/**
 * Cliente **service role** (sin sesión) para tareas de backend
 * - Usa SUPABASE_SERVICE_ROLE_KEY (no persistimos sesión)
 * - Úsalo solo en **server-side** seguro (nunca en el cliente)
 */
export function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(url, key, {
    auth: { persistSession: false },
  });
}

/** Alias opcional si en algún lugar importabas `supaServer()` */
export const supaServer = getSupabaseServer;
