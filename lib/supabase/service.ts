// /workspaces/sanoa-lab/lib/supabase/service.ts
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { DatabaseExtended as Database } from "@/types/database-extended";

const NOT_CONFIGURED_MSG = "Supabase (service) no está configurado";

/** Query/RPC stub encadenable para no romper en runtime si faltan envs. */
function createQueryStub() {
  const listResult = { data: [] as any[], error: { message: NOT_CONFIGURED_MSG } };
  const singleResult = { data: null as any, error: { message: NOT_CONFIGURED_MSG } };
  const mutationResult = { data: [] as any[], error: { message: NOT_CONFIGURED_MSG } };
  let pending: any = listResult;

  const chain: any = (..._args: any[]) => chain;
  Object.assign(chain, {
    select: (..._args: any[]) => ((pending = listResult), chain),
    eq: (..._args: any[]) => chain,
    neq: (..._args: any[]) => chain,
    gt: (..._args: any[]) => chain,
    lt: (..._args: any[]) => chain,
    gte: (..._args: any[]) => chain,
    lte: (..._args: any[]) => chain,
    in: (..._args: any[]) => chain,
    not: (..._args: any[]) => chain,
    or: (..._args: any[]) => chain,
    filter: (..._args: any[]) => chain,
    contains: (..._args: any[]) => chain,
    textSearch: (..._args: any[]) => chain,
    order: (..._args: any[]) => chain,
    range: (..._args: any[]) => chain,
    limit: (..._args: any[]) => chain,
    match: (..._args: any[]) => chain,
    returns: (..._args: any[]) => chain,
    maybeSingle: async () => singleResult,
    single: async () => singleResult,
    insert: (..._args: any[]) => ((pending = mutationResult), chain),
    update: (..._args: any[]) => ((pending = mutationResult), chain),
    upsert: (..._args: any[]) => ((pending = mutationResult), chain),
    delete: (..._args: any[]) => ((pending = mutationResult), chain),
    throwOnError: (..._args: any[]) => chain,
    then: (res: any, rej: any) => Promise.resolve(pending).then(res, rej),
    catch: (rej: any) => Promise.resolve(pending).catch(rej),
    finally: (cb: any) => Promise.resolve(pending).finally(cb),
  });
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
