// MODE: session (user-scoped, cookies)
// GET /api/reports/schedules?org_id&page&pageSize
// POST /api/reports/schedules  (crear/actualizar)
// Body (POST): { id?, org_id, name, report, channel, target, frequency, at_hour, at_minute, dow?, tz, params?, is_active? }
import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase/server";

function toInt(v: string | null, d = 50) {
  const n = v ? parseInt(v, 10) : NaN;
  return Number.isFinite(n) && n > 0 ? n : d;
}

export async function GET(req: NextRequest) {
  const supa = await getSupabaseServer();
  const { data: u } = await supa.auth.getUser();
  if (!u?.user) return NextResponse.json({ ok: false, error: { code: "UNAUTHORIZED", message: "No autenticado" } }, { status: 401 });

  const url = new URL(req.url);
  const org_id = url.searchParams.get("org_id");
  if (!org_id) return NextResponse.json({ ok: false, error: { code: "BAD_REQUEST", message: "Falta org_id" } }, { status: 400 });

  const page = toInt(url.searchParams.get("page"), 1);
  const pageSize = Math.min(toInt(url.searchParams.get("pageSize"), 50), 200);
  const from = (page - 1) * pageSize;

  const { data, error, count } = await supa
    .from("report_schedules")
    .select("*", { count: "exact" })
    .eq("org_id", org_id)
    .order("updated_at", { ascending: false })
    .range(from, from + pageSize - 1);

  if (error) return NextResponse.json({ ok: false, error: { code: "DB_ERROR", message: error.message } }, { status: 400 });
  return NextResponse.json({ ok: true, data: data ?? [], meta: { page, pageSize, total: count ?? 0 } });
}

export async function POST(req: NextRequest) {
  const supa = await getSupabaseServer();
  const { data: u } = await supa.auth.getUser();
  if (!u?.user) return NextResponse.json({ ok: false, error: { code: "UNAUTHORIZED", message: "No autenticado" } }, { status: 401 });

  const b = await req.json().catch(() => ({}));
  const id: string | undefined = b?.id || undefined;
  const org_id: string | undefined = b?.org_id;
  const name: string = (b?.name ?? "").trim();
  const report: string = (b?.report ?? "").trim(); // ej: daily_summary
  const channel: "whatsapp" | "sms" | "email" = b?.channel;
  const target: string = (b?.target ?? "").trim();
  const frequency: "daily" | "weekly" = b?.frequency;
  const at_hour: number = Number(b?.at_hour ?? 9);
  const at_minute: number = Number(b?.at_minute ?? 0);
  const dow: number[] = Array.isArray(b?.dow) ? b.dow.map((x: any)=>Number(x)).filter((n:number)=>Number.isFinite(n) && n>=0 && n<=6) : []; // 0=Sunday
  const tz: string = (b?.tz ?? "America/Mexico_City").trim();
  const params: Record<string, any> = b?.params ?? {};
  const is_active: boolean = Boolean(b?.is_active ?? true);

  if (!org_id || !name || !report || !channel || !target || !frequency || !tz) {
    return NextResponse.json({ ok: false, error: { code: "BAD_REQUEST", message: "Campos requeridos: org_id, name, report, channel, target, frequency, tz" } }, { status: 400 });
  }
  if (!["daily","weekly"].includes(frequency)) {
    return NextResponse.json({ ok: false, error: { code: "BAD_REQUEST", message: "frequency inválida" } }, { status: 400 });
  }
  if (!["whatsapp","sms","email"].includes(channel)) {
    return NextResponse.json({ ok: false, error: { code: "BAD_REQUEST", message: "channel inválido" } }, { status: 400 });
  }

  const payload = {
    id: id ?? undefined,
    org_id, name, report, channel, target, frequency, at_hour, at_minute,
    dow: frequency === "weekly" ? dow : null,
    tz, params, is_active
  };

  // upsert por id si viene, si no → insert
  let q = supa.from("report_schedules");
  const { data, error } = id
    ? await q.update(payload).eq("org_id", org_id).eq("id", id).select("*").single()
    : await q.insert(payload).select("*").single();

  if (error) return NextResponse.json({ ok: false, error: { code: "DB_ERROR", message: error.message } }, { status: 400 });
  return NextResponse.json({ ok: true, data });
}
