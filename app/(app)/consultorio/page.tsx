// app/(app)/consultorio/page.tsx
"use client";

import * as React from "react";
import Link from "next/link";
import AccentHeader from "@/components/ui/AccentHeader";
import ColorEmoji from "@/components/ColorEmoji";
import PatientAutocomplete from "@/components/patients/PatientAutocomplete";
import AnimateIn from "@/components/ui/AnimateIn";
import QuickMetrics from "@/components/dashboard/QuickMetrics";
import Tour from "@/components/onboarding/Tour";
import { getActiveOrg } from "@/lib/org-local";

type MiniOverview = {
  nextAppointments: number;
  activePatients: number;
  monthIncomeMXN: number;
};

export default function ConsultorioPage() {
  const org = React.useMemo(() => getActiveOrg(), []);
  const orgId = org?.id ?? "";
  const [mini, setMini] = React.useState<MiniOverview | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [incomeTrend, setIncomeTrend] = React.useState<number[] | null>(null);

  // Resumen rápido (best-effort)
  React.useEffect(() => {
    (async () => {
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
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Serie de ingresos (para sparkline en QuickMetrics)
  React.useEffect(() => {
    (async () => {
      try {
        const r = await fetch("/api/reports/series", { cache: "no-store" });
        const j = await r.json();
        if (j?.ok && Array.isArray(j.data)) {
          const pts: number[] = j.data
            .map((x: any) =>
              typeof x?.value === "number"
                ? x.value
                : typeof x?.total_cents === "number"
                ? x.total_cents / 100
                : typeof x?.amount_cents === "number"
                ? x.amount_cents / 100
                : null
            )
            .filter((n: number | null) => typeof n === "number") as number[];
          if (pts.length >= 2) setIncomeTrend(pts);
        }
      } catch {
        /* noop */
      }
    })();
  }, []);

  return (
    <main className="p-6 md:p-10 space-y-8">
      <AnimateIn>
        <AccentHeader
          title="Mi Consultorio"
          subtitle="Tu centro operativo: agenda, pacientes, recetas, laboratorio, recordatorios."
          emojiToken="tablero"
        />
      </AnimateIn>

      {/* Tour guiado (primera visita) */}
      <Tour
        steps={[
          {
            id: "buscar",
            title: "Búsqueda rápida de pacientes",
            description: "Escribe 3 letras y selecciona para abrir el expediente.",
            selector: "#tour-search",
          },
          {
            id: "accesos",
            title: "Accesos principales",
            description: "Accede a Agenda, Pacientes, Recetas, Laboratorio, Recordatorios y Reportes.",
            selector: "#tour-cards",
          },
          {
            id: "metricas",
            title: "Métricas clave",
            description: "Consulta citas próximas, pacientes activos e ingresos del mes.",
            selector: "#tour-stats",
          },
        ]}
      />

      {/* Buscador rápido de pacientes */}
      <AnimateIn delay={60}>
        <section id="tour-search" className="rounded-3xl bg-white/95 border p-6">
          <h3 className="font-semibold">Buscar paciente</h3>
          <div className="mt-3 max-w-xl">
            {orgId ? (
              <PatientAutocomplete
                orgId={orgId}
                scope="org"
                placeholder="Escribe nombre del paciente…"
                onSelect={(hit) => {
                  if (hit?.id) window.location.href = `/pacientes/${hit.id}`;
                }}
              />
            ) : (
              <input
                className="border rounded px-3 py-2 w-full"
                disabled
                placeholder="Selecciona una organización activa para buscar"
              />
            )}
          </div>
          <p className="text-xs text-slate-500 mt-2">Solo aparecen pacientes de tu organización (RLS).</p>
        </section>
      </AnimateIn>

      {/* Tarjetas operativas */}
      <AnimateIn delay={100}>
        <section id="tour-cards" className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <CardLink href="/agenda" token="agenda" title="Agenda" desc="Citas, disponibilidad y confirmaciones." />
          <CardLink href="/pacientes" token="pacientes" title="Pacientes" desc="Listado, filtros, etiquetas y timeline." />
          <CardLink href="/prescriptions/templates" token="recetas" title="Recetas" desc="Plantillas y emisión con membrete." />
          <CardLink href="/laboratorio" token="laboratorio" title="Laboratorio" desc="Órdenes y resultados con firma." />
          <CardLink href="/recordatorios" token="recordatorios" title="Recordatorios" desc="Mensajes SMS/WhatsApp programados." />
          <CardLink href="/reportes" token="reportes" title="Reportes" desc="Indicadores operativos y clínicos." />
        </section>
      </AnimateIn>

      {/* Métricas + sparkline */}
      <AnimateIn delay={140}>
        <section id="tour-stats">
          <QuickMetrics
            loading={loading}
            nextAppointments={mini?.nextAppointments ?? null}
            activePatients={mini?.activePatients ?? null}
            monthIncomeMXN={mini?.monthIncomeMXN ?? null}
            incomeTrend={incomeTrend ?? null}
          />
        </section>
      </AnimateIn>
    </main>
  );
}

function CardLink({
  href,
  token,
  title,
  desc,
}: {
  href: string;
  token: string;
  title: string;
  desc: string;
}) {
  return (
    <Link
      href={href}
      className="group rounded-3xl border bg-white/95 p-6 hover:shadow transition block focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
    >
      <div className="flex gap-3">
        <div className="h-12 w-12 rounded-2xl border inline-grid place-content-center group-hover:scale-105 transition">
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
