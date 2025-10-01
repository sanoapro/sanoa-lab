"use client";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

const NOT_CONFIGURED_MSG = "Supabase no está configurado";

let browserClient: SupabaseClient<Database> | null = null;
let browserStub: SupabaseClient<Database> | null = null;

function createBrowserQueryStub() {
  const listResult = { data: [] as any[], error: { message: NOT_CONFIGURED_MSG } };
  const mutationResult = { data: null, error: { message: NOT_CONFIGURED_MSG } };
  let pendingResult = listResult;

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

  browserStub = stub;
  return stub;
}

export function getSupabaseBrowser() {
  if (browserClient) return browserClient;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anon) {
    return getBrowserStub();
  }

  browserClient = createClient<Database>(url, anon, {
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
