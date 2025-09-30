"use client";

import * as React from "react";
import PatientAutocomplete from "@/components/patients/PatientAutocomplete";
import { getActiveOrg } from "@/lib/org-local";

export default function Page() {
  const org = React.useMemo(() => getActiveOrg(), []);
  const orgId = org?.id || "";

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">
        <span className="emoji">🏥</span> Mi Consultorio
      </h1>
      <p className="text-sm text-slate-600 dark:text-slate-300">
        Tu centro operativo: agenda, pacientes, recetas, laboratorio, recordatorios.
      </p>

      <div className="glass-card">
        <label className="block text-sm mb-2">Buscar paciente</label>
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

      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
  return (
    <a href={href} className="rounded-2xl border p-4 hover:shadow-sm transition">
      <div className="flex items-start gap-3">
        <div className="h-10 w-10 rounded-xl border inline-grid place-content-center">
          <span className="emoji">{/* opcional: ícono según token */}</span>
        </div>
        <div>
          <h3 className="font-semibold">{title}</h3>
          <p className="text-sm text-slate-600">{desc}</p>
        </div>
      </div>
    </a>
  );
}
