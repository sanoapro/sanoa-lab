import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  const supa = await createClient();
  try {
    const {
      org_id,
      patient_id,
      template_id,
      channel,
      address,
      payload,
      appointment_at,
      run_at,
      appointment_id,
    } = await req.json();
    if (!org_id || !channel || !address) {
      return NextResponse.json({ error: "Faltan parámetros" }, { status: 400 });
    }

    const { data, error } = await supa
      .from("reminders")
      .insert({
        org_id,
        patient_id: patient_id || null,
        template_id: template_id || null,
        channel,
        address,
        payload: payload || {},
        appointment_at: appointment_at || null,
        next_run_at: run_at || new Date().toISOString(),
        appointment_id: appointment_id || null,
      })
      .select("*")
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ ok: true, data });
  } catch (e: any) {
    return NextResponse.json({ error: String(e?.message || e) }, { status: 400 });
  }
}
