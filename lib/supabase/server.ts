// lib/supabase/server.ts
import { cookies as nextCookies, headers as nextHeaders } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { createClient as createSupabaseAdmin } from "@supabase/supabase-js";

/**
 * Cliente para Route Handlers / Server Components (Next 15: cookies/headers con await)
 * - Usa SIEMPRE la ANON KEY (NUNCA service) para respetar RLS por sesión.
 * - Implementa set/remove sólo si el entorno lo permite (Route Handlers).
 */
export async function getSupabaseServer() {
  const cookieStore = await nextCookies(); // ✅ Next 15
  const hdrs = await nextHeaders();        // ✅ Next 15

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !anonKey) {
    throw new Error(
      "Faltan variables NEXT_PUBLIC_SUPABASE_URL o NEXT_PUBLIC_SUPABASE_ANON_KEY (no se debe usar service key aquí)."
    );
  }

  // Detecta si el store soporta set/delete (Route Handlers). En Server Components no.
  const canSet = typeof (cookieStore as any)?.set === "function";
  const canDelete = typeof (cookieStore as any)?.delete === "function";

  return createServerClient(supabaseUrl, anonKey, {
    cookies: {
      get: (name: string) => {
        try {
          return cookieStore.get(name)?.value;
        } catch {
          return undefined;
        }
      },
      set: (name: string, value: string, options?: Parameters<(typeof cookieStore)["set"]>[2]) => {
        try {
          if (canSet) {
            // En Route Handlers podemos setear cookies
            (cookieStore as any).set(name, value, options);
          } else {
            // En Server Components, ignoramos silenciosamente
          }
        } catch {
          // no-op
        }
      },
      remove: (name: string, options?: Parameters<(typeof cookieStore)["set"]>[2]) => {
        try {
          if (canDelete) {
            (cookieStore as any).delete(name);
          } else if (canSet) {
            // Fallback: setear expiración inmediata
            (cookieStore as any).set(name, "", { ...options, maxAge: 0 });
          } else {
            // En Server Components, ignoramos
          }
        } catch {
          // no-op
        }
      },
    },
    headers: {
      get: (name: string) => {
        try {
          return hdrs.get(name) ?? undefined;
        } catch {
          return undefined;
        }
      },
    },
  });
}

/** Service role para backend (sin sesión, jobs/webhooks/exports). NUNCA usar en endpoints con RLS de usuario. */
export function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("Faltan variables NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY.");
  }
  return createSupabaseAdmin(url, key, { auth: { persistSession: false } });
}

/** Alias histórico (algunos archivos lo importan) */
export const createClient = getSupabaseServer;
export const supaServer = getSupabaseServer;
