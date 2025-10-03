"use client";

import { useState } from "react";
import AccentHeader from "@/components/ui/AccentHeader";
import ColorEmoji from "@/components/ColorEmoji";
import ReportFlow from "@/components/bank/ReportFlow";
import ReportPL from "@/components/bank/ReportPL";
import ScheduleForm from "@/components/reports/ScheduleForm";
import { useBankActiveOrg } from "@/hooks/useBankActiveOrg";
import OrgInspector from "@/components/shared/OrgInspector";

function iso(d: Date) {
  return d.toISOString().slice(0, 10);
}

export default function BankReportsPage() {
  const { orgId, isLoading } = useBankActiveOrg();
  const [to, setTo] = useState(iso(new Date()));
  const [from, setFrom] = useState(iso(new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)));

  if (isLoading) {
    return (
      <main className="p-6 md:p-10">
        <div className="glass-card p-6 max-w-md space-y-2">
          <div className="h-6 w-48 rounded bg-white/50" />
          <div className="h-4 w-64 rounded bg-white/40" />
          <div className="h-4 w-40 rounded bg-white/40" />
        </div>
      </main>
    );
  }

  if (!orgId) {
    return (
      <main className="p-6 md:p-10 space-y-8">
        <AccentHeader
          title="Reportes de Banco"
          subtitle="Flujo mensual y P&L por categoría. Programa envíos recurrentes."
          emojiToken="reportes"
        />
        <OrgInspector ctaHref="/organizaciones" />
      </main>
    );
  }

  return (
    <main className="p-6 md:p-10 space-y-8">
      <AccentHeader
        title="Reportes de Banco"
        subtitle="Flujo mensual y P&L por categoría. Programa envíos recurrentes."
        emojiToken="reportes"
      />

      <section className="glass-card p-6 space-y-4">
        <div className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="block text-sm mb-1">Desde</label>
            <input
              type="date"
              className="glass-input"
              value={from}
              onChange={(e: any) => setFrom(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm mb-1">Hasta</label>
            <input
              type="date"
              className="glass-input"
              value={to}
              onChange={(e: any) => setTo(e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="rounded-2xl border border-white/60 bg-white/70 p-4">
            <h3 className="font-semibold inline-flex items-center gap-2">
              <ColorEmoji token="grafica" /> Flujo mensual
            </h3>
            <ReportFlow orgId={orgId} from={from} to={to} />
          </div>
          <div className="rounded-2xl border border-white/60 bg-white/70 p-4">
            <h3 className="font-semibold inline-flex items-center gap-2">
              <ColorEmoji token="tabla" /> P&amp;L por categoría
            </h3>
            <ReportPL orgId={orgId} from={from} to={to} />
          </div>
        </div>
      </section>

      <section className="glass-card p-6 space-y-4">
        <h3 className="font-semibold inline-flex items-center gap-2">
          <ColorEmoji token="recordatorios" /> Programar envío de reportes
        </h3>
        <ScheduleForm orgId={orgId} defaultFrom={from} defaultTo={to} />
      </section>
    </main>
  );
}
