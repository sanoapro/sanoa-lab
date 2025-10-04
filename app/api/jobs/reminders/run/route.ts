import { NextRequest, NextResponse } from "next/server";
import { runReminderBatch } from "@/lib/reminders/runner";
import { createServiceClient } from "@/lib/supabase/service";
import { jsonOk, jsonError, requireHeader } from "@/lib/http/validate";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const cronKey = req.headers.get("x-cron-key");
  if (cronKey !== null) {
    const check = requireHeader(req, "x-cron-key", process.env.CRON_SECRET);
    if (!check.ok) {
      return jsonError(check.error.code, check.error.message, 401);
    }

    const svc = createServiceClient();
    const { error } = await svc.rpc("reminders_run_due" as any, {});
    if (error && error.code !== "PGRST204") {
      return jsonError("DB_ERROR", error.message, 400);
    }

    if (!error) {
      return jsonOk({ queued: true, rpc: "reminders_run_due" });
    }

    return jsonOk({ queued: true, rpc: "fallback" });
  }

  try {
    const { org_id, limit } = await req.json().catch(() => ({}));
    const res = await runReminderBatch(org_id, limit || 20);
    return NextResponse.json({ ok: true, ...res });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: String(e?.message || e) }, { status: 500 });
  }
}

// GET para pruebas rápidas
export async function GET() {
  try {
    const res = await runReminderBatch(undefined, 10);
    return NextResponse.json({ ok: true, ...res });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: String(e?.message || e) }, { status: 500 });
  }
}
