"use client";

import Link from "next/link";
import * as React from "react";
import PatientAutocomplete from "@/components/patients/PatientAutocomplete";
import { getActiveOrg } from "@/lib/org-local";

const CARD_ICONS: Record<string, string> = {
  agenda: "🗓️",
  pacientes: "🧑‍⚕️",
  recetas: "💊",
  laboratorio: "🧪",
  recordatorios: "🔔",
  reportes: "📊",
};

export default function Page() {
  const org = React.useMemo(() => getActiveOrg(), []);
  const orgId = org?.id || "";

  return (
    <div className="space-y-7">
      <h1 className="text-3xl font-semibold tracking-tight">
        <span className="emoji">🏥</span> Mi Consultorio
      </h1>
      <p className="text-base text-slate-600 dark:text-slate-300">
        Tu centro operativo: agenda, pacientes, recetas, laboratorio, recordatorios.
      </p>

      <div className="glass-card bubble text-contrast">
        <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">
          Buscar paciente
        </label>
        <div className="relative">
          {orgId ? (
            <PatientAutocomplete
              orgId={orgId}
              scope="org"
              placeholder="Escribe nombre del paciente…"
              onSelect={(hit) => {
                // Soporta ambos: hit.id o hit.patient_id según el componente
                const pid = (hit as any)?.id ?? (hit as any)?.patient_id;
                if (pid) window.location.href = `/pacientes/${pid}`;
              }}
              className="glass-input w-full relative z-10 pointer-events-auto"
            />
          ) : (
            <input
              className="glass-input w-full"
              disabled
              placeholder="Selecciona una organización activa para buscar"
            />
          )}
        </div>
        <p className="mt-2 text-xs text-slate-500">Verás pacientes de tu organización activa.</p>
      </div>

      <section className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <CardLink
          href="/agenda"
          token="agenda"
          title="Agenda"
          desc="Citas, disponibilidad y confirmaciones."
        />
        <CardLink
          href="/pacientes"
          token="pacientes"
          title="Pacientes"
          desc="Listado, filtros, etiquetas y timeline."
        />
        <CardLink
          href="/prescriptions/templates"
          token="recetas"
          title="Recetas"
          desc="Plantillas y emisión con membrete."
        />
        <CardLink
          href="/laboratorio"
          token="laboratorio"
          title="Laboratorio"
          desc="Órdenes y resultados con firma."
        />
        <CardLink
          href="/recordatorios"
          token="recordatorios"
          title="Recordatorios"
          desc="Mensajes SMS/WhatsApp programados."
        />
        <CardLink
          href="/reportes"
          token="reportes"
          title="Reportes"
          desc="Indicadores operativos y clínicos."
        />
      </section>
    </div>
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
  const emoji = CARD_ICONS[token] ?? "✨";

  return (
    <Link
      href={href}
      className="glass-card bubble text-contrast transition-shadow hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-900"
    >
      <div className="flex items-start gap-4">
        <div className="inline-grid h-12 w-12 place-content-center rounded-xl border border-white/40 bg-white/50 text-lg dark:border-slate-700/60 dark:bg-slate-900/60">
          <span className="emoji" aria-hidden>
            {emoji}
          </span>
        </div>
        <div className="space-y-1">
          <h3 className="text-lg font-semibold">{title}</h3>
          <p className="text-sm text-slate-600 dark:text-slate-200/90">{desc}</p>
        </div>
      </div>
    </Link>
  );
}
