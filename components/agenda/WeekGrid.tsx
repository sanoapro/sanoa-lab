"use client";

import { useEffect, useMemo, useState } from "react";

type Appt = {
  id: string;
  patient_id: string;
  starts_at: string;
  ends_at: string;
  status: string;
  location: string | null;
  notes: string | null;
};
type Avail = {
  weekday: number;
  start_time: string;
  end_time: string;
  slot_minutes: number;
  tz: string;
};
type Override = {
  date: string;
  kind: "block" | "extra";
  start_time: string;
  end_time: string;
};

function dayKey(d: Date) {
  return d.toISOString().slice(0, 10);
}
function addDays(d: Date, n: number) {
  return new Date(d.getTime() + n * 86400000);
}
function toLocalHm(date: Date) {
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function WeekGrid({
  orgId,
  providerId,
  tz,
  baseDate,
  patientId,
  defaultDurationMin = 30,
}: {
  orgId: string;
  providerId: string;
  tz: string;
  baseDate: string;
  patientId?: string | null;
  defaultDurationMin?: number;
}) {
  const weekStart = useMemo(() => new Date(`${baseDate}T00:00:00`), [baseDate]);
  const weekDays = useMemo(() => [...Array(7)].map((_: any, i: any) => addDays(weekStart, i)), [weekStart]);

  const [availability, setAvailability] = useState<Avail[]>([]);
  const [overrides, setOverrides] = useState<Override[]>([]);
  const [appts, setAppts] = useState<Appt[]>([]);
  const [hoursStart, setHoursStart] = useState(8);
  const [hoursEnd, setHoursEnd] = useState(20);
  const [busy, setBusy] = useState(false);
  const [resched, setResched] = useState<{
    id: string;
    newStart: string;
    duration: number;
  } | null>(null);

  const fromIso = useMemo(() => new Date(weekStart).toISOString(), [weekStart]);
  const toIso = useMemo(() => new Date(addDays(weekStart, 7)).toISOString(), [weekStart]);

  async function loadAll() {
    if (!orgId || !providerId) return;
    setBusy(true);
    const qs1 = new URLSearchParams({
      org_id: orgId,
      provider_id: providerId,
      week_start: baseDate,
    });
    const qs2 = new URLSearchParams({
      org_id: orgId,
      provider_id: providerId,
      from: fromIso,
      to: toIso,
    });
    const [a, b] = await Promise.all([
      fetch(`/api/agenda/availability/week?${qs1.toString()}`, {
        cache: "no-store",
      }).then((r: any) => r.json()),
      fetch(`/api/agenda/appointments/list?${qs2.toString()}`, {
        cache: "no-store",
      }).then((r: any) => r.json()),
    ]);
    setAvailability(a?.ok ? a.data.availability : []);
    setOverrides(a?.ok ? a.data.overrides : []);
    setAppts(b?.ok ? b.data : []);
    setBusy(false);
  }

  useEffect(() => {
    loadAll();
     
  }, [orgId, providerId, baseDate, tz]);

  function isWithinAvailability(d: Date) {
    const wd = d.getDay() === 0 ? 7 : d.getDay();
    const hm = d.toTimeString().slice(0, 5);
    const day = dayKey(d);
    const avs = availability.filter((a: any) => a.weekday === wd);
    if (avs.length === 0) return false;
    const base = avs.some((a: any) => `${hm}` >= a.start_time && `${hm}` < a.end_time);
    const extras = overrides.filter((o: any) => o.date === day && o.kind === "extra");
    if (extras.length > 0) {
      return extras.some((x: any) => hm >= x.start_time && hm < x.end_time);
    }
    const blocks = overrides.filter((o: any) => o.date === day && o.kind === "block");
    if (blocks.some((x: any) => hm >= x.start_time && hm < x.end_time)) return false;
    return base;
  }

  function apptAt(d: Date) {
    const iso = d.toISOString();
    return appts.find((a: any) => !(a.ends_at <= iso || iso < a.starts_at));
  }

  async function createAt(d: Date) {
    if (!patientId) {
      alert("Selecciona paciente antes de crear una cita.");
      return;
    }
    if (!isWithinAvailability(d)) {
      alert("Fuera de disponibilidad/override.");
      return;
    }
    const payload = {
      org_id: orgId,
      provider_id: providerId,
      patient_id: patientId,
      starts_at: d.toISOString(),
      duration_min: defaultDurationMin,
      tz,
      schedule_reminders: true,
    };
    const r = await fetch("/api/agenda/appointments/create", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    const j = await r.json();
    if (!j.ok) {
      alert(j.error?.message ?? "Error al crear cita");
      return;
    }
    await loadAll();
  }

  async function markStatus(id: string, status: "completed" | "no_show" | "cancelled") {
    const r = await fetch("/api/agenda/appointments/update-status", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ org_id: orgId, ids: [id], status }),
    });
    const j = await r.json();
    if (!j.ok) {
      alert(j.error?.message ?? "Error al actualizar");
      return;
    }
    await loadAll();
  }

  async function doReschedule() {
    if (!resched) return;
    const r = await fetch("/api/agenda/appointments/reschedule", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        org_id: orgId,
        id: resched.id,
        starts_at: resched.newStart,
        duration_min: resched.duration,
      }),
    });
    const j = await r.json();
    if (!j.ok) {
      alert(j.error?.message ?? "No se pudo reprogramar");
      return;
    }
    setResched(null);
    await loadAll();
  }

  const hours = useMemo(() => {
    const arr: string[] = [];
    for (let h = hoursStart; h <= hoursEnd; h += 1) {
      arr.push(String(h).padStart(2, "0") + ":00");
      arr.push(String(h).padStart(2, "0") + ":30");
    }
    return arr;
  }, [hoursStart, hoursEnd]);

  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2 text-sm">
        <span className="px-2 py-1 rounded border bg-white">
          Semana: {dayKey(weekDays[0])} → {dayKey(weekDays[6])}
        </span>
        <span className="px-2 py-1 rounded border bg-white">{busy ? "Cargando…" : "Listo"}</span>
        <div className="ml-auto flex items-center gap-2">
          <label>Horario:</label>
          <input
            type="number"
            className="border rounded px-2 py-1 w-16"
            min={0}
            max={23}
            value={hoursStart}
            onChange={(e: any) => setHoursStart(Number(e.target.value || 8))}
          />
          <span>—</span>
          <input
            type="number"
            className="border rounded px-2 py-1 w-16"
            min={0}
            max={23}
            value={hoursEnd}
            onChange={(e: any) => setHoursEnd(Number(e.target.value || 20))}
          />
          <button className="border rounded px-3 py-1" onClick={loadAll}>
            Actualizar
          </button>
        </div>
      </div>

      <div className="grid grid-cols-8 border rounded-2xl overflow-hidden">
        <div className="bg-slate-50 p-2 text-sm font-medium">Hora</div>
        {weekDays.map((d: any, i: any) => (
          <div key={i} className="bg-slate-50 p-2 text-sm font-medium">
            {d.toLocaleDateString(undefined, {
              weekday: "short",
              day: "2-digit",
              month: "short",
            })}
          </div>
        ))}

        {hours.map((hm: any, rIdx: any) => (
          <FragmentRow
            key={rIdx}
            hm={hm}
            weekDays={weekDays}
            appts={appts}
            isWithinAvailability={isWithinAvailability}
            apptAt={apptAt}
            onCreate={createAt}
            onStatus={markStatus}
            onPlanReschedule={(id: any, newStartIso: any, dur: any) =>
              setResched({ id, newStart: newStartIso, duration: dur })
            }
          />
        ))}
      </div>

      {resched && (
        <div className="p-3 border rounded-xl bg-white flex items-center gap-3">
          <span className="font-medium">Reprogramar</span>
          <input
            type="datetime-local"
            className="border rounded px-3 py-2"
            value={resched.newStart.slice(0, 16)}
            onChange={(e: any) =>
              setResched({
                ...resched,
                newStart: new Date(e.target.value).toISOString(),
              })
            }
          />
          <input
            type="number"
            min={10}
            max={240}
            className="border rounded px-3 py-2 w-24"
            value={resched.duration}
            onChange={(e: any) =>
              setResched({
                ...resched,
                duration: Number(e.target.value || 30),
              })
            }
          />
          <button className="border rounded px-3 py-2" onClick={doReschedule}>
            Guardar
          </button>
          <button className="border rounded px-3 py-2" onClick={() => setResched(null)}>
            Cancelar
          </button>
        </div>
      )}
    </section>
  );
}

function FragmentRow({
  hm,
  weekDays,
  appts,
  isWithinAvailability,
  apptAt,
  onCreate,
  onStatus,
  onPlanReschedule,
}: {
  hm: string;
  weekDays: Date[];
  appts: Appt[];
  isWithinAvailability: (d: Date) => boolean;
  apptAt: (d: Date) => Appt | undefined;
  onCreate: (d: Date) => Promise<void>;
  onStatus: (id: string, st: "completed" | "no_show" | "cancelled") => Promise<void>;
  onPlanReschedule: (id: string, newStartIso: string, dur: number) => void;
}) {
  return (
    <>
      <div className="p-2 border-t text-xs text-slate-500">{hm}</div>
      {weekDays.map((d: any, cIdx: any) => {
        const dt = new Date(`${d.toISOString().slice(0, 10)}T${hm}:00`);
        const ap = apptAt(dt);
        const allowed = isWithinAvailability(dt);
        if (ap) {
          const dur = Math.max(
            10,
            Math.round((new Date(ap.ends_at).getTime() - new Date(ap.starts_at).getTime()) / 60000),
          );
          return (
            <div key={cIdx} className="border-t p-1">
              <div className="rounded-lg border px-2 py-1 bg-sky-50 text-sky-900 text-xs flex items-center justify-between">
                <div className="truncate">
                  {toLocalHm(new Date(ap.starts_at))} • {dur} min • {ap.status}
                </div>
                <div className="flex items-center gap-1 ml-2">
                  <button
                    className="px-2 py-0.5 rounded border"
                    onClick={() => onStatus(ap.id, "completed")}
                  >
                    ✔
                  </button>
                  <button
                    className="px-2 py-0.5 rounded border"
                    onClick={() => onStatus(ap.id, "no_show")}
                  >
                    ⛔
                  </button>
                  <button
                    className="px-2 py-0.5 rounded border"
                    onClick={() => {
                      const iso = new Date(ap.starts_at).toISOString();
                      onPlanReschedule(ap.id, iso, dur);
                    }}
                  >
                    ↻
                  </button>
                </div>
              </div>
            </div>
          );
        }
        return (
          <button
            key={cIdx}
            className={[
              "border-t h-10 w-full text-xs",
              allowed ? "hover:bg-emerald-50" : "bg-slate-50 text-slate-400 cursor-not-allowed",
            ].join(" ")}
            onClick={() => allowed && onCreate(dt)}
            disabled={!allowed}
            title={allowed ? "Crear cita aquí" : "Fuera de disponibilidad"}
            aria-label={allowed ? "Crear cita" : "No disponible"}
          />
        );
      })}
    </>
  );
}
