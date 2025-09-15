/**
 * Devuelve la organización activa desde localStorage.
 * Estructura esperada (seteada por tu app): activeOrgId, activeOrgName
 */
export function getActiveOrg() {
  if (typeof window === "undefined") return { id: null as string | null, name: null as string | null };
  const id = localStorage.getItem("activeOrgId");
  const name = localStorage.getItem("activeOrgName");
  return { id, name };
}
