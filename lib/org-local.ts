/** Persistimos en localStorage el "org activo" para filtrar creaciones y listados en la UI */
export function getActiveOrg(): { id: string | null; name: string | null } {
  if (typeof window === "undefined") return { id: null, name: null };
  return { id: localStorage.getItem("activeOrgId"), name: localStorage.getItem("activeOrgName") };
}
export function setActiveOrg(id: string | null, name: string | null) {
  if (typeof window === "undefined") return;
  if (id) localStorage.setItem("activeOrgId", id); else localStorage.removeItem("activeOrgId");
  if (name) localStorage.setItem("activeOrgName", name); else localStorage.removeItem("activeOrgName");
}
