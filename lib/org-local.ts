/**
 * Devuelve la organización activa desde localStorage.
 * Estructura esperada: activeOrgId, activeOrgName
 */
export function getActiveOrg() {
  if (typeof window === "undefined")
    return { id: null as string | null, name: null as string | null };
  const id = localStorage.getItem("activeOrgId");
  const name = localStorage.getItem("activeOrgName");
  return { id, name };
}

/** Establece/limpia la organización activa en localStorage */
export function setActiveOrg(id: string | null, name?: string | null) {
  if (typeof window === "undefined") return;
  if (id) {
    localStorage.setItem("activeOrgId", id);
    if (typeof name !== "undefined") {
      if (name) localStorage.setItem("activeOrgName", name);
      else localStorage.removeItem("activeOrgName");
    }
  } else {
    localStorage.removeItem("activeOrgId");
    localStorage.removeItem("activeOrgName");
  }
}
