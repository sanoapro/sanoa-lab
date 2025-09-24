import { getSupabaseBrowser } from "./supabase-browser";

export interface AppointmentLink {
  id: string;
  patient_id: string;
  cal_uid: string;
  title: string | null;
  start: string;
  end: string;
  meeting_url: string | null;
  status?: string | null; // <- nuevo
  metadata: any | null;
  last_webhook_at?: string | null; // <- nuevo
  created_at: string;
}

// Normaliza errores de Supabase a Error con mensaje claro
function wrapSupabaseError(context: string, e: unknown): Error {
  if (e && typeof e === "object") {
    const anyE: any = e as any;
    const msg =
      anyE?.message ||
      anyE?.error_description ||
      anyE?.error ||
      (typeof anyE?.toString === "function" ? anyE.toString() : "") ||
      "Error desconocido";
    return new Error(`${context}: ${msg}`);
  }
  if (typeof e === "string") return new Error(`${context}: ${e}`);
  return new Error(`${context}: Error desconocido`);
}

export async function linkAppointmentToPatient(input: {
  patientId: string;
  calUid: string;
  title?: string | null;
  start: string;
  end: string;
  meetingUrl?: string | null;
  status?: string | null; // opcional: si ya lo conoces
  metadata?: any | null;
}): Promise<AppointmentLink> {
  try {
    const supabase = getSupabaseBrowser();
    const { data, error } = await supabase
      .from("patient_appointments")
      .upsert(
        {
          patient_id: input.patientId,
          cal_uid: input.calUid,
          title: input.title ?? null,
          start: input.start,
          end: input.end,
          meeting_url: input.meetingUrl ?? null,
          status: input.status ?? null,
          metadata: input.metadata ?? null,
        },
        { onConflict: "cal_uid" },
      )
      .select("*")
      .single();

    if (error) throw error;
    return data as AppointmentLink;
  } catch (e: unknown) {
    throw wrapSupabaseError("linkAppointmentToPatient", e);
  }
}

export async function listAppointmentsByPatient(patientId: string): Promise<AppointmentLink[]> {
  try {
    const supabase = getSupabaseBrowser();
    const { data, error } = await supabase
      .from("patient_appointments")
      .select("*")
      .eq("patient_id", patientId)
      .order("start", { ascending: false });
    if (error) throw error;
    return (data ?? []) as AppointmentLink[];
  } catch (e: unknown) {
    throw wrapSupabaseError("listAppointmentsByPatient", e);
  }
}

export async function unlinkAppointment(id: string): Promise<void> {
  try {
    const supabase = getSupabaseBrowser();
    const { error } = await supabase.from("patient_appointments").delete().eq("id", id);
    if (error) throw error;
  } catch (e: unknown) {
    throw wrapSupabaseError("unlinkAppointment", e);
  }
}
