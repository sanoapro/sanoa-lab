// components/agenda/SmartSlots.tsx
"use client";
import { useCallback, useEffect, useState } from "react";
import NoShowBadge from "./NoShowBadge";

type Slot = { start_iso: string; end_iso: string; score: number; reasons: string[] };

export default function SmartSlots({
  orgId,
  providerId,
  date,
  tz,
  duration,
  patientId,
  onPick,
}: {
  orgId: string;
  providerId: string;
  date: string;
  tz: string;
  duration: number;
  patientId?: string | null;
  onPick: (slot: Slot) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<Slot[]>([]);

  const load = useCallback(async () => {
    if (!orgId || !providerId || !date) return;
    setLoading(true);
    const p = new URLSearchParams({
      org_id: orgId,
      provider_id: providerId,
      date,
      tz,
      duration: String(duration),
      limit: "60",
    });
    if (patientId) p.set("patient_id", patientId);
    const r = await fetch(`/api/agenda/slots/suggest?${p.toString()}`, { cache: "no-store" });
    const j = await r.json();
    setRows(j?.ok ? j.data : []);
    setLoading(false);
  }, [orgId, providerId, date, tz, duration, patientId]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <section className="border rounded-2xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Sugerencias</h3>
        <button className="border rounded px-3 py-2" onClick={load} disabled={loading}>
          {loading ? "Cargando…" : "Actualizar"}
        </button>
      </div>
      <div className="rounded border overflow-auto max-h-80">
        <table className="w-full text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="text-left px-3 py-2">Hora</th>
              <th className="text-left px-3 py-2">Duración</th>
              <th className="text-left px-3 py-2">Score</th>
              <th className="px-3 py-2 w-28"></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((s: any, i: any) => {
              const start = new Date(s.start_iso);
              const end = new Date(s.end_iso);
              const fmt = (d: Date) =>
                d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
              return (
                <tr key={i} className="border-t">
                  <td className="px-3 py-2">
                    {fmt(start)} – {fmt(end)}
                  </td>
                  <td className="px-3 py-2">
                    {Math.round((end.getTime() - start.getTime()) / 60000)} min
                  </td>
                  <td className="px-3 py-2">
                    <NoShowBadge score={s.score} />
                  </td>
                  <td className="px-3 py-2 text-right">
                    <button className="border rounded px-3 py-1" onClick={() => onPick(s)}>
                      Elegir
                    </button>
                  </td>
                </tr>
              );
            })}
            {!rows.length && (
              <tr>
                <td colSpan={4} className="px-3 py-6 text-center text-slate-500">
                  Sin sugerencias
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
