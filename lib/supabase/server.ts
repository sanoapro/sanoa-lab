// /workspaces/sanoa-lab/lib/supabase/server.ts
import { cookies as nextCookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { createClient as createSupabaseAdmin, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

const NOT_CONFIGURED_MSG = "Supabase no está configurado";

/* ----------------------------- STUBS DE SEGURIDAD ---------------------------- */
function createQueryStub() {
  const listResult = { data: [] as any[], error: { message: NOT_CONFIGURED_MSG } };
  const singleResult = { data: null, error: { message: NOT_CONFIGURED_MSG } };
  const mutationResult = { data: null, error: { message: NOT_CONFIGURED_MSG } };

  let pendingResult = listResult;

  const chain: any = {
    // lectura
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

    // resultados
    maybeSingle: async () => singleResult,
    single: async () => singleResult,

    // mutaciones
    insert: () => ((pendingResult = mutationResult), chain),
    update: () => ((pendingResult = mutationResult), chain),
    upsert: () => ((pendingResult = mutationResult), chain),
    delete: () => ((pendingResult = mutationResult), chain),

    throwOnError: () => chain,
  };

  // thenable para imitar PostgrestQueryBuilder
  chain.then = (resolve: any, reject: any) =>
    Promise.resolve(pendingResult).then(resolve, reject);

  return chain;
}

function createSupabaseStub(): SupabaseClient<Database> {
  const stub: any = {
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
    rpc() {
      return createQueryStub();
    },
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
    channel() {
      const ch: any = {
        on: () => ch,
        subscribe: () => ({ data: { error: NOT_CONFIGURED_MSG } }),
        unsubscribe: () => {},
      };
      return ch;
    },
    removeChannel: () => {},
  };

  return stub as SupabaseClient<Database>;
}
/* --------------------------------------------------------------------------- */

/**
 * Cliente servidor para Route Handlers / Server Components.
 * - Usa la ANON KEY para respetar RLS.
 * - Maneja cookies con el adaptador de @supabase/ssr.
 * - Si faltan envs, devuelve un stub seguro que no rompe.
 */
export function getSupabaseServer(): SupabaseClient<Database> {
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
          // En RSC puede lanzar; en Route Handlers funciona
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
    auth: {
      persistSession: false,
      detectSessionInUrl: false,
      flowType: "pkce",
      autoRefreshToken: false,
    },
    global: {
      headers: { "x-client-info": "sanoa-web" },
    },
  });
}

/**
 * Cliente con Service Role para procesos backend (jobs, webhooks, exports).
 * ⚠️ NUNCA usar en endpoints que dependan de RLS/usuarios.
 */
export function createServiceClient(): SupabaseClient<Database> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    return createSupabaseStub();
  }
  return createSupabaseAdmin<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { "x-client-info": "sanoa-web-svc" } },
  });
}

/** Alias históricos (si puedes, evita sombrear `createClient` del SDK). */
export const createClient = getSupabaseServer;
export const supaServer = getSupabaseServer;
export const supabase = getSupabaseServer(); // opcional si te gusta tener una instancia directa
