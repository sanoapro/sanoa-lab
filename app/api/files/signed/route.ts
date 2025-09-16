import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";

const BUCKET = "patient-files";

export async function GET(req: Request) {
  const supabase = createRouteHandlerClient({ cookies });
  const { searchParams } = new URL(req.url);
  const path = String(searchParams.get("path") || "");
  const patient = String(searchParams.get("patient") || "");
  const action = (String(searchParams.get("action") || "view") === "download") ? "download" : "view";
  const expires = Number(searchParams.get("expires") || "600"); // segundos

  if (!path || !patient) return NextResponse.json({ error: "path y patient requeridos" }, { status: 400 });

  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, expires);
  if (error || !data?.signedUrl) return NextResponse.json({ error: error?.message || "no se pudo firmar" }, { status: 400 });

  try {
    const ip = req.headers.get("x-forwarded-for") || "";
    const ua = req.headers.get("user-agent") || "";
    await supabase.rpc("log_file_access", { p_patient_id: patient, p_path: path, p_action: action, p_ip: ip, p_ua: ua });
  } catch {}

  return NextResponse.json({ url: data.signedUrl });
}