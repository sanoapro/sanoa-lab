// /workspaces/sanoa-lab/lib/supabase/service.ts
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

const NOT_CONFIGURED_MSG = "Supabase (service) no está configurado";

/** Query/RPC stub encadenable para no romper en runtime si faltan envs. */
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

/** Cliente stub para cuando faltan envs o se usa desde el browser por error. */
function createServiceStub(): SupabaseClient<Database> {
  const stub: any = {
    from: () => createQueryStub(),
    rpc: () => createQueryStub(),
    auth: {
      getUser: async () => ({ data: { user: null }, error: { message: NOT_CONFIGURED_MSG } }),
      getSession: async () => ({ data: { session: null }, error: { message: NOT_CONFIGURED_MSG } }),
      signOut: async () => ({ error: { message: NOT_CONFIGURED_MSG } }),
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
  };
  return stub as SupabaseClient<Database>;
}

let svcClient: SupabaseClient<Database> | null = null;

/**
 * Cliente con Service Role (solo servidor: jobs, webhooks, cron, exports).
 * ⚠️ NUNCA usar en endpoints expuestos a usuarios (RLS se salta).
 */
export function createServiceClient(): SupabaseClient<Database> {
  if (svcClient) return svcClient;

  // Evita uso accidental en el navegador
  if (typeof window !== "undefined") {
    console.warn("[supabase:service] createServiceClient() no debe usarse en el browser.");
    return (svcClient = createServiceStub());
  }

  const url =
    process.env.SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL || // aceptable para URL
    "";

  const svc = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

  if (!url || !svc) {
    return (svcClient = createServiceStub());
  }

  svcClient = createClient<Database>(url, svc, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    global: {
      headers: { "x-client-info": "sanoa-web-svc" },
    },
  });

  return svcClient;
}

/** Export opcional de instancia si te gusta importar directo. */
export const supabaseService: SupabaseClient<Database> = createServiceClient();
