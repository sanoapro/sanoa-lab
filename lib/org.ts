// /workspaces/sanoa-lab/lib/org.ts
import { getSupabaseBrowser } from "@/lib/supabase-browser";

/**
 * ====== Compatibilidad con tu código existente (vista v_my_orgs) ======
 */
export type MyOrg = {
  id: string;
  name: string;
  slug: string | null;
  is_personal: boolean;
  role: "owner" | "admin" | "editor" | "viewer"; // mantenido
};

const LS_KEY = "sanoa.currentOrg";

/**
 * Lista de orgs (vista v_my_orgs) — SIN CAMBIOS para no romper compatibilidad.
 */
export async function listMyOrgs(): Promise<MyOrg[]> {
  const supabase = getSupabaseBrowser();
  const { data, error } = await supabase.from("v_my_orgs").select("id,name,slug,is_personal,role");
  if (error) throw error;
  return (data || []) as MyOrg[];
}

/**
 * Obtiene el org actual priorizando:
 * 1) user_prefs.current_org_id
 * 2) localStorage (solo cliente)
 * 3) primera org disponible (nuevo modelo organizations → fallback a v_my_orgs)
 *    y, si existe, la persiste en user_prefs + localStorage.
 */
export async function getCurrentOrgId(): Promise<string | null> {
  const supabase = getSupabaseBrowser();

  // 1) user_prefs
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("user_prefs")
    .select("current_org_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!error && data?.current_org_id) {
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(LS_KEY, data.current_org_id);
      } catch {}
    }
    return data.current_org_id;
  }

  // 2) localStorage (solo en cliente)
  if (typeof window !== "undefined") {
    try {
      const ls = localStorage.getItem(LS_KEY);
      if (ls) return ls;
    } catch {}
  }

  // 3) primera org disponible
  let first: string | null = null;

  // Preferir nuevo modelo (organizations + organization_members)
  try {
    const orgsNew = await listMyOrganizations();
    first = orgsNew[0]?.id ?? null;
  } catch {
    // ignorar — puede que aún no existan las tablas nuevas
  }

  // Fallback a la vista v_my_orgs si no hay nada en el nuevo modelo
  if (!first) {
    const orgsOld = await listMyOrgs();
    first = orgsOld[0]?.id ?? null;
  }

  if (first) {
    await setCurrentOrgId(first); // persiste en user_prefs + LS + dispara evento
    return first;
  }

  return null;
}

/**
 * Fija el org actual en user_prefs + localStorage y dispara evento de cambio.
 */
export async function setCurrentOrgId(orgId: string): Promise<void> {
  const supabase = getSupabaseBrowser();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("No hay sesión");

  const nowIso = new Date().toISOString();
  const { error } = await supabase.from("user_prefs").upsert({
    user_id: user.id,
    current_org_id: orgId,
    updated_at: nowIso,
  });
  if (error) throw error;

  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(LS_KEY, orgId);
    } catch {}
    window.dispatchEvent(new CustomEvent("sanoa:org-changed", { detail: { orgId } }));
  }
}

/**
 * ====== NUEVO MODELO (organizations / organization_members) ======
 * Estas funciones agregan capacidades sin romper lo existente.
 */

export type OrgRole = "owner" | "admin" | "member";

export interface Organization {
  id: string;
  owner_user_id: string;
  name: string;
  created_at: string;
}

export interface OrgMember {
  org_id: string;
  user_id: string;
  role: OrgRole;
  created_at: string;
}

/**
 * Lista todas las organizaciones donde el usuario es owner o miembro.
 * (filtra memberships por user_id para no depender únicamente de RLS)
 */
export async function listMyOrganizations(): Promise<Organization[]> {
  const supabase = getSupabaseBrowser();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: asOwner, error: errOwner } = await supabase
    .from("organizations")
    .select("*")
    .eq("owner_user_id", user.id);
  if (errOwner) throw errOwner;

  const { data: memberships, error: errMem } = await supabase
    .from("organization_members")
    .select("org_id")
    .eq("user_id", user.id);
  if (errMem) throw errMem;

  const orgIds = new Set<string>([
    ...(asOwner ?? []).map((o) => o.id),
    ...(memberships ?? []).map((m) => m.org_id),
  ]);
  if (orgIds.size === 0) return [];

  const { data, error } = await supabase
    .from("organizations")
    .select("*")
    .in("id", Array.from(orgIds))
    .order("created_at", { ascending: false });
  if (error) throw error;

  return (data ?? []) as Organization[];
}

/**
 * Crea una organización y asegura que el creador quede como owner (membership).
 */
export async function createOrganization(name: string): Promise<Organization> {
  const supabase = getSupabaseBrowser();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("No hay sesión.");

  const { data: org, error } = await supabase
    .from("organizations")
    .insert({ owner_user_id: user.id, name })
    .select("*")
    .single();
  if (error) throw error;

  // upsert de membership como owner
  const { error: upErr } = await supabase
    .from("organization_members")
    .upsert({ org_id: org.id, user_id: user.id, role: "owner" });
  if (upErr) throw upErr;

  return org as Organization;
}

/**
 * Lista miembros de una organización.
 */
export async function listMembers(orgId: string): Promise<OrgMember[]> {
  const supabase = getSupabaseBrowser();
  const { data, error } = await supabase
    .from("organization_members")
    .select("*")
    .eq("org_id", orgId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as OrgMember[];
}

/**
 * Cambia el rol de un miembro en una organización.
 */
export async function setMemberRole(orgId: string, userId: string, role: OrgRole): Promise<void> {
  const supabase = getSupabaseBrowser();
  const { error } = await supabase
    .from("organization_members")
    .update({ role })
    .eq("org_id", orgId)
    .eq("user_id", userId);
  if (error) throw error;
}
