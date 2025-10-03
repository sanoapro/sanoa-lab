import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import crypto from "node:crypto";

const BUCKET = "patient-files"; // usa tu bucket existente

export async function POST(req: Request) {
  const supabase = createRouteHandlerClient({ cookies });

  const form = await req.formData();
  const patient = String(form.get("patient"));
  const file = form.get("file") as File | null;
  if (!patient || !file) {
    return NextResponse.json({ error: "patient y file son requeridos" }, { status: 400 });
  }

  // group_key = nombre normalizado (minúsculas)
  const name = file.name || "archivo";
  const group_key = name.toLowerCase();

  // Determinar versión siguiente vía RPC
  const { data: nextv, error: eV } = await supabase.rpc("next_file_version", {
    p_patient_id: patient,
    p_group_key: group_key,
  });
  if (eV) return NextResponse.json({ error: eV.message }, { status: 400 });
  const version = Number(nextv || 1);

  // Leer bytes y calcular checksum sin Buffer
  const arrayBuf = await file.arrayBuffer();
  const u8 = new Uint8Array(arrayBuf);
  const checksum = crypto.createHash("sha256").update(u8).digest("hex");
  const path = `patients/${patient}/${group_key}/v${version}/${name}`;

  // Subir a Storage (puedes pasar el File directamente)
  const { error: eUp } = await supabase.storage.from(BUCKET).upload(path, file, {
    contentType: file.type || "application/octet-stream",
    upsert: false,
  });
  if (eUp) return NextResponse.json({ error: eUp.message }, { status: 400 });

  // Registrar versión
  const { error: eIns } = await supabase.from("patient_file_versions").insert({
    patient_id: patient,
    group_key,
    version,
    name,
    path,
    size_bytes: u8.byteLength,
    checksum_sha256: checksum,
  });
  if (eIns) return NextResponse.json({ error: eIns.message }, { status: 400 });

  // Bitácora
  try {
    const ip = req.headers.get("x-forwarded-for") || "";
    const ua = req.headers.get("user-agent") || "";
    await supabase.rpc("log_file_access", {
      p_patient_id: patient,
      p_path: path,
      p_action: "upload",
      p_ip: ip,
      p_ua: ua,
    });
  } catch {
    // noop
  }

  return NextResponse.json({ ok: true, version, path });
}
