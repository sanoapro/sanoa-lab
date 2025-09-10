import { getSupabaseBrowser } from "@/lib/supabase-browser";

/** Dominio básico de Pacientes (ajústalo a tu esquema real si cambia) */
export type Gender = "masculino" | "femenino" | "otro" | "no_especificado";

export type Patient = {
  id: string;
  org_id?: string | null;
  user_id?: string | null;
  nombre: string;
  apellidos?: string | null;
  edad?: number | null;
  genero?: Gender | null;
  email?: string | null;
  telefono?: string | null;
  created_at: string;
  updated_at?: string | null;
};

export type NewPatient = Omit<Patient, "id" | "created_at" | "updated_at">;
export type PatientPatch = Partial<Omit<Patient, "id" | "created_at" | "updated_at">>;

/** Lista con búsqueda/orden/paginación; devuelve { data, count } */
export async function listPatients(opts?: {
  q?: string;
  limit?: number;
  offset?: number;
  orderBy?: keyof Patient;
  ascending?: boolean;
}): Promise<{ data: Patient[]; count: number | null }> {
  const supabase = getSupabaseBrowser();
  const limit = opts?.limit ?? 20;
  const offset = opts?.offset ?? 0;
  const orderBy = (opts?.orderBy as string) ?? "created_at";
  const ascending = opts?.ascending ?? false;

  let query = supabase
    .from("patients")
    .select("*", { count: "exact" })
    .order(orderBy, { ascending })
    .range(offset, offset + limit - 1);

  if (opts?.q && opts.q.trim().length > 0) {
    const q = `%${opts.q.trim()}%`;
    // Ajusta estos campos a tu esquema (nombre/apellidos/email)
    query = query.or(`nombre.ilike.${q},apellidos.ilike.${q},email.ilike.${q}`);
  }

  const { data, error, count } = await query;
  if (error) throw error;
  return { data: (data || []) as Patient[], count: count ?? null };
}

/** Obtener un paciente por id (o null si no existe) */
export async function getPatient(id: string): Promise<Patient | null> {
  const supabase = getSupabaseBrowser();
  const { data, error } = await supabase.from("patients").select("*").eq("id", id).single();
  if (error) {
    // Si la fila no existe, Supabase lanza error; normalizamos a null cuando es 406/No rows
    if (
      (error as any)?.code === "PGRST116" ||
      (error as any)?.details?.includes("Results contain 0 rows")
    ) {
      return null;
    }
    throw error;
  }
  return data as Patient;
}

/** Crear paciente; el trigger de org_id lo rellenará según user_prefs/organización actual */
export async function createPatient(input: NewPatient): Promise<Patient> {
  const supabase = getSupabaseBrowser();
  const { data, error } = await supabase.from("patients").insert(input).select("*").single();
  if (error) throw error;
  return data as Patient;
}

/** Actualizar paciente por id */
export async function updatePatient(id: string, patch: PatientPatch): Promise<Patient> {
  const supabase = getSupabaseBrowser();
  const { data, error } = await supabase
    .from("patients")
    .update(patch)
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw error;
  return data as Patient;
}

/** Borrar paciente por id */
export async function deletePatient(id: string): Promise<boolean> {
  const supabase = getSupabaseBrowser();
  const { error } = await supabase.from("patients").delete().eq("id", id);
  if (error) throw error;
  return true;
}
