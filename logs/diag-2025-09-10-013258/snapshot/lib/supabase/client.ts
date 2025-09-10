import { cookies } from "next/headers";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../database.types";

export function getSupabaseServer(): SupabaseClient<Database> {
  return createServerComponentClient<Database>({ cookies });
}
