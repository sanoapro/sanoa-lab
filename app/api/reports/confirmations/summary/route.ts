import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";

function startOfDayISO(tz: string) {
  const now = new Date();
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const [y, m, d] = fmt.format(now).split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d, 0, 0, 0)).toISOString();
}

function daysAgoISO(n: number) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - n);
  d.setUTCHours(0, 0, 0, 0);
  return d.toISOString();
}

export async function GET(req: Request) {
  const svc = createServiceClient();
  const { searchParams } = new URL(req.url);
  const org_id = searchParams.get("org_id") || undefined;
  const tz = searchParams.get("tz") || "America/Mexico_City";

  const startToday = startOfDayISO(tz);
  const start7 = daysAgoISO(6);

  const whereOrg = (q: any) => (org_id ? q.eq("org_id", org_id) : q);

  const { data: remToday } = await whereOrg(
    svc.from("reminders").select("status").gte("created_at", startToday),
  );
  const { data: logsToday } = await whereOrg(
    svc.from("reminder_logs").select("status").gte("created_at", startToday),
  );

  const { data: rem7 } = await whereOrg(
    svc.from("reminders").select("status, created_at").gte("created_at", start7),
  );
  const { data: logs7 } = await whereOrg(
    svc.from("reminder_logs").select("status, created_at").gte("created_at", start7),
  );

  const count = (arr: any[] = [], field: string, val: string) =>
    arr.filter((x: any) => x[field] === val).length;

  const today = {
    sent: count(logsToday, "status", "sent") + count(logsToday, "status", "delivered"),
    delivered: count(logsToday, "status", "delivered"),
    failed: count(logsToday, "status", "failed"),
    confirmed: count(remToday, "status", "confirmed"),
    cancelled: count(remToday, "status", "cancelled"),
  };

  const last7 = {
    sent: count(logs7, "status", "sent") + count(logs7, "status", "delivered"),
    delivered: count(logs7, "status", "delivered"),
    failed: count(logs7, "status", "failed"),
    confirmed: count(rem7, "status", "confirmed"),
    cancelled: count(rem7, "status", "cancelled"),
  };

  return NextResponse.json({ ok: true, tz, today, last7 });
}
