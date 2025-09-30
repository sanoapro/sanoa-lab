import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { sendTwilioSMS, sendTwilioWhatsApp } from "@/lib/notify/twilio";

export const runtime = "nodejs";

export async function POST(req: Request) {
  // Autorización simple por header (configura CRON_SECRET en el entorno del servidor)
  const sec = process.env.CRON_SECRET || "";
  if (!sec || req.headers.get("x-cron-secret") !== sec) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supa = createServiceClient();

  // 1) Leer balances y settings
  const { data: balances } = await supa.from("org_ledger_balances").select("*");
  const { data: settings } = await supa.from("org_bank_settings").select("*");

  const settingsMap = new Map<string, any>();
  (settings || []).forEach((s: any) => settingsMap.set(s.org_id, s));

  const alerts: any[] = [];
  for (const b of balances || []) {
    const s = settingsMap.get(b.org_id);
    if (!s) continue;
    const balance = Number(b.balance_cents || 0);
    const threshold = Number(s.low_balance_threshold_cents || 0);
    if (threshold > 0 && balance < threshold) {
      alerts.push({
        org_id: b.org_id,
        balance,
        threshold,
        channel: s.notify_channel,
        to: s.notify_to,
      });
    }
  }

  // 2) Enviar alertas
  const results: any[] = [];
  for (const a of alerts) {
    try {
      const msg = `Sanoa Bank: tu saldo es ${currency(a.balance)} y está por debajo del umbral ${currency(a.threshold)}. Recarga aquí: ${baseUrl()}/banco/depositar`;
      if (a.channel === "whatsapp" && a.to) {
        await sendTwilioWhatsApp(a.to, msg);
      } else if (a.channel === "sms" && a.to) {
        await sendTwilioSMS(a.to, msg);
      }
      results.push({ org_id: a.org_id, ok: true });
    } catch (e: any) {
      results.push({ org_id: a.org_id, ok: false, error: String(e?.message || e) });
    }
  }

  return NextResponse.json({ ok: true, alerts: results });
}

function currency(cents: number) {
  return (cents / 100).toLocaleString("es-MX", { style: "currency", currency: "MXN" });
}
function baseUrl() {
  return (process.env.NEXT_PUBLIC_BASE_URL || "").replace(/\/$/, "") || "http://localhost:3000";
}
