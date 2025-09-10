import { cookies } from "next/headers";
import { createServerComponentClient, type SupabaseClient } from "@supabase/auth-helpers-nextjs";
import type { Database } from "../database.types";

export function getSupabaseServer(): SupabaseClient<Database> {
  return createServerComponentClient<Database>({ cookies });
}
