// lib/reports/agenda_kpi.ts
import { computeAgendaSummary, dateKeyInTZ, type Booking } from "./agenda";
import { pctSummary } from "./stats";

export type RateRow = {
  key: string; // resource_id o patient_id (si existen) o nombre
  name: string; // etiqueta mostrable
  count_total: number;
  count_ns: number;
  count_completed: number;
  count_cancelled: number;
  rate: number; // no-show rate [0..1]
};

export function computeRatesByResource(
  org_id: string,
  from: string,
  to: string,
  tz: string,
  items: Booking[],
  min_n: any = 10,
): { rows: RateRow[]; percentiles: ReturnType<typeof pctSummary> } {
  const map = new Map<string, RateRow>();
  for (const b of items) {
    const status = (b.status ?? "scheduled").toString().toLowerCase();
    const resKey = (b.resource_id || b.resource_name || "Sin recurso").toString();
    const resName = (b.resource_name || b.provider || resKey).toString();
    const row = map.get(resKey) ?? {
      key: resKey,
      name: resName,
      count_total: 0,
      count_ns: 0,
      count_completed: 0,
      count_cancelled: 0,
      rate: 0,
    };
    row.count_total += 1;
    if (/no[\s_-]?show|missed|did[_\s-]?not[_\s-]?attend/.test(status)) row.count_ns += 1;
    else if (/cancel/.test(status)) row.count_cancelled += 1;
    else if (/(completed|done|attend|served)/.test(status)) row.count_completed += 1;
    map.set(resKey, row);
  }
  const rows = Array.from(map.values())
    .map((r: any) => ({ ...r, rate: r.count_total ? r.count_ns / r.count_total : 0 }))
    .filter((r: any) => r.count_total >= min_n)
    .sort((a: any, b: any) => b.rate - a.rate || b.count_total - a.count_total);
  const percentiles = pctSummary(rows.map((r: any) => r.rate));
  return { rows, percentiles };
}

export function computeRatesByPatient(
  org_id: string,
  from: string,
  to: string,
  tz: string,
  items: Booking[],
  min_n: any = 3,
): { rows: RateRow[]; percentiles: ReturnType<typeof pctSummary> } {
  const map = new Map<string, RateRow>();
  for (const b of items) {
    const status = (b.status ?? "scheduled").toString().toLowerCase();
    const pKey = (b.patient_id || b.patient || "Sin paciente").toString();
    const pName = (b.patient_name || b.patient || pKey).toString();
    const row = map.get(pKey) ?? {
      key: pKey,
      name: pName,
      count_total: 0,
      count_ns: 0,
      count_completed: 0,
      count_cancelled: 0,
      rate: 0,
    };
    row.count_total += 1;
    if (/no[\s_-]?show|missed|did[_\s-]?not[_\s-]?attend/.test(status)) row.count_ns += 1;
    else if (/cancel/.test(status)) row.count_cancelled += 1;
    else if (/(completed|done|attend|served)/.test(status)) row.count_completed += 1;
    map.set(pKey, row);
  }
  const rows = Array.from(map.values())
    .map((r: any) => ({ ...r, rate: r.count_total ? r.count_ns / r.count_total : 0 }))
    .filter((r: any) => r.count_total >= min_n)
    .sort((a: any, b: any) => b.rate - a.rate || b.count_total - a.count_total);
  const percentiles = pctSummary(rows.map((r: any) => r.rate));
  return { rows, percentiles };
}
