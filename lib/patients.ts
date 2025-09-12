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
}

export interface ListResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export async function getCurrentUserId(): Promise<string> {
  const supabase = getSupabaseBrowser();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    throw new Error("No hay sesión activa.");
  }
  return data.user.id;
}

/** Lista pacientes del usuario (o compartidos), con búsqueda y paginación */
export async function listPatients(params: ListPatientsParams = {}): Promise<ListResult<Patient>> {
  const supabase = getSupabaseBrowser();
  const page = params.page ?? 1;
  const pageSize = params.pageSize ?? 10;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from("patients")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false });

  if (params.q && params.q.trim() !== "") {
    query = query.ilike("nombre", `%${params.q.trim()}%`);
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

/** Actualiza un paciente (sólo dueño) */
export async function updatePatient(id: string, input: PatientInput): Promise<Patient> {
  const supabase = getSupabaseBrowser();
  const patch: Record<string, unknown> = {};
  if (typeof input.nombre === "string") patch.nombre = input.nombre;
  if (typeof input.edad !== "undefined") patch.edad = input.edad ?? null;
  if (typeof input.genero !== "undefined") patch.genero = input.genero;

  const { data, error } = await supabase.from("patients").update(patch).eq("id", id).select("*").single();
  if (error) throw error;
  return data as Patient;
}

/** Elimina un paciente (sólo dueño) */
export async function deletePatient(id: string): Promise<void> {
  const supabase = getSupabaseBrowser();
  const { error } = await supabase.from("patients").delete().eq("id", id);
  if (error) throw error;
}
