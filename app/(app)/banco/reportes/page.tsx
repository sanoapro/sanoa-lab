"use client";

import { useMemo, useState } from "react";
import AccentHeader from "@/components/ui/AccentHeader";
import ColorEmoji from "@/components/ColorEmoji";
import { getActiveOrg } from "@/lib/org-local";
import ReportFlow from "@/components/bank/ReportFlow";
import ReportPL from "@/components/bank/ReportPL";
import ScheduleForm from "@/components/reports/ScheduleForm";

function iso(d: Date) { return d.toISOString().slice(0, 10); }

export default function BankReportsPage() {
  const org = useMemo(() => getActiveOrg(), []);
  const orgId = org?.id || "";

  const [to, setTo] = useState(iso(new Date()));
  const [from, setFrom] = useState(iso(new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)));

  return (
    <main className="p-6 md:p-10 space-y-8">
      <AccentHeader
        title="Reportes de Banco"
        subtitle="Flujo mensual y P&L por categoría. Programa envíos recurrentes."
        emojiToken="reportes"
      />

      {!orgId && (
        <p className="text-amber-700 bg-amber-50 border border-amber-200 rounded p-3">
          Selecciona una organización activa para continuar.
        </p>
      )}

      {orgId && (
        <>
          <section className="rounded-3xl bg-white/95 border p-6 space-y-4">
            <div className="flex flex-wrap gap-3 items-end">
              <div>
                <label className="block text-sm mb-1">Desde</label>
                <input type="date" className="rounded border px-3 py-2" value={from} onChange={(e) => setFrom(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm mb-1">Hasta</label>
                <input type="date" className="rounded border px-3 py-2" value={to} onChange={(e) => setTo(e.target.value)} />
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="rounded-2xl border p-4">
                <h3 className="font-semibold inline-flex items-center gap-2">
                  <ColorEmoji token="grafica" /> Flujo mensual
                </h3>
                <ReportFlow orgId={orgId} from={from} to={to} />
              </div>
              <div className="rounded-2xl border p-4">
                <h3 className="font-semibold inline-flex items-center gap-2">
                  <ColorEmoji token="tabla" /> P&amp;L por categoría
                </h3>
                <ReportPL orgId={orgId} from={from} to={to} />
              </div>
            </div>
          </section>

          <section className="rounded-3xl bg-white/95 border p-6 space-y-4">
            <h3 className="font-semibold inline-flex items-center gap-2">
              <ColorEmoji token="recordatorios" /> Programar envío de reportes
            </h3>
            <ScheduleForm orgId={orgId} defaultFrom={from} defaultTo={to} />
          </section>
        </>
      )}
    </main>
  );
}
