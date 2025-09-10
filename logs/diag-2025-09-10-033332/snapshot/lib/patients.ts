export type Patient = Database["public"]["Tables"]["patients"]["Row"];
export type NewPatient = Database["public"]["Tables"]["patients"]["Insert"];
export type PatchPatient = Database["public"]["Tables"]["patients"]["Update"];
export type Gender = Database["public"]["Enums"]["Gender"];
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import type { Database, Gender } from "@/lib/database.types";

type PatientRow = Database["public"]["Tables"]["patients"]["Row"];
type PatientInsert = Database["public"]["Tables"]["patients"]["Insert"];
type PatientUpdate = Database["public"]["Tables"]["patients"]["Update"];

function raise(error: any): never {
  throw new Error(error?.message ?? error?.details ?? error?.hint ?? "Unknown error");
}

export async function listPatients(limit = 50) {
  const supabase = getSupabaseBrowser();
  const { data, error } = await supabase
    .from("patients")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) raise(error);
  return data as PatientRow[];
}

export async function getPatient(id: string) {
  const supabase = getSupabaseBrowser();
  const { data, error } = await supabase.from("patients").select("*").eq("id", id).single();
  if (error) raise(error);
  return data as PatientRow;
}

export async function createPatient(input: PatientInsert) {
  const supabase = getSupabaseBrowser();
  const { data, error } = await supabase.from("patients").insert(input).select("*").single();
  if (error) raise(error);
  return data as PatientRow;
}

export async function updatePatient(id: string, patch: Omit<PatientUpdate, "id">) {
  const supabase = getSupabaseBrowser();
  const { data, error } = await supabase
    .from("patients")
    .update(patch)
    .eq("id", id)
    .select("*")
    .single();
  if (error) raise(error);
  return data as PatientRow;
}

export async function deletePatient(id: string) {
  const supabase = getSupabaseBrowser();
  const { error } = await supabase.from("patients").delete().eq("id", id);
  if (error) raise(error);
  return true;
}
