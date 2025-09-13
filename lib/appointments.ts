import { getSupabaseBrowser } from "./supabase-browser";

export interface AppointmentLink {
  id: string;
  patient_id: string;
  cal_uid: string;
  title: string | null;
  start: string;
  end: string;
  meeting_url: string | null;
  metadata: any | null;
  created_at: string;
}

export async function linkAppointmentToPatient(input: {
  patientId: string;
  calUid: string;
  title?: string | null;
  start: string;
  end: string;
  meetingUrl?: string | null;
  metadata?: any | null;
}): Promise<AppointmentLink> {
  const supabase = getSupabaseBrowser();
  const { data, error } = await supabase
    .from("patient_appointments")
    .upsert({
      patient_id: input.patientId,
      cal_uid: input.calUid,
      title: input.title ?? null,
      start: input.start,
      end: input.end,
      meeting_url: input.meetingUrl ?? null,
      metadata: input.metadata ?? null,
    }, { onConflict: "cal_uid" })
    .select("*")
    .single();

  if (error) throw error;
  return data as AppointmentLink;
}

export async function listAppointmentsByPatient(patientId: string): Promise<AppointmentLink[]> {
  const supabase = getSupabaseBrowser();
  const { data, error } = await supabase
    .from("patient_appointments")
    .select("*")
    .eq("patient_id", patientId)
    .order("start", { ascending: false });
  if (error) throw error;
  return (data ?? []) as AppointmentLink[];
}

export async function unlinkAppointment(id: string): Promise<void> {
  const supabase = getSupabaseBrowser();
  const { error } = await supabase.from("patient_appointments").delete().eq("id", id);
  if (error) throw error;
}
