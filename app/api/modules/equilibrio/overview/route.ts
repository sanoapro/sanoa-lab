// MODE: session (user-scoped, cookies)
// GET /api/modules/equilibrio/overview?org_id&patient_id&from?&to?
import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const supa = await getSupabaseServer();
  const { data: auth } = await supa.auth.getUser();
  if (!auth?.user)
    return NextResponse.json(
      { ok: false, error: { code: "UNAUTHORIZED", message: "No autenticado" } },
      { status: 401 },
    );

  const url = new URL(req.url);
  const org_id = url.searchParams.get("org_id");
  const patient_id = url.searchParams.get("patient_id");
  if (!org_id || !patient_id) {
    return NextResponse.json(
      { ok: false, error: { code: "BAD_REQUEST", message: "org_id y patient_id requeridos" } },
      { status: 400 },
    );
  }

  const from =
    url.searchParams.get("from") || new Date(Date.now() - 7 * 864e5).toISOString().slice(0, 10);
  const to = url.searchParams.get("to") || new Date().toISOString().slice(0, 10);

  // Plan activo + items
  const { data: plan } = await supa
    .from("equilibrio_plans")
    .select("id, starts_on")
    .eq("org_id", org_id)
    .eq("patient_id", patient_id)
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!plan)
    return NextResponse.json({
      ok: true,
      data: { adherence_pct: 0, totals: { done: 0, skipped: 0 }, recent: [] },
    });

  const { data: items } = await supa
    .from("equilibrio_plan_items")
    .select("id, mon, tue, wed, thu, fri, sat, sun, library:equilibrio_task_library(title)")
    .eq("plan_id", plan.id);

  // Check-ins en rango
  const { data: chks } = await supa
    .from("equilibrio_checkins")
    .select("id, item_id, day, status, created_at")
    .eq("org_id", org_id)
    .eq("patient_id", patient_id)
    .gte("day", from)
    .lte("day", to)
    .order("day", { ascending: true })
    .limit(2000);

  // Calcular totales/rendimiento sencillo
  const recent = (chks || []).slice(-20).reverse();
  const totals = { done: 0, skipped: 0 };
  (chks || []).forEach((c) => {
    if (c.status === "done") totals.done++;
    else totals.skipped++;
  });

  // Estimación de "esperados" en el rango: contar días habilitados por item
  function dayOfWeekISO(dateStr: string) {
    // 1..7 (Mon..Sun)
    const d = new Date(dateStr + "T00:00:00Z");
    const n = d.getUTCDay();
    return n === 0 ? 7 : n;
  }

  let expected = 0;
  // construir lista de fechas del rango
  const dates: string[] = [];
  {
    const sd = new Date(from + "T00:00:00Z");
    const ed = new Date(to + "T00:00:00Z");
    for (let t = sd.getTime(); t <= ed.getTime(); t += 864e5) {
      dates.push(new Date(t).toISOString().slice(0, 10));
    }
  }
  (items || []).forEach((it) => {
    dates.forEach((d) => {
      const dow = dayOfWeekISO(d);
      const active =
        (dow === 1 && it.mon) ||
        (dow === 2 && it.tue) ||
        (dow === 3 && it.wed) ||
        (dow === 4 && it.thu) ||
        (dow === 5 && it.fri) ||
        (dow === 6 && it.sat) ||
        (dow === 7 && it.sun);
      if (active) expected++;
    });
  });

  const adherence_pct = expected ? Math.round((totals.done / expected) * 100) : 0;

  return NextResponse.json({ ok: true, data: { adherence_pct, totals, recent } });
}
