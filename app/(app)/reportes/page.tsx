// /app/(app)/reportes/page.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { getActiveOrg } from "@/lib/org-local";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type KV = { metric: string; value: number };
type Pt = { month_start: string; total: number };
type SeriesResp = { patients: Pt[]; notes: Pt[]; files: Pt[] };

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function Bar({ value, max }: { value: number; max: number }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="h-2 w-full bg-gray-100 dark:bg-white/10 rounded">
      <div
        className="h-2 rounded"
        style={{ width: `${pct}%`, background: "#D97A66" }}
        aria-label={`valor ${value} de ${max}`}
      />
    </div>
  );
}

export default function ReportsPage() {
  const org = getActiveOrg();
  const [overview, setOverview] = useState<KV[]>([]);
  const [series, setSeries] = useState<SeriesResp>({ patients: [], notes: [], files: [] });
  const [months, setMonths] = useState<number>(12);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // Mantiene una referencia a la petición en curso para poder cancelarla
  const abortRef = useRef<AbortController | null>(null);

  async function load() {
    if (!org.id) return;
    const safeMonths = clamp(Number.isFinite(months) ? months : 12, 1, 36);
    if (safeMonths !== months) setMonths(safeMonths);

    setLoading(true);
    setErr(null);

    // Cancela cualquier petición previa
    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;

    try {
      const qsOverview = new URLSearchParams({ org: String(org.id) });
      const qsSeries = new URLSearchParams({ org: String(org.id), months: String(safeMonths) });

      const [ovRes, seRes] = await Promise.all([
        fetch(`/api/reports/overview?${qsOverview.toString()}`, {
          cache: "no-store",
          signal: ac.signal,
        }),
        fetch(`/api/reports/series?${qsSeries.toString()}`, {
          cache: "no-store",
          signal: ac.signal,
        }),
      ]);

      if (!ovRes.ok) throw new Error(`overview ${ovRes.status}`);
      if (!seRes.ok) throw new Error(`series ${seRes.status}`);

      const ovJson = (await ovRes.json()) as { metrics?: KV[] };
      const seJson = (await seRes.json()) as SeriesResp;

      setOverview(Array.isArray(ovJson.metrics) ? ovJson.metrics : []);
      setSeries({
        patients: Array.isArray(seJson.patients) ? seJson.patients : [],
        notes: Array.isArray(seJson.notes) ? seJson.notes : [],
        files: Array.isArray(seJson.files) ? seJson.files : [],
      });
    } catch (e: unknown) {
      if ((e as any)?.name === "AbortError") return; // petición cancelada: ignorar
      const msg =
        (e as any)?.message ||
        (typeof e === "string" ? e : "Error al cargar los reportes");
      setErr(msg);
      // Mantén últimos datos válidos; sólo mostramos el error arriba
      // console.error(e);
    } finally {
      if (abortRef.current === ac) abortRef.current = null;
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [org.id, months]);

  const maxPts = useMemo(
    () => Math.max(0, ...series.patients.map((x) => Number(x.total) || 0)),
    [series],
  );
  const maxNotes = useMemo(
    () => Math.max(0, ...series.notes.map((x) => Number(x.total) || 0)),
    [series],
  );
  const maxFiles = useMemo(
    () => Math.max(0, ...series.files.map((x) => Number(x.total) || 0)),
    [series],
  );

  const kv = (k: string) => overview.find((x) => x.metric === k)?.value ?? 0;
  const fmt = (m: string) =>
    new Date(m).toLocaleDateString(undefined, { month: "short", year: "2-digit" });

  return (
    <div className="max-w-5xl mx-auto p-4 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">Reportes</h1>
        <div className="flex items-center gap-3">
          <label className="text-sm text-slate-600 dark:text-slate-200">
            Meses
            <Input
              className="ml-2 w-20 inline-block"
              type="number"
              inputMode="numeric"
              min={1}
              max={36}
              value={months}
              onChange={(e) => {
                const n = Number(e.target.value);
                setMonths(Number.isFinite(n) ? n : 12);
              }}
            />
          </label>
          <Button variant="secondary" onClick={() => void load()} disabled={loading}>
            {loading ? "Actualizando…" : "Actualizar"}
          </Button>
        </div>
      </div>

      {err && (
        <div className="p-3 rounded-lg border border-red-200 bg-red-50 text-sm text-red-700">
          {err === "Error al cargar los reportes"
            ? err
            : `Ocurrió un error: ${err}. Intenta nuevamente.`}
        </div>
      )}

      <section className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <Card title="Pacientes totales" value={kv("patients_total")} loading={loading} />
        <Card title="Notas (30d)" value={kv("notes_30d")} loading={loading} />
        <Card title="Archivos (30d)" value={kv("files_30d")} loading={loading} />
        <Card title="Tareas abiertas" value={kv("work_open")} loading={loading} />
      </section>

      <Series title={`Pacientes nuevos (últimos ${months}m)`} rows={series.patients} max={maxPts} fmt={fmt} loading={loading} />
      <Series title={`Notas creadas (últimos ${months}m)`} rows={series.notes} max={maxNotes} fmt={fmt} loading={loading} />
      <Series title={`Archivos subidos (últimos ${months}m)`} rows={series.files} max={maxFiles} fmt={fmt} loading={loading} />

      <Cohorts />
    </div>
  );
}

function Card({ title, value, loading }: { title: string; value: number; loading?: boolean }) {
  return (
    <div className="p-4 glass rounded-xl">
      <div className="text-sm text-slate-600 dark:text-slate-200">{title}</div>
      <div className="text-2xl font-semibold text-slate-900 dark:text-white">
        {loading ? "…" : Number(value).toLocaleString()}
      </div>
    </div>
  );
}

function Series({
  title,
  rows,
  max,
  fmt,
  loading,
}: {
  title: string;
  rows: Pt[];
  max: number;
  fmt: (s: string) => string;
  loading?: boolean;
}) {
  return (
    <section className="space-y-2">
      <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{title}</h2>
      <div className="glass rounded-xl divide-y divide-black/5 dark:divide-white/10">
        {loading && rows.length === 0 && (
          <div className="p-4 text-sm text-slate-600 dark:text-slate-300">Cargando…</div>
        )}
        {rows.map((p) => (
          <div key={p.month_start} className="p-3">
            <div className="flex items-center justify-between">
              <div className="text-sm text-slate-600 dark:text-slate-300">{fmt(p.month_start)}</div>
              <div className="text-sm text-slate-900 dark:text-white">{p.total}</div>
            </div>
            <Bar value={p.total} max={max} />
          </div>
        ))}
        {!loading && rows.length === 0 && (
          <div className="p-4 text-sm text-slate-600 dark:text-slate-300">Sin datos.</div>
        )}
      </div>
    </section>
  );
}

function Cohorts() {
  const org = getActiveOrg();
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      if (!org.id) return;
      setLoading(true);
      setErr(null);
      try {
        const qs = new URLSearchParams({ org: String(org.id) });
        const res = await fetch(`/api/reports/cohorts?${qs.toString()}`, { cache: "no-store" });
        if (!res.ok) throw new Error(`cohorts ${res.status}`);
        const j = await res.json();
        setRows(j.cohorts || []);
      } catch (e: unknown) {
        const msg = (e as any)?.message || "Error al cargar cohortes";
        setErr(msg);
      } finally {
        setLoading(false);
      }
    })();
  }, [org.id]);

  return (
    <section className="space-y-2">
      <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
        Cohortes (retención por mes de alta)
      </h2>
      <div className="glass rounded-xl overflow-auto">
        <table className="min-w-[640px] w-full text-sm">
          <thead className="bg-black/5 dark:bg-white/10">
            <tr>
              <th className="text-left p-2">Cohorte</th>
              <th className="text-right p-2">Usuarios</th>
              <th className="text-right p-2">Retorno 30d</th>
              <th className="text-right p-2">Retorno 90d</th>
              <th className="text-right p-2">Retorno 180d</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r: any) => (
              <tr key={r.cohort_month} className="border-t border-black/5 dark:border-white/10">
                <td className="p-2">
                  {new Date(r.cohort_month).toLocaleDateString(undefined, {
                    month: "short",
                    year: "numeric",
                  })}
                </td>
                <td className="p-2 text-right">{r.users}</td>
                <td className="p-2 text-right">{r.returned_30}</td>
                <td className="p-2 text-right">{r.returned_90}</td>
                <td className="p-2 text-right">{r.returned_180}</td>
              </tr>
            ))}
            {loading && (
              <tr>
                <td colSpan={5} className="p-3 text-slate-600 dark:text-slate-300">
                  Cargando…
                </td>
              </tr>
            )}
            {!loading && rows.length === 0 && (
              <tr>
                <td colSpan={5} className="p-3 text-slate-600 dark:text-slate-300">
                  Sin datos.
                </td>
              </tr>
            )}
            {err && (
              <tr>
                <td colSpan={5} className="p-3 text-red-700 bg-red-50 border-t border-red-100">
                  {err}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
