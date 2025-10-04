// /workspaces/sanoa-lab/lib/supabase-browser.ts
"use client";

import type { SupabaseClient } from "@supabase/supabase-js";
import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/database-extended";

const NOT_CONFIGURED_MSG = "Supabase no está configurado";

// Singleton en el navegador
let browserClient: SupabaseClient<Database> | null = null;
let browserStub: SupabaseClient<Database> | null = null;

function createBrowserQueryStub() {
  // ✅ Pending permite any[] | null para compatibilidad entre select (array) y mutaciones (null)
  type Pending = { data: any[] | null; error: { message: string } };

  const listResult: Pending = { data: [] as any[], error: { message: NOT_CONFIGURED_MSG } };
  const mutationResult: Pending = { data: null, error: { message: NOT_CONFIGURED_MSG } };
  let pendingResult: Pending = listResult;

  const chain: any = {
    select: () => {
      pendingResult = listResult;
      return chain;
    },
    eq: () => chain,
    ilike: () => chain,
    gte: () => chain,
    lte: () => chain,
    in: () => chain,
    limit: () => chain,
    order: () => chain,
    range: () => chain,
    match: () => chain,
    contains: () => chain,
    textSearch: () => chain,
    returns: () => chain,
    maybeSingle: async () => ({ data: null, error: { message: NOT_CONFIGURED_MSG } }),
    single: async () => ({ data: null, error: { message: NOT_CONFIGURED_MSG } }),
    insert: () => {
      pendingResult = mutationResult;
      return chain;
    },
    update: () => {
      pendingResult = mutationResult;
      return chain;
    },
    upsert: () => {
      pendingResult = mutationResult;
      return chain;
    },
    delete: () => {
      pendingResult = mutationResult;
      return chain;
    },
    throwOnError: () => chain,
  };

  // Hace que el stub sea "thenable" como las llamadas reales de Supabase
  chain.then = (resolve: any, reject: any) =>
    Promise.resolve(pendingResult).then(resolve, reject);

  return chain;
}

function getBrowserStub(): SupabaseClient<Database> {
  if (browserStub) return browserStub;

  const stub: any = {
    auth: {
      async getSession() {
        return { data: { session: null }, error: { message: NOT_CONFIGURED_MSG } };
      },
      async getUser() {
        return { data: { user: null }, error: { message: NOT_CONFIGURED_MSG } };
      },
      async signInWithPassword() {
        return {
          data: { session: null, user: null },
          error: { message: NOT_CONFIGURED_MSG },
        };
      },
      async signInWithOtp() {
        return { data: { session: null }, error: { message: NOT_CONFIGURED_MSG } };
      },
      async signOut() {
        return { error: { message: NOT_CONFIGURED_MSG } };
      },
      async signUp() {
        return {
          data: { user: null, session: null },
          error: { message: NOT_CONFIGURED_MSG },
        };
      },
      async updateUser() {
        return { data: { user: null }, error: { message: NOT_CONFIGURED_MSG } };
      },
      async resetPasswordForEmail() {
        return { data: null, error: { message: NOT_CONFIGURED_MSG } };
      },
      onAuthStateChange() {
        const subscription = { unsubscribe() {} };
        return {
          data: { subscription },
          error: { message: NOT_CONFIGURED_MSG },
        };
      },
    },

    from() {
      return createBrowserQueryStub();
    },
    rpc() {
      return createBrowserQueryStub();
    },

    // Stubs de realtime para evitar errores si no hay envs
    channel() {
      const ch: any = {
        on: () => ch,
        subscribe: () => ch,
        unsubscribe: () => {},
      };
      return ch;
    },
    removeChannel: (_ch?: any) => {
      // no-op
    },

    storage: {
      from() {
        return {
          upload: async () => ({ error: { message: NOT_CONFIGURED_MSG } }),
          remove: async () => ({ error: { message: NOT_CONFIGURED_MSG } }),
          download: async () => ({ data: null, error: { message: NOT_CONFIGURED_MSG } }),
          list: async () => ({ data: [], error: { message: NOT_CONFIGURED_MSG } }),
        };
      },
    },
  };

  browserStub = stub as SupabaseClient<Database>;
  return browserStub;
}

/**
 * Cliente de Supabase para el navegador (singleton).
 * Si faltan variables de entorno, devuelve un stub seguro que no rompe la app.
 */
export function getSupabaseBrowser(): SupabaseClient<Database> {
  if (browserClient) return browserClient;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anon) {
    return getBrowserStub();
  }

  browserClient = createBrowserClient<Database>(url, anon, {
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

  return browserClient;
}

/** Export directo por conveniencia (misma instancia tipada) */
export const supabase: SupabaseClient<Database> = getSupabaseBrowser();
