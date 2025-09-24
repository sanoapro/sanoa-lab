import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";

const BUCKET = "patient-files";

export async function POST(req: Request) {
  const supabase = createRouteHandlerClient({ cookies });
  const body = await req.json().catch(() => ({}));
  const path = String(body.path || "");
  const patient = String(body.patient || "");
  if (!path || !patient)
    return NextResponse.json({ error: "path y patient requeridos" }, { status: 400 });

  // Eliminamos en Storage
  const { error: eDel } = await supabase.storage.from(BUCKET).remove([path]);
  if (eDel) return NextResponse.json({ error: eDel.message }, { status: 400 });

  // Opcional: también podrías borrar la fila de la versión, pero la dejamos como "huella" (histórico)
  // Si quieres ocultarla en UI, filtra por objetos que aún existan.

  try {
    const ip = req.headers.get("x-forwarded-for") || "";
    const ua = req.headers.get("user-agent") || "";
    await supabase.rpc("log_file_access", {
      p_patient_id: patient,
      p_path: path,
      p_action: "delete",
      p_ip: ip,
      p_ua: ua,
    });
  } catch {}

  return NextResponse.json({ ok: true });
}
