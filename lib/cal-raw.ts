import { getSupabaseBrowser } from "./supabase-browser";

export interface CalRawRow {
  cal_uid: string;
  trigger_event: string;
  status: string | null;
  start: string | null;
  end: string | null;
  attendee_email: string | null;
  attendee_name: string | null;
  payload: any;
  updated_at: string;
}

export async function getCalRawByUid(calUid: string): Promise<CalRawRow | null> {
  const supabase = getSupabaseBrowser();
  const { data, error } = await supabase
    .from("cal_bookings_raw")
    .select("*")
    .eq("cal_uid", calUid)
    .maybeSingle();
  if (error) throw error;
  return (data ?? null) as CalRawRow | null;
}
