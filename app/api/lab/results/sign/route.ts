import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const bucket = process.env.LAB_RESULTS_BUCKET || "lab-results";

export async function POST(req: Request) {
  try {
    const { path, expires = Number(process.env.NEXT_PUBLIC_SIGNED_URL_TTL || 300) } =
      await req.json();
    if (!path) return NextResponse.json({ error: "path requerido" }, { status: 400 });
    const supa = createClient(url, serviceKey, { auth: { persistSession: false } });
    const { data, error } = await supa.storage
      .from(bucket)
      .createSignedUrl(path, Math.max(5, Number(expires)));
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ ok: true, url: data.signedUrl });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "No se pudo firmar" }, { status: 500 });
  }
}
