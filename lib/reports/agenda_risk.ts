// lib/reports/agenda_risk.ts
import { dateKeyInTZ, type Booking } from "./agenda";

export type PatientRiskRow = {
  patient_key: string; // id o texto
  patient_name: string; // etiqueta
  total: number; // citas en ventana
  no_show: number; // no-shows
  completed: number; // atendidas
  cancelled: number; // canceladas
  ns_rate: number; // no_show / total
  ns_streak: number; // racha reciente de no-shows
  days_since_attended: number | null; // días desde última cita atendida
  risk_score: number; // 0..1
  risk_band: "low" | "med" | "high";
};

function isNoShow(status: string) {
  const s = (status || "").toLowerCase();
  return /no[\s_-]?show|missed|did[_\s-]?not[_\s-]?attend/.test(s);
}
function isCancelled(status: string) {
  const s = (status || "").toLowerCase();
  return /cancel/.test(s);
}
function isCompleted(status: string) {
  const s = (status || "").toLowerCase();
  return /(completed|done|attend|served)/.test(s);
}

/** Calcula racha de no-shows al final de la serie (ordenada por fecha asc). */
function trailingNoShowStreak(items: Booking[]): number {
  let n = 0;
  for (let i = items.length - 1; i >= 0; i--) {
    const st = (items[i].status ?? "").toString();
    if (isNoShow(st)) n += 1;
    else break;
  }
  return n;
}

export function computePatientRisk(
  org_id: string,
  from: string,
  to: string,
  tz: string,
  items: Booking[],
  min_n = 3,
  top = 50,
): PatientRiskRow[] {
  // Agrupar por paciente
  const byPat = new Map<string, Booking[]>();
  for (const b of items) {
    const key = (b.patient_id || b.patient || "Sin paciente").toString();
    const arr = byPat.get(key) ?? [];
    arr.push(b);
    byPat.set(key, arr);
  }

  const todayKey = dateKeyInTZ(new Date().toISOString(), tz);

  const rows: PatientRiskRow[] = [];
  for (const [key, arr0] of byPat) {
    // Ordenar por fecha de inicio asc
    const arr = arr0.slice().sort((a, b) => {
      const as = a.start_at ? +new Date(a.start_at) : 0;
      const bs = b.start_at ? +new Date(b.start_at) : 0;
      return as - bs;
    });
    const name = (arr[0]?.patient_name || arr[0]?.patient || key).toString();

    let total = 0,
      ns = 0,
      comp = 0,
      canc = 0;
    let lastAttendedDate: Date | null = null;

    for (const b of arr) {
      total += 1;
      const st = (b.status ?? "").toString();
      if (isNoShow(st)) ns += 1;
      else if (isCancelled(st)) canc += 1;
      else if (isCompleted(st)) {
        comp += 1;
        const d = b.start_at ? new Date(b.start_at) : null;
        if (d && (!lastAttendedDate || d > lastAttendedDate)) lastAttendedDate = d;
      }
    }

    if (total < min_n) continue;

    const ns_rate = total ? ns / total : 0;
    const ns_streak = trailingNoShowStreak(arr);

    // days_since_attended
    let days_since_attended: number | null = null;
    if (lastAttendedDate) {
      const ms = +new Date(`${todayKey}T00:00:00Z`) - +new Date(lastAttendedDate);
      days_since_attended = Math.max(0, Math.round(ms / 86400000));
    }

    // Heurística de riesgo (conservadora, 0..1)
    //  - 0.7 * tasa no-show
    //  - +0.2 si racha >= 2 (sino 0)
    //  - + hasta 0.1 por "olvido" si nunca atendió o >90d desde última asistencia
    const streakBoost = ns_streak >= 2 ? 0.2 : 0;
    const recencyBoost =
      days_since_attended === null ? 0.1 : Math.min(0.1, (days_since_attended / 90) * 0.1);
    const risk = Math.max(0, Math.min(1, 0.7 * ns_rate + streakBoost + recencyBoost));

    const band: PatientRiskRow["risk_band"] = risk >= 0.5 ? "high" : risk >= 0.25 ? "med" : "low";

    rows.push({
      patient_key: key,
      patient_name: name,
      total,
      no_show: ns,
      completed: comp,
      cancelled: canc,
      ns_rate: Math.round(ns_rate * 1000) / 1000,
      ns_streak,
      days_since_attended,
      risk_score: Math.round(risk * 1000) / 1000,
      risk_band: band,
    });
  }

  // Ordenar por riesgo desc, luego por total desc
  const sorted = rows.sort((a, b) => b.risk_score - a.risk_score || b.total - a.total);
  return sorted.slice(0, Math.max(1, top));
}
