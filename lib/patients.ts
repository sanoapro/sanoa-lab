import { getSupabaseBrowser } from "@/lib/supabase-browser";

export type Genero = "F" | "M" | "O";
export type Patient = {
  id: string;
  user_id: string;
  nombre: string;
  edad: number;
  genero: Genero;
  created_at: string;
  updated_at: string;
};

export async function listPatients(opts?: { q?: string; genero?: Genero | ""; limit?: number }) {
  const supabase = getSupabaseBrowser();
  const limit = opts?.limit ?? 200;
  let q = supabase.from("patients").select("*").order("nombre", { ascending: true }).limit(limit);

  if (opts?.q && opts.q.trim()) {
    q = q.ilike("nombre", `%${opts.q.trim()}%`);
  }
  if (opts?.genero) {
    q = q.eq("genero", opts.genero);
  }

  const { data, error } = await q;
  if (error) throw error;
  return (data || []) as Patient[];
}

export async function createPatient(payload: { nombre: string; edad: number; genero: Genero }) {
  const supabase = getSupabaseBrowser();
  const { data, error } = await supabase
    .from("patients")
    .insert({ nombre: payload.nombre, edad: payload.edad, genero: payload.genero })
    .select("*")
    .single();
  if (error) throw error;
  return data as Patient;
}

export async function deletePatient(id: string) {
  const supabase = getSupabaseBrowser();
  const { error } = await supabase.from("patients").delete().eq("id", id);
  if (error) throw error;
  return true;
}

export async function getPatient(id: string) {
  const supabase = getSupabaseBrowser();
  const { data, error } = await supabase.from("patients").select("*").eq("id", id).single();
  if (error) throw error;
  return data as Patient;
}
