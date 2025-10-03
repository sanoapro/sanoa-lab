// lib/supabase/server.ts
import { cookies as nextCookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { createClient as createSupabaseAdmin } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types"; // Ajusta la ruta si es distinta

const NOT_CONFIGURED_MSG = "Supabase no está configurado";

/* ----------------------------- STUBS DE SEGURIDAD ---------------------------- */
function createQueryStub() {
  const listResult = { data: [] as any[], error: { message: NOT_CONFIGURED_MSG } };
  const singleResult = { data: null, error: { message: NOT_CONFIGURED_MSG } };
  const mutationResult = { data: null, error: { message: NOT_CONFIGURED_MSG } };

  let pendingResult = listResult;

  const chain: any = {
    select: () => ((pendingResult = listResult), chain),
    eq: () => chain,
    neq: () => chain,
    gt: () => chain,
    lt: () => chain,
    gte: () => chain,
    lte: () => chain,
    in: () => chain,
    not: () => chain,
    or: () => chain,
    filter: () => chain,
    contains: () => chain,
    textSearch: () => chain,
    order: () => chain,
    range: () => chain,
    limit: () => chain,
    match: () => chain,
    returns: () => chain,
    maybeSingle: async () => singleResult,
    single: async () => singleResult,
    insert: () => ((pendingResult = mutationResult), chain),
    update: () => ((pendingResult = mutationResult), chain),
    upsert: () => ((pendingResult = mutationResult), chain),
    delete: () => ((pendingResult = mutationResult), chain),
    throwOnError: () => chain,
  };

  chain.then = (resolve: any, reject: any) => Promise.resolve(pendingResult).then(resolve, reject);
  return chain;
}

function createSupabaseStub() {
  return {
    auth: {
      async getUser() {
        return { data: { user: null }, error: { message: NOT_CONFIGURED_MSG } };
      },
      async getSession() {
        return { data: { session: null }, error: { message: NOT_CONFIGURED_MSG } };
      },
      async signOut() {
        return { error: { message: NOT_CONFIGURED_MSG } };
      },
    },
    from() {
      return createQueryStub();
    },
    rpc: async () => ({ data: null, error: { message: NOT_CONFIGURED_MSG } }),
    storage: {
      from() {
        return {
          upload: async () => ({ error: { message: NOT_CONFIGURED_MSG } }),
          download: async () => ({ data: null, error: { message: NOT_CONFIGURED_MSG } }),
          remove: async () => ({ error: { message: NOT_CONFIGURED_MSG } }),
          list: async () => ({ data: [], error: { message: NOT_CONFIGURED_MSG } }),
        };
      },
    },
    channel: () => ({
      on: () => ({ subscribe: () => ({ data: { error: NOT_CONFIGURED_MSG } }) }),
      subscribe: () => ({ data: { error: NOT_CONFIGURED_MSG } }),
    }),
  } as any;
}
/* --------------------------------------------------------------------------- */

/**
 * Cliente servidor para Route Handlers / Server Components
 * - Usa SIEMPRE la ANON KEY para respetar RLS por sesión.
 * - El adaptador `cookies` sigue exactamente la forma esperada por @supabase/ssr@0.7.x.
 * - En entornos donde no se pueden setear cookies (p. ej., RSC), capturamos y seguimos sin romper.
 */
export function getSupabaseServer() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !anonKey) {
    return createSupabaseStub();
  }

  const store = nextCookies();

  return createServerClient<Database>(supabaseUrl, anonKey, {
    cookies: {
      get(name: string) {
        try {
          return store.get(name)?.value;
        } catch {
          return undefined;
        }
      },
      set(name: string, value: string, options?: Record<string, any>) {
        try {
          // En RSC puede fallar set(); en Route Handlers funciona
          store.set({ name, value, ...(options ?? {}) });
        } catch {
          /* no-op */
        }
      },
      remove(name: string, options?: Record<string, any>) {
        try {
          store.set({ name, value: "", ...(options ?? {}), maxAge: 0 });
        } catch {
          /* no-op */
        }
      },
    },
  });
}

/**
 * Cliente con Service Role para procesos backend (jobs, webhooks, exports).
 * NUNCA usar en endpoints de usuario con RLS.
 */
export function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    return createSupabaseStub();
  }
  return createSupabaseAdmin(url, key, { auth: { persistSession: false } });
}

/** Alias históricos para compatibilidad con imports existentes */
export const createClient = getSupabaseServer;
export const supaServer = getSupabaseServer;
