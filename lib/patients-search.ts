import { getSupabaseBrowser } from "@/lib/supabase-browser";
import type { Patient } from "@/lib/patients";

export type PatientSearchFilters = {
  q?: string;
  genero?: "F" | "M" | "O" | "ALL";
  edadMin?: number | null;
  edadMax?: number | null;
  createdFrom?: string | null; // ISO date 'YYYY-MM-DD'
  createdTo?: string | null;   // ISO date 'YYYY-MM-DD'
  orderBy?: "created_at" | "nombre" | "edad";
  orderDir?: "asc" | "desc";
  page?: number;   // 1-based
  pageSize?: number;
};

export type PatientSearchResult = {
  rows: Patient[];
  count: number;
  page: number;
  pageSize: number;
};

export async function searchPatients(filters: PatientSearchFilters): Promise<PatientSearchResult> {
  const supabase = getSupabaseBrowser();

  const {
    q,
    genero = "ALL",
    edadMin = null,
    edadMax = null,
    createdFrom = null,
    createdTo = null,
    orderBy = "created_at",
    orderDir = "desc",
    page = 1,
    pageSize = 10,
  } = filters || {};

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  // select con conteo exacto (RLS ya limita visibilidad: dueño o compartido)
  let query = supabase
    .from("patients")
    .select("*", { count: "exact" })
    .order(orderBy, { ascending: orderDir === "asc" })
    .range(from, to);

  if (q && q.trim().length > 0) {
    // Busca por nombre con ilike (apoyado por trigram)
    query = query.ilike("nombre", `%${q.trim()}%`);
  }

  if (genero && genero !== "ALL") {
    query = query.eq("genero", genero);
  }

  if (typeof edadMin === "number") {
    query = query.gte("edad", edadMin);
  }
  if (typeof edadMax === "number") {
    query = query.lte("edad", edadMax);
  }

  // Fechas de creación (inclusive)
  if (createdFrom) {
    query = query.gte("created_at", `${createdFrom}T00:00:00.000Z`);
  }
  if (createdTo) {
    query = query.lte("created_at", `${createdTo}T23:59:59.999Z`);
  }

  const { data, error, count } = await query;
  if (error) throw error;

  return {
    rows: (data || []) as Patient[],
    count: count || 0,
    page,
    pageSize,
  };
}
