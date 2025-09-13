// /workspaces/sanoa-lab/lib/patients.ts
import { getSupabaseBrowser } from "./supabase-browser";

export type Gender = "F" | "M" | "O";

export interface Patient {
  id: string;
  user_id: string;
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
  /** Campo por el que ordenar (por defecto: created_at) */
  sortBy?: "created_at" | "nombre";
  /** Dirección del orden (por defecto: desc si sortBy=created_at; asc en otros casos) */
  direction?: "asc" | "desc";
  /** Filtro de género (ALL = sin filtro) */
  genero?: Gender | "ALL";
  /** Filtro desde fecha de creación (YYYY-MM-DD) */
  from?: string;
  /** Filtro hasta fecha de creación (YYYY-MM-DD) */
  to?: string;
  /** Incluir registros con deleted_at != null (si la columna existe) */
  includeDeleted?: boolean;
}

export interface ListResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

let _softDeleteSupported: boolean | null = null;
async function softDeleteSupported(): Promise<boolean> {
  if (_softDeleteSupported !== null) return _softDeleteSupported;
  const supabase = getSupabaseBrowser();
  try {
    // Si la columna no existe, PostgREST suele responder con error "column ... does not exist"
    const { error } = await supabase.from("patients").select("deleted_at").limit(1);
    if (error) {
      const msg = String((error as any)?.message || "").toLowerCase();
      _softDeleteSupported = !(msg.includes("deleted_at") && msg.includes("does not exist"));
    } else {
      _softDeleteSupported = true;
    }
  } catch {
    // Si hay otro error inesperado, no bloqueamos la UI
    _softDeleteSupported = true;
  }
  return _softDeleteSupported!;
}

export async function getCurrentUserId(): Promise<string> {
  const supabase = getSupabaseBrowser();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    throw new Error("No hay sesión activa.");
  }
  return data.user.id;
}

/** Lista pacientes con búsqueda, filtros, paginación y orden (respetando RLS/compartidos) */
export async function listPatients(params: ListPatientsParams = {}): Promise<ListResult<Patient>> {
  const supabase = getSupabaseBrowser();

  // Normalizaciones seguras
  const page = Math.max(1, Number(params.page ?? 1));
  const pageSize = Math.min(100, Math.max(1, Number(params.pageSize ?? 10)));

  const allowedSort: Array<NonNullable<ListPatientsParams["sortBy"]>> = ["created_at", "nombre"];
  const sortBy = (params.sortBy && allowedSort.includes(params.sortBy)
    ? params.sortBy
    : "created_at") as NonNullable<ListPatientsParams["sortBy"]>;

  const direction = (params.direction ?? (sortBy === "created_at" ? "desc" : "asc")) as NonNullable<
    ListPatientsParams["direction"]
  >;

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from("patients")
    .select("*", { count: "exact" })
    .order(sortBy, { ascending: direction === "asc" });

  // Soft-delete: sólo aplicar filtro si la columna existe
  const hasSoft = await softDeleteSupported();
  if (hasSoft && !params.includeDeleted) {
    query = query.is("deleted_at", null);
  }

  // Búsqueda por nombre
  if (params.q && params.q.trim() !== "") {
    query = query.ilike("nombre", `%${params.q.trim()}%`);
  }

  // Filtro de género
  if (params.genero && params.genero !== "ALL") {
    query = query.eq("genero", params.genero);
  }

  // Filtros de fecha de creación
  if (params.from) {
    const isoStart = new Date(params.from + "T00:00:00Z").toISOString();
    query = query.gte("created_at", isoStart);
  }
  if (params.to) {
    const isoEnd = new Date(params.to + "T23:59:59Z").toISOString();
    query = query.lte("created_at", isoEnd);
  }

  const { data, error, count } = await query.range(from, to);
  if (error) throw error;

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
  if (error) throw error;
  return (data as Patient) ?? null;
}

/** Crea un paciente para el usuario actual */
export async function createPatient(input: PatientInput): Promise<Patient> {
  const supabase = getSupabaseBrowser();
  const userId = await getCurrentUserId();
  const payload = {
    user_id: userId,
    nombre: input.nombre,
    edad: input.edad ?? null,
    genero: (input.genero ?? "O") as Gender,
  };
  const { data, error } = await supabase.from("patients").insert(payload).select("*").single();
  if (error) throw error;
  return data as Patient;
}

/** Actualiza un paciente (sólo dueño o con permisos vía RLS) */
export async function updatePatient(id: string, input: PatientInput): Promise<Patient> {
  const supabase = getSupabaseBrowser();
  const patch: Record<string, unknown> = {};
  if (typeof input.nombre === "string") patch.nombre = input.nombre;
  if (typeof input.edad !== "undefined") patch.edad = input.edad ?? null;
  if (typeof input.genero !== "undefined") patch.genero = input.genero;

  const { data, error } = await supabase
    .from("patients")
    .update(patch)
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw error;
  return data as Patient;
}

/** Soft delete (marca deleted_at si la columna existe) */
export async function softDeletePatient(id: string): Promise<Patient> {
  const hasSoft = await softDeleteSupported();
  if (!hasSoft) {
    throw new Error(
      "Soft-delete no soportado: la columna 'deleted_at' no existe en 'patients'. Añádela o usa borrado definitivo."
    );
  }
  const supabase = getSupabaseBrowser();
  const { data, error } = await supabase
    .from("patients")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw error;
  return data as Patient;
}

/** Restaura (borra deleted_at si la columna existe) */
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
  if (error) throw error;
  return data as Patient;
}

/** Hard delete (permanente) */
export async function deletePatient(id: string): Promise<void> {
  const supabase = getSupabaseBrowser();
  const { error } = await supabase.from("patients").delete().eq("id", id);
  if (error) throw error;
}
