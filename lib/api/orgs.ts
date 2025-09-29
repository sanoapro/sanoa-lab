import type { SupabaseClient } from "@supabase/supabase-js";

export async function userBelongsToOrg(
  supa: SupabaseClient<any, any, any>,
  orgId: string,
  userId: string,
): Promise<boolean> {
  if (!orgId || !userId) return false;

  const { data, error } = await supa
    .from("organization_members")
    .select("org_id")
    .eq("org_id", orgId)
    .eq("user_id", userId)
    .maybeSingle();

  if (!error && data?.org_id === orgId) {
    return true;
  }

  if (error && error.code && error.code !== "PGRST116") {
    throw error;
  }

  const { data: legacy, error: legacyError } = await supa
    .from("v_my_orgs")
    .select("id")
    .eq("id", orgId)
    .maybeSingle();

  if (legacyError && legacyError.code && legacyError.code !== "PGRST116") {
    throw legacyError;
  }

  return !!legacy?.id;
}
