import { getSupabaseBrowser } from "@/lib/supabase-browser";

export type PatientFile = {
  id: string;
  user_id: string;
  patient_id: string;
  bucket: string;
  path: string;
  file_name: string;
  mime_type: string | null;
  size: number | null;
  created_at: string;
};

function slugify(name: string) {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

/** Lista archivos de un paciente */
export async function listPatientFiles(patientId: string, limit = 200): Promise<PatientFile[]> {
  const supabase = getSupabaseBrowser();
  const { data, error } = await supabase
    .from("patient_files")
    .select("*")
    .eq("patient_id", patientId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data || []) as PatientFile[];
}

/** Sube al bucket 'uploads' en ruta: {uid}/patients/{patientId}/{timestamp}-{slug} */
export async function uploadPatientFile(patientId: string, file: File): Promise<PatientFile> {
  const supabase = getSupabaseBrowser();
  const { data: u } = await supabase.auth.getUser();
  if (!u?.user) throw new Error("No hay sesión.");

  const uid = u.user.id;
  const path = `${uid}/patients/${patientId}/${Date.now()}-${slugify(file.name)}`;
  const bucket = "uploads";

  const upload = await supabase.storage.from(bucket).upload(path, file, {
    cacheControl: "3600",
    upsert: false,
    contentType: file.type || "application/octet-stream",
  });
  if (upload.error) throw upload.error;

  const meta: Omit<PatientFile, "id" | "created_at"> = {
    user_id: uid,
    patient_id: patientId,
    bucket,
    path,
    file_name: file.name,
    mime_type: file.type || null,
    size: file.size ?? null,
  };

  const { data, error } = await supabase.from("patient_files").insert(meta).select("*").single();
  if (error) {
    // Revertir objeto si falla DB
    await supabase.storage
      .from(bucket)
      .remove([path])
      .catch(() => {});
    throw error;
  }
  return data as PatientFile;
}

/** Genera URL firmada temporal para ver/descargar */
export async function getSignedUrl(pf: Pick<PatientFile, "bucket" | "path">, expiresInSec = 300) {
  const supabase = getSupabaseBrowser();
  const res = await supabase.storage.from(pf.bucket).createSignedUrl(pf.path, expiresInSec);
  if (res.error) throw res.error;
  return res.data.signedUrl;
}

/** Borra registro y objeto del bucket */
export async function deletePatientFile(id: string) {
  const supabase = getSupabaseBrowser();
  // 1) Obtener registro para conocer path/bucket
  const { data: rec, error: e1 } = await supabase
    .from("patient_files")
    .select("*")
    .eq("id", id)
    .single();
  if (e1) throw e1;
  // 2) Borrar objeto
  const rem = await supabase.storage.from(rec.bucket).remove([rec.path]);
  if (rem.error) throw rem.error;
  // 3) Borrar registro
  const { error: e2 } = await supabase.from("patient_files").delete().eq("id", id);
  if (e2) throw e2;
  return true;
}
