// lib/reports/agenda.ts
export type Booking = {
  id?: string;
  status?: string | null;
  start_at?: string | null; // ISO
  end_at?: string | null; // ISO
  created_at?: string | null;
  resource_id?: string | null;
  resource_name?: string | null;
  provider?: string | null;
  [k: string]: any;
};

export type AgendaSummary = {
  org_id: string;
  from: string;
  to: string;
  tz: string;
  totals: {
    total: number;
    completed: number;
    no_show: number;
    cancelled: number;
    other: number;
    avg_duration_min: number;
    avg_lead_time_h: number;
  };
  by_day: Array<{
    date: string; // YYYY-MM-DD en tz
    total: number;
    completed: number;
    no_show: number;
    cancelled: number;
    other: number;
    avg_duration_min: number;
    avg_lead_time_h: number;
  }>;
  by_resource: Array<{
    resource: string;
    total: number;
    completed: number;
    no_show: number;
    cancelled: number;
    other: number;
  }>;
};

function mapDowShort(w: string) {
  const m: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  return m[w] ?? 0;
}

export function dateKeyInTZ(iso: string, tz: string): string {
  const d = new Date(iso);
  const parts = new Intl.DateTimeFormat("en-CA", {
    // YYYY-MM-DD
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })
    .formatToParts(d)
    .reduce<Record<string, string>>((acc, p) => {
      if (p.type !== "literal") acc[p.type] = p.value;
      return acc;
    }, {});
  return `${parts.year}-${parts.month}-${parts.day}`;
}

function isNoShow(status: string) {
  const s = status.toLowerCase();
  return /no[\s_-]?show|missed|did[_\s-]?not[_\s-]?attend/.test(s);
}
function isCancelled(status: string) {
  const s = status.toLowerCase();
  return /cancel/.test(s);
}
function isCompleted(status: string) {
  const s = status.toLowerCase();
  return /(completed|done|attend|served)/.test(s);
}

export function computeAgendaSummary(
  org_id: string,
  from: string,
  to: string,
  tz: string,
  items: Booking[],
  resourceLabelFallback = "Sin recurso",
): AgendaSummary {
  const totals = { total: 0, completed: 0, no_show: 0, cancelled: 0, other: 0 };
  let durationSumMin = 0;
  let durationCount = 0;
  let leadSumH = 0;
  let leadCount = 0;

  const byDayMap = new Map<
    string,
    {
      total: number;
      completed: number;
      no_show: number;
      cancelled: number;
      other: number;
      durSum: number;
      durN: number;
      leadSum: number;
      leadN: number;
    }
  >();
  const byResMap = new Map<
    string,
    { total: number; completed: number; no_show: number; cancelled: number; other: number }
  >();

  for (const b of items) {
    const status = (b.status ?? "scheduled").toString();
    const start = b.start_at ? new Date(b.start_at) : null;
    const end = b.end_at ? new Date(b.end_at) : null;
    const created = b.created_at ? new Date(b.created_at) : null;

    totals.total += 1;
    let bucket: "completed" | "no_show" | "cancelled" | "other" = "other";
    if (isNoShow(status)) bucket = "no_show";
    else if (isCancelled(status)) bucket = "cancelled";
    else if (isCompleted(status)) bucket = "completed";
    totals[bucket] += 1;

    if (start && end && !isNaN(+start) && !isNaN(+end) && end > start) {
      durationSumMin += (end.getTime() - start.getTime()) / 60000;
      durationCount += 1;
    }
    if (start && created && !isNaN(+start) && !isNaN(+created) && start > created) {
      leadSumH += (start.getTime() - created.getTime()) / 3600000;
      leadCount += 1;
    }

    const key = start
      ? dateKeyInTZ(start.toISOString(), tz)
      : dateKeyInTZ(new Date().toISOString(), tz);
    const d = byDayMap.get(key) ?? {
      total: 0,
      completed: 0,
      no_show: 0,
      cancelled: 0,
      other: 0,
      durSum: 0,
      durN: 0,
      leadSum: 0,
      leadN: 0,
    };
    d.total += 1;
    d[bucket] += 1;
    if (start && end && end > start) {
      d.durSum += (end.getTime() - start.getTime()) / 60000;
      d.durN += 1;
    }
    if (start && created && start > created) {
      d.leadSum += (start.getTime() - created.getTime()) / 3600000;
      d.leadN += 1;
    }
    byDayMap.set(key, d);

    const resName = (
      b.resource_name ||
      b.provider ||
      b.resource_id ||
      resourceLabelFallback
    ).toString();
    const r = byResMap.get(resName) ?? {
      total: 0,
      completed: 0,
      no_show: 0,
      cancelled: 0,
      other: 0,
    };
    r.total += 1;
    r[bucket] += 1;
    byResMap.set(resName, r);
  }

  const by_day = Array.from(byDayMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, d]) => ({
      date,
      total: d.total,
      completed: d.completed,
      no_show: d.no_show,
      cancelled: d.cancelled,
      other: d.other,
      avg_duration_min: d.durN ? Math.round((d.durSum / d.durN) * 10) / 10 : 0,
      avg_lead_time_h: d.leadN ? Math.round((d.leadSum / d.leadN) * 10) / 10 : 0,
    }));

  const by_resource = Array.from(byResMap.entries())
    .sort((a, b) => b[1].total - a[1].total)
    .map(([resource, r]) => ({
      resource,
      total: r.total,
      completed: r.completed,
      no_show: r.no_show,
      cancelled: r.cancelled,
      other: r.other,
    }));

  const avg_duration_min = durationCount
    ? Math.round((durationSumMin / durationCount) * 10) / 10
    : 0;
  const avg_lead_time_h = leadCount ? Math.round((leadSumH / leadCount) * 10) / 10 : 0;

  return {
    org_id,
    from,
    to,
    tz,
    totals: { ...totals, avg_duration_min, avg_lead_time_h },
    by_day,
    by_resource,
  };
}
