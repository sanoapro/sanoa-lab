// lib/reports/predictions.ts
import { type Booking } from "./agenda";

/** Normaliza a clave "YYYY-WW" (semana ISO simple) en tz aproximado (ignora DST). */
export function weekKey(d: Date) {
  const date = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  // Jueves como pivote ISO
  const dayNum = (date.getUTCDay() + 6) % 7;
  date.setUTCDate(date.getUTCDate() - dayNum + 3);
  const isoYear = date.getUTCFullYear();
  const jan4 = new Date(Date.UTC(isoYear, 0, 4));
  const week = Math.round(
    (date.getTime() - jan4.getTime()) / 86400000 / 7 + 1
  );
  return `${isoYear}-${String(week).padStart(2, "0")}`;
}

function isNoShow(status?: string | null) {
  const s = (status ?? "").toLowerCase();
  return /no[\s_-]?show|missed|did[_\s-]?not[_\s-]?attend/.test(s);
}

/** Agrega por semana el rate de no-show del paciente. */
export function weeklyRatesByPatient(bookings: Booking[]) {
  const map = new Map<string, Map<string, { t: number; ns: number }>>();
  for (const b of bookings) {
    const pid = (b.patient_id || b.patient || "NA").toString();
    const start = b.start_at ? new Date(b.start_at) : null;
    if (!start) continue;
    const wk = weekKey(start);
    const m = map.get(pid) ?? new Map();
    const cell = m.get(wk) ?? { t: 0, ns: 0 };
    cell.t += 1;
    if (isNoShow(b.status ?? "")) cell.ns += 1;
    m.set(wk, cell);
    map.set(pid, m);
  }
  // a arrays ordenados por semana
  const out = new Map<string, Array<{ week: string; rate: number }>>();
  for (const [pid, m] of map) {
    const arr = Array.from(m.entries())
      .map(([week, v]) => ({ week, rate: v.t ? v.ns / v.t : 0 }))
      .sort((a, b) => (a.week < b.week ? -1 : a.week > b.week ? 1 : 0));
    out.set(pid, arr);
  }
  return out;
}

/** Diferencia entre promedio reciente (N semanas) y previo (N semanas) */
export function deltaRecent(
  series: Array<{ rate: number }>,
  recentWeeks = 4
) {
  if (!series.length) return 0;
  const n = series.length;
  const lo = Math.max(0, n - recentWeeks * 2);
  const mid = Math.max(0, n - recentWeeks);
  const prev = series.slice(lo, mid);
  const curr = series.slice(mid, n);
  const avg = (xs: typeof series) =>
    xs.length ? xs.reduce((s, x) => s + x.rate, 0) / xs.length : 0;
  return avg(curr) - avg(prev);
}
