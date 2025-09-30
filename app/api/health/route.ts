// MODE: service (no session, no cookies)
// GET /api/health
import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function GET() {
  // MODE: service
  try {
    const svc = createServiceClient();

    // DB Ping
    const { error: dbErr } = await svc.rpc("now"); // si no existe rpc now, hacemos un select trivial:
    let db_ok = true;
    if (dbErr) {
      // fallback
      const { error: err2 } = await svc.from("audit_log").select("id").limit(1);
      db_ok = !err2; // si también falla, marcamos false
    }

    const has = (v?: string) => typeof v === "string" && v.length > 0;

    const storage_configured = has(process.env.NEXT_PUBLIC_SUPABASE_URL);
    const stripe_configured = has(process.env.STRIPE_SECRET_KEY);
    const twilio_configured = has(process.env.TWILIO_AUTH_TOKEN) || has(process.env.TWILIO_API_KEY);
    const cal_configured =
      has(process.env.CALCOM_API_KEY) || has(process.env.NEXT_PUBLIC_CALCOM_URL);
    const build_info = {
      env: process.env.NODE_ENV,
      commit: process.env.VERCEL_GIT_COMMIT_SHA ?? process.env.GIT_COMMIT ?? null,
    };

    return NextResponse.json({
      ok: true,
      data: {
        db_ok,
        storage_configured,
        stripe_configured,
        twilio_configured,
        cal_configured,
        build_info,
      },
    });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: { code: "SERVER_ERROR", message: e?.message ?? "Error" } },
      { status: 500 },
    );
  }
}
