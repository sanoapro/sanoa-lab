// MODE: session (user-scoped, cookies)
// GET /api/reminders/templates?org_id&q&specialty&channel&active&page&pageSize
import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase/server";

function toInt(v: string | null, d = 50) {
  const n = v ? parseInt(v, 10) : NaN;
  return Number.isFinite(n) && n > 0 ? n : d;
}

export async function GET(req: NextRequest) {
  // MODE: session
  try {
    const supa = await getSupabaseServer();
    const { data: u } = await supa.auth.getUser();
    if (!u?.user) return NextResponse.json({ ok: false, error: { code: "UNAUTHORIZED", message: "No autenticado" } }, { status: 401 });

    const url = new URL(req.url);
    const org_id = url.searchParams.get("org_id");
    if (!org_id) return NextResponse.json({ ok: false, error: { code: "BAD_REQUEST", message: "Falta org_id" } }, { status: 400 });

    const q = url.searchParams.get("q")?.trim();
    const specialty = url.searchParams.get("specialty")?.trim();
    const channel = url.searchParams.get("channel")?.trim(); // sms|whatsapp
    const active = url.searchParams.get("active");
    const page = toInt(url.searchParams.get("page"), 1);
    const pageSize = Math.min(toInt(url.searchParams.get("pageSize"), 50), 200);
    const from = (page - 1) * pageSize;

    let sel = supa
      .from("reminders_templates")
      .select("id, org_id, name, specialty, channel, body, variables, is_active, created_at, updated_at", { count: "exact" })
      .eq("org_id", org_id);

    if (q) sel = sel.ilike("name", `%${q}%`);
    if (specialty) sel = sel.eq("specialty", specialty);
    if (channel) sel = sel.eq("channel", channel);
    if (active === "true") sel = sel.eq("is_active", true);
    if (active === "false") sel = sel.eq("is_active", false);

    const { data, error, count } = await sel.order("updated_at", { ascending: false }).range(from, from + pageSize - 1);
    if (error) return NextResponse.json({ ok: false, error: { code: "DB_ERROR", message: error.message } }, { status: 400 });

    return NextResponse.json({ ok: true, data: data ?? [], meta: { page, pageSize, total: count ?? 0 } });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: { code: "SERVER_ERROR", message: e?.message ?? "Error" } }, { status: 500 });
  }
}
