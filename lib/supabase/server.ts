import { cookies, headers } from "next/headers";
import { createServerClient } from "@supabase/ssr";

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

/** Alias opcional si en algún lugar importabas `supaServer()` */
export const supaServer = getSupabaseServer;
