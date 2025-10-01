"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  metricsPatientsByTag,
  metricsNewPatientsByMonth,
  metricsNotesByMonth,
  type TagMetric,
  type MonthMetric,
} from "@/lib/metrics";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { getActiveOrg } from "@/lib/org-local";
import { showToast } from "@/components/Toaster";

/* ====== UI ====== */
function Bar({ value, max }: { value: number; max: number }) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div className="h-2 w-full rounded bg-gray-100">
      <div className="h-2 rounded" style={{ width: `${pct}%`, background: "#D97A66" }} />
    </div>
  );
}

/* ====== Página ====== */
export default function MetricsPage() {
  const org = (getActiveOrg() as { id?: string } | null) ?? null;
  const orgId = org?.id ?? "";

  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [onlyOrg, setOnlyOrg] = useState(true);

  const [byTag, setByTag] = useState<TagMetric[]>([]);
  const [ptByMonth, setPtByMonth] = useState<MonthMetric[]>([]);
  const [notesByMonth, setNotesByMonth] = useState<MonthMetric[]>([]);
  const [loading, setLoading] = useState(false);

  const monthFmt = useMemo(
    () =>
      new Intl.DateTimeFormat("es-MX", {
        month: "short",
        year: "2-digit",
        timeZone: "America/Mexico_City",
      }),
    []
  );

  const qs = useCallback((obj: Record<string, unknown>) => {
    const p = new URLSearchParams();
    Object.entries(obj).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== "") p.set(k, String(v));
    });
    return p.toString();
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [t, p, n] = await Promise.all([
        metricsPatientsByTag(from || undefined, to || undefined, onlyOrg),
        metricsNewPatientsByMonth(12, onlyOrg),
        metricsNotesByMonth(12, onlyOrg),
      ]);
      setByTag(t ?? []);
      setPtByMonth(p ?? []);
      setNotesByMonth(n ?? []);
    } catch (e: any) {
      showToast({
        title: "Error cargando métricas",
        description: e?.message ?? String(e),
        variant: "destructive",
      });
      setByTag([]);
      setPtByMonth([]);
      setNotesByMonth([]);
    } finally {
      setLoading(false);
    }
  }, [from, to, onlyOrg]);

  useEffect(() => {
    void load();
  }, [load]);

  const maxTag = useMemo(
    () => Math.max(0, ...byTag.map((x) => Number(x.total ?? 0))),
    [byTag]
  );

  const exportByTagUrl = useMemo(() => {
    const url = `/api/export/metrics/by-tag?${qs({
      from,
      to,
      onlyOrg,
      org: onlyOrg ? orgId : undefined,
    })}`;
    return url;
  }, [from, to, onlyOrg, orgId, qs]);

  const exportPatientsMonthlyUrl = useMemo(() => {
    const url = `/api/export/metrics/monthly?${qs({
      type: "patients",
      months: 12,
      onlyOrg,
      org: onlyOrg ? orgId : undefined,
    })}`;
    return url;
  }, [onlyOrg, orgId, qs]);

  const exportNotesMonthlyUrl = useMemo(() => {
    const url = `/api/export/metrics/monthly?${qs({
      type: "notes",
      months: 12,
      onlyOrg,
      org: onlyOrg ? orgId : undefined,
    })}`;
    return url;
  }, [onlyOrg, orgId, qs]);

  const exportDisabled = onlyOrg && !orgId;

  return (
    <div className="max-w-5xl mx-auto p-4 space-y-6">
      <h1 className="text-2xl font-semibold">Métricas</h1>

      <div className="border rounded-xl p-4 bg-white grid grid-cols-1 sm:grid-cols-6 gap-3">
        <div className="sm:col-span-2">
          <span className="block text-sm text-gray-600">Desde</span>
          <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        </div>
        <div className="sm:col-span-2">
          <span className="block text-sm text-gray-600">Hasta</span>
          <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
        <label className="text-sm flex items-center gap-2 justify-center">
          <input
            type="checkbox"
            checked={onlyOrg}
            onChange={(e) => setOnlyOrg(e.target.checked)}
          />
          Sólo org activa
        </label>
        <div className="flex gap-2 items-end">
          <Button onClick={() => void load()} disabled={loading} aria-busy={loading}>
            {loading ? "Actualizando…" : "Actualizar"}
          </Button>
        </div>
      </div>

      {/* Pacientes por etiqueta */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Pacientes por etiqueta</h2>
          <a
            href={exportDisabled ? undefined : exportByTagUrl}
            onClick={(e) => {
              if (exportDisabled) {
                e.preventDefault();
                showToast({ title: "Selecciona una organización activa" });
              }
            }}
            aria-disabled={exportDisabled}
          >
            <Button variant="secondary" disabled={exportDisabled}>
              Exportar CSV
            </Button>
          </a>
        </div>
        <div className="border rounded-xl divide-y bg-white">
          {byTag.length === 0 && (
            <div className="p-4 text-sm text-gray-600">
              {loading ? "Cargando…" : "Sin datos."}
            </div>
          )}
          {byTag.map((row) => (
            <div key={row.tag_id} className="p-3">
              <div className="flex items-center justify-between">
                <div className="font-medium">{row.tag_name ?? "(sin nombre)"}</div>
                <div className="text-sm text-gray-600">{Number(row.total ?? 0)}</div>
              </div>
              <Bar value={Number(row.total ?? 0)} max={maxTag} />
            </div>
          ))}
        </div>
      </section>

      {/* Pacientes nuevos por mes */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Pacientes nuevos por mes (12m)</h2>
          <a
            href={exportDisabled ? undefined : exportPatientsMonthlyUrl}
            onClick={(e) => {
              if (exportDisabled) {
                e.preventDefault();
                showToast({ title: "Selecciona una organización activa" });
              }
            }}
            aria-disabled={exportDisabled}
          >
            <Button variant="secondary" disabled={exportDisabled}>
              Exportar CSV
            </Button>
          </a>
        </div>
        <div className="border rounded-xl p-4 bg-white grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
          {ptByMonth.length === 0 && (
            <div className="col-span-full text-sm text-gray-600">
              {loading ? "Cargando…" : "Sin datos."}
            </div>
          )}
          {ptByMonth.map((m) => (
            <div key={m.month_start} className="text-center">
              <div className="text-xs text-gray-600">
                {monthFmt.format(new Date(m.month_start))}
              </div>
              <div className="text-lg font-semibold">{Number(m.total ?? 0)}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Notas por mes */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Notas creadas por mes (12m)</h2>
          <a
            href={exportDisabled ? undefined : exportNotesMonthlyUrl}
            onClick={(e) => {
              if (exportDisabled) {
                e.preventDefault();
                showToast({ title: "Selecciona una organización activa" });
              }
            }}
            aria-disabled={exportDisabled}
          >
            <Button variant="secondary" disabled={exportDisabled}>
              Exportar CSV
            </Button>
          </a>
        </div>
        <div className="border rounded-xl p-4 bg-white grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
          {notesByMonth.length === 0 && (
            <div className="col-span-full text-sm text-gray-600">
              {loading ? "Cargando…" : "Sin datos."}
            </div>
          )}
          {notesByMonth.map((m) => (
            <div key={m.month_start} className="text-center">
              <div className="text-xs text-gray-600">
                {monthFmt.format(new Date(m.month_start))}
              </div>
              <div className="text-lg font-semibold">{Number(m.total ?? 0)}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
