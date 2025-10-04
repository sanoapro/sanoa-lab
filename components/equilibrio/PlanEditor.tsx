// components/equilibrio/PlanEditor.tsx
"use client";
import { useMemo, useState } from "react";
import LibraryPicker from "./LibraryPicker";
import PatientAutocomplete from "@/components/patients/PatientAutocomplete";
import { getActiveOrg } from "@/lib/org-local";

type Row = {
  id: string;
  module: string;
  kind: string;
  title: string;
  default_goal?: string | null;
};

type Days = {
  mon?: boolean;
  tue?: boolean;
  wed?: boolean;
  thu?: boolean;
  fri?: boolean;
  sat?: boolean;
  sun?: boolean;
};

type Item = {
  library_id: string;
  title: string;
  goal?: string | null;
  days: Days;
  notes?: string | null;
};

type PatientItem = {
  id?: string;
  patient_id?: string;
  label?: string | null;
  name?: string | null;
  display_name?: string | null;
};

export default function PlanEditor() {
  const org = useMemo(() => getActiveOrg(), []);
  const orgId = org?.id || "";

  const [patient, setPatient] = useState<{ id: string; label: string } | null>(null);
  const [startsOn, setStartsOn] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [items, setItems] = useState<Item[]>([]);
  const [replaceActive, setReplaceActive] = useState(true);
  const [saving, setSaving] = useState(false);

  function add(row: Row) {
    setItems((xs: any) => [
      ...xs,
      {
        library_id: row.id,
        title: row.title,
        goal: row.default_goal || "",
        days: { mon: true, wed: true, fri: true },
        notes: "",
      },
    ]);
  }

  function setDay(i: number, key: keyof Days, v: boolean) {
    setItems((xs: any) => xs.map((x: any, idx: any) => (idx === i ? { ...x, days: { ...x.days, [key]: v } } : x)));
  }

  async function save() {
    if (!orgId || !patient?.id) {
      alert("Selecciona organización y paciente");
      return;
    }
    if (!items.length) {
      alert("Agrega al menos una tarea");
      return;
    }
    setSaving(true);
    const payload = {
      org_id: orgId,
      patient_id: patient.id,
      starts_on: startsOn,
      replace_active: replaceActive,
      items: items.map((it: any) => ({
        library_id: it.library_id,
        goal: it.goal || null,
        days: it.days,
        notes: it.notes || null,
      })),
    };
    const r = await fetch("/api/modules/equilibrio/plans/create", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    const j = await r.json();
    setSaving(false);
    if (!j.ok) {
      alert(j.error?.message ?? "Error");
      return;
    }
    alert("Plan guardado ✅");
  }

  const weekdays: Array<keyof Days> = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
  const labels: Record<keyof Days, string> = {
    mon: "L",
    tue: "M",
    wed: "X",
    thu: "J",
    fri: "V",
    sat: "S",
    sun: "D",
  };

  return (
    <section className="space-y-6">
      <div className="border rounded-2xl p-4 space-y-3">
        <h3 className="font-semibold">Paciente y fecha de inicio</h3>
        {!orgId ? (
          <p className="text-amber-700 bg-amber-50 border border-amber-200 rounded p-3">
            Selecciona una organización activa.
          </p>
        ) : (
          <PatientAutocomplete
            orgId={orgId}
            scope="mine"
            onSelect={(p: any) =>
              setPatient({
                id: (p.id ?? p.patient_id)!,
                label: p.label ?? p.name ?? p.display_name ?? "Paciente",
              })
            }
            placeholder="Buscar paciente…"
          />
        )}
        <div className="grid md:grid-cols-3 gap-2">
          <div>
            <label className="text-sm">Inicio</label>
            <input
              type="date"
              className="border rounded px-3 py-2 w-full"
              value={startsOn}
              onChange={(e: any) => setStartsOn(e.target.value)}
            />
          </div>
          <label className="inline-flex items-center gap-2 mt-6">
            <input
              type="checkbox"
              checked={replaceActive}
              onChange={(e: any) => setReplaceActive(e.target.checked)}
            />
            <span className="text-sm">Reemplazar plan activo</span>
          </label>
        </div>
      </div>

      <LibraryPicker orgId={orgId} onAdd={add} />

      <div className="border rounded-2xl p-4 space-y-3">
        <h3 className="font-semibold">Tareas del plan</h3>
        <div className="rounded border overflow-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-3 py-2">Tarea</th>
                <th className="text-left px-3 py-2">Meta</th>
                <th className="text-left px-3 py-2">Días</th>
                <th className="text-left px-3 py-2">Notas</th>
                <th className="px-3 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {items.map((it: any, i: any) => (
                <tr key={i} className="border-t">
                  <td className="px-3 py-2">{it.title}</td>
                  <td className="px-3 py-2">
                    <input
                      className="border rounded px-2 py-1 w-40"
                      value={it.goal || ""}
                      onChange={(e: any) =>
                        setItems((xs: any) =>
                          xs.map((x: any, idx: any) => (idx === i ? { ...x, goal: e.target.value } : x)),
                        )
                      }
                    />
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex gap-1">
                      {weekdays.map((d: any) => (
                        <label key={d} className="inline-flex items-center gap-1">
                          <input
                            type="checkbox"
                            checked={!!it.days[d]}
                            onChange={(e: any) => setDay(i, d, e.target.checked)}
                          />
                          <span className="text-xs">{(labels as any)[d as any]}</span>
                        </label>
                      ))}
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    <input
                      className="border rounded px-2 py-1 w-60"
                      value={it.notes || ""}
                      onChange={(e: any) =>
                        setItems((xs: any) =>
                          xs.map((x: any, idx: any) => (idx === i ? { ...x, notes: e.target.value } : x)),
                        )
                      }
                    />
                  </td>
                  <td className="px-3 py-2">
                    <button
                      className="border rounded px-2 py-1"
                      onClick={() => setItems((xs: any) => xs.filter((_: any, idx: any) => idx !== i))}
                    >
                      Quitar
                    </button>
                  </td>
                </tr>
              ))}
              {!items.length && (
                <tr>
                  <td colSpan={5} className="px-3 py-6 text-center text-slate-500">
                    Agrega tareas desde la biblioteca
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <button className="border rounded px-3 py-2" onClick={save} disabled={saving || !patient}>
          Guardar plan
        </button>
      </div>
    </section>
  );
}
