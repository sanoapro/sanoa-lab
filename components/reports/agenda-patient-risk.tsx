"use client";

import { useEffect, useMemo, useState } from "react";
import { isE164, normalizeE164 } from "@/lib/templates";
import { buildCalLink } from "@/lib/integrations/cal";

type Row = {
  patient_key: string;
  patient_name: string;
  total: number;
  no_show: number;
  completed: number;
  cancelled: number;
  ns_rate: number;
  ns_streak: number;
  days_since_attended: number | null;
  risk_score: number;
  risk_band: "low" | "med" | "high";
};

type Pred = {
  patient_key: string;
  patient_name: string;
  current_rate: number;
  trend_30d: number;
  predicted_score: number;
  predicted_band: "low" | "med" | "high";
};

function iso(d: Date) {
  return d.toISOString().slice(0, 10);
}
function cls(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

export default function AgendaPatientRisk({ orgId }: { orgId: string }) {
  const today = useMemo(() => new Date(), []);
  const first = useMemo(() => {
    const d = new Date(today);
    d.setMonth(d.getMonth() - 1);
    d.setDate(1);
    return d;
  }, [today]);

  const [from, setFrom] = useState(iso(first));
  const [to, setTo] = useState(iso(today));
  const [tz, setTz] = useState("America/Mexico_City");
  const [minN, setMinN] = useState(3);
  const [top, setTop] = useState(50);
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);

  // selección
  const [sel, setSel] = useState<Record<string, boolean>>({});
  const selectedKeys = Object.keys(sel).filter((k: any) => sel[k]);

  // predicción
  const [showPred, setShowPred] = useState(false);
  const [predLoading, setPredLoading] = useState(false);
  const [preds, setPreds] = useState<Record<string, Pred>>({});

  // vistas guardadas
  const scope = "risk_patients";
  const [views, setViews] = useState<{ id: string; name: string; filters: any }[]>([]);
  const [viewName, setViewName] = useState("");

  async function load() {
    setLoading(true);
    const p = new URLSearchParams({
      org_id: orgId,
      from,
      to,
      tz,
      min_n: String(minN),
      top: String(top),
    });
    const r = await fetch(`/api/reports/agenda/risk/patients/json?${p.toString()}`);
    const j = await r.json();
    const arr: Row[] = j?.ok ? j.data : [];
    setRows(arr);
    // limpia selección
    setSel({});
    setLoading(false);
  }

  async function loadViews() {
    const p = new URLSearchParams({ org_id: orgId, scope });
    const r = await fetch(`/api/saved-views/list?${p.toString()}`);
    const j = await r.json();
    setViews(j?.ok ? j.data : []);
  }

  useEffect(() => {
    load();
    loadViews();
     
  }, [orgId]);

  function applyView(v: any) {
    const f = v.filters || {};
    if (f.from) setFrom(f.from);
    if (f.to) setTo(f.to);
    if (f.tz) setTz(f.tz);
    if (typeof f.min_n === "number") setMinN(f.min_n);
    if (typeof f.top === "number") setTop(f.top);
  }

  async function saveView() {
    if (!viewName.trim()) {
      alert("Ponle un nombre a la vista");
      return;
    }
    const body = {
      org_id: orgId,
      scope,
      name: viewName.trim(),
      filters: { from, to, tz, min_n: minN, top },
    };
    const r = await fetch("/api/saved-views/upsert", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    const j = await r.json();
    if (!j.ok) alert(j.error?.message ?? "No se pudo guardar");
    else loadViews();
  }

  async function sendReminder(phone: string, name: string) {
    const norm = normalizeE164(phone);
    if (!isE164(norm)) {
      alert("Teléfono inválido (usa formato E.164: +52...)");
      return;
    }
    const body = {
      org_id: orgId,
      item: {
        channel: "whatsapp",
        target: norm,
        template: "recordatorio_riesgo",
        schedule_at: new Date().toISOString(),
        meta: {
          message: `Hola ${name}, te esperamos en tu próxima cita. Si necesitas reagendar, contesta este mensaje.`,
        },
      },
    };
    const r = await fetch("/api/reminders/schedule", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    const j = await r.json();
    if (!j.ok) alert(j.error?.message ?? "No se pudo enviar");
  }

  async function sendBulk() {
    if (selectedKeys.length === 0) return;
    const items: Array<{ target: string }> = [];
    for (const key of selectedKeys) {
      const el = document.getElementById(`tel-${key}`) as HTMLInputElement | null;
      const phone = el?.value ?? "";
      const norm = normalizeE164(phone);
      if (isE164(norm)) items.push({ target: norm });
    }
    if (items.length === 0) {
      alert("Ninguno de los seleccionados tiene teléfono válido (+E.164).");
      return;
    }
    const r = await fetch("/api/reminders/schedule/bulk", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ org_id: orgId, items }),
    });
    const j = await r.json();
    if (!j.ok) alert(j.error?.message ?? "Fallo el envío masivo");
    else alert(`Enviados ${j.data.sent}/${j.data.total}`);
  }

  async function togglePred() {
    const next = !showPred;
    setShowPred(next);
    if (next) {
      setPredLoading(true);
      const p = new URLSearchParams({
        org_id: orgId,
        days: "90",
        tz,
        min_n: String(minN),
        top: String(top),
      });
      const r = await fetch(`/api/reports/agenda/risk/patients/predict/json?${p.toString()}`);
      const j = await r.json();
      const map: Record<string, Pred> = {};
      if (j?.ok) for (const x of j.data as Pred[]) map[x.patient_key] = x;
      setPreds(map);
      setPredLoading(false);
    }
  }

  const base = typeof window !== "undefined" ? window.location.origin : "";

  // UI
  return (
    <section className="rounded-2xl border p-4 space-y-4">
      {/* Filtros */}
      <div className="grid grid-cols-1 md:grid-cols-7 gap-3 items-end">
        <div>
          <label className="block text-sm mb-1">Desde</label>
          <input
            type="date"
            className="rounded border px-3 py-2 w-full"
            value={from}
            onChange={(e: any) => setFrom(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm mb-1">Hasta</label>
          <input
            type="date"
            className="rounded border px-3 py-2 w-full"
            value={to}
            onChange={(e: any) => setTo(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm mb-1">TZ</label>
          <input
            className="rounded border px-3 py-2 w-full"
            value={tz}
            onChange={(e: any) => setTz(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm mb-1">Mín citas</label>
          <input
            type="number"
            min={1}
            className="rounded border px-3 py-2 w-full"
            value={minN}
            onChange={(e: any) => setMinN(Math.max(1, parseInt(e.target.value || "1", 10)))}
          />
        </div>
        <div>
          <label className="block text-sm mb-1">Top N</label>
          <input
            type="number"
            min={1}
            className="rounded border px-3 py-2 w-full"
            value={top}
            onChange={(e: any) => setTop(Math.max(1, parseInt(e.target.value || "1", 10)))}
          />
        </div>
        <div className="flex gap-2">
          <button className="rounded px-4 py-2 border w-full" onClick={load}>
            Aplicar
          </button>
          <a
            href={`${base}/api/export/agenda/risk/patients/xlsx?org_id=${orgId}&from=${from}&to=${to}&tz=${encodeURIComponent(tz)}&min_n=${minN}&top=${top}`}
            className="rounded px-4 py-2 border w-full text-center"
          >
            XLSX
          </a>
        </div>
        <div className="flex gap-2">
          <select
            className="rounded border px-3 py-2 w-full"
            onChange={(e: any) => {
              const v = views.find((x: any) => x.id === e.target.value);
              if (v) applyView(v);
            }}
          >
            <option value="">Vistas guardadas…</option>
            {views.map((v: any) => (
              <option key={v.id} value={v.id}>
                {v.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Guardar vista & predicción */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
        <div className="md:col-span-3">
          <label className="block text-sm mb-1">Nombre de la vista</label>
          <input
            className="rounded border px-3 py-2 w-full"
            value={viewName}
            onChange={(e: any) => setViewName(e.target.value)}
            placeholder="Ej. Últimos 90 días, Top 100"
          />
        </div>
        <div>
          <button className="rounded px-4 py-2 border w-full" onClick={saveView}>
            Guardar vista
          </button>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm">
            <input type="checkbox" className="mr-2" checked={showPred} onChange={togglePred} />{" "}
            Mostrar predicción
          </label>
          {predLoading && <span className="text-xs text-slate-500">Calculando…</span>}
        </div>
      </div>

      {/* Barra de acciones masivas */}
      <div
        className={cls(
          "flex items-center gap-3 border rounded-xl px-3 py-2",
          selectedKeys.length ? "opacity-100" : "opacity-50 pointer-events-none",
        )}
        aria-live="polite"
      >
        <span className="text-sm">Seleccionados: {selectedKeys.length}</span>
        <button className="rounded px-3 py-1 border" onClick={sendBulk}>
          Enviar recordatorio (WA)
        </button>
      </div>

      {/* Tabla */}
      <div className="rounded-2xl border overflow-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <Th>
                <input
                  aria-label="Seleccionar todos"
                  type="checkbox"
                  checked={rows.length > 0 && selectedKeys.length === rows.length}
                  onChange={(e: any) => {
                    const v = e.target.checked;
                    const n: Record<string, boolean> = {};
                    if (v) for (const r of rows) n[r.patient_key] = true;
                    setSel(n);
                  }}
                />
              </Th>
              <Th>Riesgo</Th>
              <Th>Paciente</Th>
              <Th>Citas</Th>
              <Th>No-show</Th>
              <Th>Tasa</Th>
              <Th>Racha NS</Th>
              <Th>Días desde atendida</Th>
              {showPred && <Th>Tendencia 30d</Th>}
              {showPred && <Th>Predicho</Th>}
              <Th>Acciones</Th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={11} className="px-3 py-6 text-center">
                  Procesando…
                </td>
              </tr>
            )}
            {!loading && rows.length === 0 && (
              <tr>
                <td colSpan={11} className="px-3 py-6 text-center">
                  Sin resultados para el rango seleccionado.
                </td>
              </tr>
            )}
            {rows.map((r: any) => {
              const p = preds[r.patient_key];
              const cal = buildCalLink({ name: r.patient_name, notes: "Reagendado desde Sanoa" });
              return (
                <tr key={r.patient_key} className="border-t hover:bg-gray-50">
                  <Td>
                    <input
                      aria-label={`Seleccionar ${r.patient_name}`}
                      type="checkbox"
                      checked={!!sel[r.patient_key]}
                      onChange={(e: any) => setSel((s: any) => ({ ...s, [r.patient_key]: e.target.checked }))}
                    />
                  </Td>
                  <td className="px-3 py-2">
                    <span
                      className={cls(
                        "inline-flex items-center gap-2 px-2 py-1 rounded-full text-xs",
                        r.risk_band === "high"
                          ? "bg-rose-100 text-rose-800"
                          : r.risk_band === "med"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-emerald-100 text-emerald-800",
                      )}
                      aria-label={`Riesgo ${r.risk_band}`}
                    >
                      ● {Math.round(r.risk_score * 100)}%
                    </span>
                  </td>
                  <td className="px-3 py-2">{r.patient_name}</td>
                  <Td>{r.total}</Td>
                  <Td>{r.no_show}</Td>
                  <Td>{Math.round(r.ns_rate * 100)}%</Td>
                  <Td>{r.ns_streak}</Td>
                  <Td>{r.days_since_attended ?? "—"}</Td>
                  {showPred && (
                    <Td>
                      {p ? (
                        <span
                          className={cls(
                            p.trend_30d > 0
                              ? "text-rose-700"
                              : p.trend_30d < 0
                                ? "text-emerald-700"
                                : "text-slate-700",
                          )}
                        >
                          {Math.round((p.trend_30d || 0) * 100)}%
                        </span>
                      ) : (
                        "—"
                      )}
                    </Td>
                  )}
                  {showPred && (
                    <Td>
                      {p ? (
                        <span
                          className={cls(
                            "inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs",
                            p.predicted_band === "high"
                              ? "bg-rose-100 text-rose-800"
                              : p.predicted_band === "med"
                                ? "bg-amber-100 text-amber-800"
                                : "bg-emerald-100 text-emerald-800",
                          )}
                        >
                          ● {Math.round(p.predicted_score * 100)}%
                        </span>
                      ) : (
                        "—"
                      )}
                    </Td>
                  )}
                  <td className="px-3 py-2">
                    <div className="flex flex-wrap gap-2 items-center">
                      <input
                        aria-label="Teléfono para recordatorio"
                        placeholder="+52..."
                        className="rounded border px-2 py-1 w-36"
                        id={`tel-${r.patient_key}`}
                        onKeyDown={(e: any) => {
                          if (e.key === "Enter") {
                            const val = (e.target as HTMLInputElement).value;
                            sendReminder(val, r.patient_name);
                          }
                        }}
                      />
                      <button
                        className="rounded px-3 py-1 border"
                        onClick={() => {
                          const val =
                            (document.getElementById(`tel-${r.patient_key}`) as HTMLInputElement)
                              ?.value || "";
                          sendReminder(val, r.patient_name);
                        }}
                      >
                        Recordar WA
                      </button>
                      <a
                        className="rounded px-3 py-1 border"
                        href={cal}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Reagendar (Cal.com)
                      </a>
                      <a
                        className="rounded px-3 py-1 border"
                        href={`/pacientes?q=${encodeURIComponent(r.patient_name)}`}
                      >
                        Ver paciente
                      </a>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-slate-500">
        Nota: el score y la predicción son heurísticos (tasa, racha y tendencia). Úsalos como apoyo
        para prevención, no como diagnóstico.
      </p>
    </section>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="text-left px-3 py-2">{children}</th>;
}
function Td({ children }: { children: React.ReactNode }) {
  return <td className="px-3 py-2">{children}</td>;
}
