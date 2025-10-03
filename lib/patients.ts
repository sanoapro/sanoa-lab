// /workspaces/sanoa-lab/lib/patients.ts
// Endurecido: siempre lanzamos `Error` nativo (no objetos de Supabase)
// y protegemos los efectos colaterales de RPC opcional.

import { getSupabaseBrowser } from "./supabase-browser";
import { getCurrentOrgId } from "./org"; // usamos tu API existente

export type Gender = "F" | "M" | "O";

export interface Patient {
  id: string;
  user_id: string;
  /** Puede no existir si tu DB aún no tiene esta columna */
  org_id?: string | null;
  nombre: string;
  edad: number | null;
  genero: Gender;
  created_at: string;
  updated_at: string;
  /** Puede no existir si tu DB aún no tiene esta columna */
  deleted_at?: string | null;
}

export interface PatientInput {
  nombre: string;
  edad?: number | null;
  genero?: Gender;
}

export interface ListPatientsParams {
  q?: string;
  page?: number;
  pageSize?: number;
  sortBy?: "created_at" | "nombre";
  direction?: "asc" | "desc";
  genero?: Gender | "ALL";
  from?: string;
  to?: string;
  includeDeleted?: boolean;

  tagsAny?: string[];
  tagsAll?: string[];

  onlyActiveOrg?: boolean;
}

export interface ListResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

/** Helper: normaliza cualquier cosa a Error nativo */
function toError(e: unknown, ctx?: string): Error {
  if (e instanceof Error) return e;
  if (e && typeof e === "object" && "message" in e) {
    const msg = String((e as any).message ?? "");
    return new Error(msg || ctx || "Error");
  }
  try {
    return new Error(ctx ? `${ctx}: ${JSON.stringify(e)}` : String(e));
  } catch {
    return new Error(ctx ? `${ctx}: ${String(e)}` : String(e));
  }
}

/** Caches de detección de esquema */
let _softDeleteSupported: boolean | null = null;
let _orgIdSupported: boolean | null = null;

/** Detecta si existe la columna deleted_at en patients */
async function softDeleteSupported(): Promise<boolean> {
  if (_softDeleteSupported !== null) return _softDeleteSupported;
  const supabase = getSupabaseBrowser();
  try {
    const { error } = await supabase.from("patients").select("deleted_at").limit(1);
    if (error) {
      const msg = String((error as any)?.message || "").toLowerCase();
      _softDeleteSupported = !(msg.includes("deleted_at") && msg.includes("does not exist"));
    } else {
      _softDeleteSupported = true;
    }
  } catch {
    _softDeleteSupported = true;
  }
  return _softDeleteSupported!;
}

/** Detecta si existe la columna org_id en patients */
async function orgIdSupported(): Promise<boolean> {
  if (_orgIdSupported !== null) return _orgIdSupported;
  const supabase = getSupabaseBrowser();
  try {
    const { error } = await supabase.from("patients").select("org_id").limit(1);
    if (error) {
      const msg = String((error as any)?.message || "").toLowerCase();
      _orgIdSupported = !(msg.includes("org_id") && msg.includes("does not exist"));
    } else {
      _orgIdSupported = true;
    }
  } catch {
    _orgIdSupported = false;
  }
  return _orgIdSupported!;
}

/** Helper: detecta si falta una RPC para degradar sin romper la UX */
function isMissingRpc(err: unknown, rpcName: string): boolean {
  const s = String((err as any)?.message || (err as any)?.details || "").toLowerCase();
  return s.includes("function") && s.includes(rpcName.toLowerCase()) && s.includes("does not exist");
}

/** Obtiene el user_id actual (compatibilidad) */
export async function getCurrentUserId(): Promise<string> {
  const supabase = getSupabaseBrowser();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    throw new Error("No hay sesión activa.");
  }
  return data.user.id;
}

/** Lista pacientes con búsqueda, filtros, orden, facetas de tags y (opcional) org activa */
export async function listPatients(params: ListPatientsParams = {}): Promise<ListResult<Patient>> {
  const supabase = getSupabaseBrowser();

  // Normalizaciones
  const page = Math.max(1, Number(params.page ?? 1));
  const pageSize = Math.min(100, Math.max(1, Number(params.pageSize ?? 10)));

  const allowedSort: Array<NonNullable<ListPatientsParams["sortBy"]>> = ["created_at", "nombre"];
  const sortBy = (params.sortBy && allowedSort.includes(params.sortBy) ? params.sortBy : "created_at") as NonNullable<
    ListPatientsParams["sortBy"]
  >;

  const direction = (params.direction ?? (sortBy === "created_at" ? "desc" : "asc")) as NonNullable<
    ListPatientsParams["direction"]
  >;

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  // --- Filtros por tags vía RPC opcional ---
  let idsByTags: string[] | null = null;
  const tagIds =
    params.tagsAll && params.tagsAll.length > 0
      ? params.tagsAll
      : params.tagsAny && params.tagsAny.length > 0
        ? params.tagsAny
        : [];

  if (tagIds.length > 0) {
    const mode = params.tagsAll && params.tagsAll.length > 0 ? "all" : "any";
    try {
      const { data: rows, error: e1 } = await supabase.rpc("patients_ids_by_tags", {
        tag_ids: tagIds,
        mode,
      });
      if (e1) {
        if (!isMissingRpc(e1, "patients_ids_by_tags")) throw toError(e1, "patients_ids_by_tags");
        // si falta la RPC, degradamos: no filtramos por tags
      } else {
        // ✅ Evita "possibly null": usa una constante local y decide temprano
        const idsFromRpc: string[] = (rows ?? []).map((r: any) => String(r.patient_id));
        if (idsFromRpc.length === 0) {
          return { items: [], total: 0, page, pageSize };
        }
        idsByTags = idsFromRpc;
      }
    } catch (e) {
      if (!isMissingRpc(e, "patients_ids_by_tags")) throw toError(e, "patients_ids_by_tags");
    }
  }

  let query = supabase
    .from("patients")
    .select("*", { count: "exact" })
    .order(sortBy, { ascending: direction === "asc" });

  // Soft-delete si existe la columna
  const hasSoft = await softDeleteSupported();
  if (hasSoft && !params.includeDeleted) {
    query = query.is("deleted_at", null);
  }

  // Búsqueda por nombre
  if (params.q && params.q.trim() !== "") {
    query = query.ilike("nombre", `%${params.q.trim()}%`);
  }

  // Género
  if (params.genero && params.genero !== "ALL") {
    query = query.eq("genero", params.genero);
  }

  // Rango de fechas de creación
  if (params.from) {
    const isoStart = new Date(params.from + "T00:00:00Z").toISOString();
    query = query.gte("created_at", isoStart);
  }
  if (params.to) {
    const isoEnd = new Date(params.to + "T23:59:59Z").toISOString();
    query = query.lte("created_at", isoEnd);
  }

  // Aplicar filtro por tags si tenemos IDs prefiltrados
  if (idsByTags?.length) {
    query = query.in("id", idsByTags);
  }

  // Limitar a la organización activa (si existe org_id y se solicita)
  if (params.onlyActiveOrg && (await orgIdSupported())) {
    const activeOrgId = await getCurrentOrgId().catch(() => null);
    if (activeOrgId) {
      query = query.eq("org_id", activeOrgId);
    }
  }

  const { data, error, count } = await query.range(from, to);
  if (error) throw toError(error, "listPatients");

  return {
    items: (data ?? []) as Patient[],
    total: count ?? 0,
    page,
    pageSize,
  };
}

/** Obtiene un paciente por id (si tienes permiso) */
export async function getPatient(id: string): Promise<Patient | null> {
  const supabase = getSupabaseBrowser();
  const { data, error } = await supabase.from("patients").select("*").eq("id", id).maybeSingle();
  if (error) throw toError(error, "getPatient");
  return (data as Patient) ?? null;
}

/** Crea un paciente */
export async function createPatient(input: PatientInput): Promise<Patient> {
  const supabase = getSupabaseBrowser();
  const userId = await getCurrentUserId();

  const payload: Record<string, unknown> = {
    user_id: userId,
    nombre: input.nombre,
    edad: input.edad ?? null,
    genero: (input.genero ?? "O") as Gender,
  };

  if (await orgIdSupported()) {
    const activeOrgId = await getCurrentOrgId().catch(() => null);
    payload.org_id = activeOrgId ?? null;
  }

  const { data, error } = await supabase.from("patients").insert(payload).select("*").single();
  if (error) throw toError(error, "createPatient");
  return data as Patient;
}

/** Actualiza un paciente */
export async function updatePatient(id: string, input: PatientInput): Promise<Patient> {
  const supabase = getSupabaseBrowser();
  const patch: Record<string, unknown> = {};
  if (typeof input.nombre === "string") patch.nombre = input.nombre;
  if (typeof input.edad !== "undefined") patch.edad = input.edad ?? null;
  if (typeof input.genero !== "undefined") patch.genero = input.genero;

  const { data, error } = await supabase.from("patients").update(patch).eq("id", id).select("*").single();
  if (error) throw toError(error, "updatePatient");
  return data as Patient;
}

/** Soft delete */
export async function softDeletePatient(id: string): Promise<Patient> {
  const hasSoft = await softDeleteSupported();
  if (!hasSoft) {
    throw new Error(
      "Soft-delete no soportado: la columna 'deleted_at' no existe en 'patients'. Añádela o usa borrado definitivo.",
    );
  }
  const supabase = getSupabaseBrowser();
  const { data, error } = await supabase
    .from("patients")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw toError(error, "softDeletePatient");
  return data as Patient;
}

/** Restaura */
export async function restorePatient(id: string): Promise<Patient> {
  const hasSoft = await softDeleteSupported();
  if (!hasSoft) {
    throw new Error("Restaurar no soportado: la columna 'deleted_at' no existe en 'patients'.");
  }
  const supabase = getSupabaseBrowser();
  const { data, error } = await supabase
    .from("patients")
    .update({ deleted_at: null })
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw toError(error, "restorePatient");
  return data as Patient;
}

/** Hard delete */
export async function deletePatient(id: string): Promise<void> {
  const supabase = getSupabaseBrowser();
  const { error } = await supabase.from("patients").delete().eq("id", id);
  if (error) throw toError(error, "deletePatient");
}
