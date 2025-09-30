// app/(app)/consultorio/page.tsx
"use client";

import * as React from "react";
import Link from "next/link";
import AccentHeader from "@/components/ui/AccentHeader";
import ColorEmoji from "@/components/ColorEmoji";
import PatientAutocomplete from "@/components/patients/PatientAutocomplete";
import { getActiveOrg } from "@/lib/org-local";

type MiniOverview = {
  nextAppointments: number;
  activePatients: number;
  monthIncomeMXN: number;
};

export default function ConsultorioPage() {
  const org = getActiveOrg();
  const [mini, setMini] = React.useState<MiniOverview | null>(null);

  React.useEffect(() => {
    (async () => {
      // Best-effort: si falla, dejamos los números en null
      try {
        const r = await fetch("/api/reports/overview", { cache: "no-store" });
        const j = await r.json();
        if (j?.ok) {
          setMini({
            nextAppointments: j.data?.nextAppointments ?? 0,
            activePatients: j.data?.activePatients ?? 0,
            monthIncomeMXN: j.data?.monthIncomeMXN ?? 0,
          });
        }
      } catch {
        /* noop */
      }
    })();
  }, []);

  return (
    <main className="p-6 md:p-10 space-y-8">
      <AccentHeader
        title="Mi Consultorio"
        subtitle="Tu centro operativo: agenda, pacientes, recetas, laboratorio, recordatorios."
        emojiToken="tablero"
      />

      {/* Buscador rápido de pacientes */}
      <section className="rounded-3xl bg-white/95 border p-6">
        <h3 className="font-semibold">Buscar paciente</h3>
        <div className="mt-3 max-w-xl">
          <PatientAutocomplete
            orgId={org.id ?? ""}
            scope="org"
            placeholder="Escribe nombre del paciente…"
            onSelect={(hit) => {
              if (hit) window.location.href = `/pacientes/${hit.id}`;
            }}
          />
        </div>
        <p className="text-xs text-slate-500 mt-2">Solo aparecen pacientes de tu organización (RLS).</p>
      </section>

      {/* Tarjetas operativas */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <CardLink href="/agenda" token="agenda" title="Agenda" desc="Citas, disponibilidad y confirmaciones." />
        <CardLink href="/pacientes" token="pacientes" title="Pacientes" desc="Listado, filtros, etiquetas y timeline." />
        <CardLink href="/prescriptions/templates" token="recetas" title="Recetas" desc="Plantillas y emisión con membrete." />
        <CardLink href="/laboratorio" token="laboratorio" title="Laboratorio" desc="Órdenes y resultados con firma." />
        <CardLink href="/recordatorios" token="recordatorios" title="Recordatorios" desc="Mensajes SMS/WhatsApp programados." />
        <CardLink href="/reportes" token="reportes" title="Reportes" desc="Indicadores operativos y clínicos." />
      </section>

      {/* Mini-métricas */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Stat title="Próximas citas (7 días)" value={mini?.nextAppointments ?? "—"} />
        <Stat title="Pacientes activos" value={mini?.activePatients ?? "—"} />
        <Stat title="Ingresos del mes" value={
          typeof mini?.monthIncomeMXN === "number"
            ? mini!.monthIncomeMXN.toLocaleString("es-MX", { style: "currency", currency: "MXN" })
            : "—"
        } />
      </section>
    </main>
  );
}

function CardLink({ href, token, title, desc }:{
  href: string; token: string; title: string; desc: string;
}) {
  return (
    <Link href={href} className="group rounded-3xl border bg-white/95 p-6 hover:shadow transition block">
      <div className="flex gap-3">
        <div className="h-12 w-12 rounded-2xl border inline-grid place-content-center">
          <ColorEmoji token={token} />
        </div>
        <div>
          <h3 className="font-semibold">{title}</h3>
          <p className="text-sm text-slate-600">{desc}</p>
        </div>
      </div>
      <div className="mt-4 text-sm text-blue-600">Abrir →</div>
    </Link>
  );
}

function Stat({ title, value }:{ title: string; value: number | string }) {
  return (
    <div className="rounded-3xl border bg-white/95 p-6">
      <p className="text-sm text-slate-600">{title}</p>
      <p className="mt-2 text-3xl tracking-tight">{value}</p>
    </div>
  );
}
