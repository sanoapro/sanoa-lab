import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";

export async function GET(req: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { searchParams } = new URL(req.url);

    const org = String(searchParams.get("org") ?? "");
    const monthsParam = searchParams.get("months");
    const monthsNum = Number(monthsParam);
    // Default 12, clamp 1..60 para evitar consultas pesadas
    const months =
      Number.isFinite(monthsNum) && monthsNum > 0
        ? Math.min(60, Math.max(1, Math.trunc(monthsNum)))
        : 12;

    if (!org) {
      return NextResponse.json({ error: "org requerida" }, { status: 400 });
    }

    const [pts, notes, files] = await Promise.all([
      supabase.rpc("metrics_new_patients_by_month", { p_org: org, months }),
      supabase.rpc("metrics_notes_by_month", { p_org: org, months }),
      supabase.rpc("metrics_files_by_month", { p_org: org, months }),
    ]);

    if (pts.error) return NextResponse.json({ error: pts.error.message }, { status: 400 });
    if (notes.error) return NextResponse.json({ error: notes.error.message }, { status: 400 });
    if (files.error) return NextResponse.json({ error: files.error.message }, { status: 400 });

    return NextResponse.json({
      org,
      months,
      patients: pts.data ?? [],
      notes: notes.data ?? [],
      files: files.data ?? [],
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Error inesperado" }, { status: 500 });
  }
}
