import { getSupabaseBrowser } from "@/lib/supabase-browser";

export type MyOrg = {
  id: string;
  name: string;
  slug: string | null;
  is_personal: boolean;
  role: "owner" | "admin" | "editor" | "viewer";
};

const LS_KEY = "sanoa.currentOrg";

export async function listMyOrgs(): Promise<MyOrg[]> {
  const supabase = getSupabaseBrowser() as any;
  const { data, error } = await supabase.from("v_my_orgs").select("id,name,slug,is_personal,role");
  if (error) throw error;
  return (data || []) as MyOrg[];
}

export async function getCurrentOrgId(): Promise<string | null> {
  const supabase = getSupabaseBrowser() as any;
  // 1) intenta user_prefs
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) return null;
  const uid = user.user.id;

  const { data, error } = await supabase
    .from("user_org_prefs")
    .select("current_org_id")
    .eq("user_id", uid)
    .maybeSingle();
  if (!error && data?.current_org_id) {
    localStorage.setItem(LS_KEY, data.current_org_id);
    return data.current_org_id;
  }

  // 2) fallback a LS
  const ls = localStorage.getItem(LS_KEY);
  if (ls) return ls;

  // 3) primer org disponible
  const orgs = await listMyOrgs();
  const first = orgs[0]?.id || null;
  if (first) localStorage.setItem(LS_KEY, first);
  return first;
}

export async function setCurrentOrgId(orgId: string): Promise<void> {
  const supabase = getSupabaseBrowser() as any;
  const { data: user } = await supabase.auth.getUser();
  const uid = user.user?.id;
  if (!uid) throw new Error("No hay sesión");

  await supabase
    .from("user_org_prefs")
    .upsert({ user_id: uid, current_org_id: orgId, updated_at: new Date().toISOString() });
  localStorage.setItem(LS_KEY, orgId);
  // notifica a la app
  window.dispatchEvent(new CustomEvent("sanoa:org-changed", { detail: { orgId } }));
}
