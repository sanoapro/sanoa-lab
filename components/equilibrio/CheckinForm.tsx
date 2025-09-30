// components/equilibrio/CheckinForm.tsx
"use client";
import { useEffect, useMemo, useState } from "react";

type Item = {
  id: string;
  goal?: string | null;
  mon: boolean;
  tue: boolean;
  wed: boolean;
  thu: boolean;
  fri: boolean;
  sat: boolean;
  sun: boolean;
  library: { title: string };
};

export default function CheckinForm({ orgId, patientId }: { orgId: string; patientId: string }) {
  const [plan, setPlan] = useState<{ id: string } | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [today, setToday] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [note, setNote] = useState<string>("");

  async function load() {
    const p = new URLSearchParams({ org_id: orgId, patient_id: patientId });
    const r = await fetch(`/api/modules/equilibrio/plans/get?${p.toString()}`, {
      cache: "no-store",
    });
    const j = await r.json();
    if (j?.ok && j.data) {
      setPlan(j.data.plan);
      setItems(j.data.items);
    } else {
      setPlan(null);
      setItems([]);
    }
  }

  useEffect(() => {
    if (orgId && patientId) load();
  }, [orgId, patientId]);

  const dow = useMemo(() => {
    const d = new Date(today + "T00:00:00");
    const w = d.getDay(); // 0..6 (Sun..Sat)
    return w === 0 ? 7 : w; // 1..7 Mon..Sun
  }, [today]);

  const due = useMemo(
    () =>
      items.filter((it) => {
        return (
          (dow === 1 && it.mon) ||
          (dow === 2 && it.tue) ||
          (dow === 3 && it.wed) ||
          (dow === 4 && it.thu) ||
          (dow === 5 && it.fri) ||
          (dow === 6 && it.sat) ||
          (dow === 7 && it.sun)
        );
      }),
    [items, dow],
  );

  async function mark(itemId: string, status: "done" | "skipped") {
    if (!plan) return;
    const r = await fetch("/api/modules/equilibrio/checkins/create", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        org_id: orgId,
        patient_id: patientId,
        plan_id: plan.id,
        item_id: itemId,
        date: today,
        status,
        note: note || null,
      }),
    });
    const j = await r.json();
    if (!j.ok) {
      alert(j.error?.message ?? "Error");
      return;
    }
    alert(status === "done" ? "¡Bien! Tarea marcada como hecha." : "Marcado como omitido.");
    setNote("");
  }

  if (!plan)
    return <div className="rounded-2xl border p-4">No hay plan activo para este paciente.</div>;

  return (
    <section className="border rounded-2xl p-4 space-y-3">
      <div className="flex items-center gap-2">
        <label className="text-sm">Fecha</label>
        <input
          type="date"
          className="border rounded px-3 py-2"
          value={today}
          onChange={(e) => setToday(e.target.value)}
        />
      </div>

      <div className="rounded border overflow-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-3 py-2">Tarea</th>
              <th className="text-left px-3 py-2">Meta</th>
              <th className="px-3 py-2 w-48">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {due.map((it) => (
              <tr key={it.id} className="border-t">
                <td className="px-3 py-2">{it.library.title}</td>
                <td className="px-3 py-2">{it.goal || "—"}</td>
                <td className="px-3 py-2">
                  <div className="flex gap-2">
                    <button
                      className="border rounded px-3 py-1"
                      onClick={() => mark(it.id, "done")}
                    >
                      Hecho
                    </button>
                    <button
                      className="border rounded px-3 py-1"
                      onClick={() => mark(it.id, "skipped")}
                    >
                      Omitido
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {!due.length && (
              <tr>
                <td colSpan={3} className="px-3 py-6 text-center text-slate-500">
                  No hay tareas programadas para este día.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div>
        <label className="text-sm">Nota (opcional, visible en el check-in)</label>
        <input
          className="border rounded px-3 py-2 w-full"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
      </div>
    </section>
  );
}
