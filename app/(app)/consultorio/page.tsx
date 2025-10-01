"use client";

import * as React from "react";
import Link from "next/link";

import PatientAutocomplete from "@/components/patients/PatientAutocomplete";
import { getActiveOrg } from "@/lib/org-local";

export default function Consultorio() {
  const orgId = React.useMemo(() => getActiveOrg()?.id ?? "", []);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">
        <span className="emoji">🏥</span> Mi Consultorio
      </h1>
      <div className="text-contrast">
        Tu centro operativo: agenda, pacientes, recetas, laboratorio, recordatorios.
      </div>

      <div className="glass-card bubble">
        <label className="block mb-2 font-medium">Buscar paciente</label>
        <div className="relative">
          <div className="relative z-10 pointer-events-auto">
            {orgId ? (
              <PatientAutocomplete
                orgId={orgId}
                scope="org"
                placeholder="Escribe nombre del paciente…"
                onSelect={(hit) => {
                  const pid = (hit as any)?.id ?? (hit as any)?.patient_id;
                  if (pid) window.location.href = `/pacientes/${pid}`;
                }}
              />
            ) : (
              <input
                className="glass-input w-full"
                disabled
                placeholder="Selecciona una organización activa para buscar"
              />
            )}
          </div>
        </div>
        <p className="mt-2 text-xs text-contrast">
          * Se muestran pacientes de tu organización.
        </p>
      </div>

      <div className="flex gap-2 flex-wrap">
        <Link href="/agenda" className="glass-btn">
          <span className="emoji">🗓️</span> Agenda
        </Link>
        <Link href="/pacientes" className="glass-btn">
          <span className="emoji">👤</span> Pacientes
        </Link>
        <Link href="/prescriptions/templates" className="glass-btn">
          <span className="emoji">💊</span> Recetas
        </Link>
        <Link href="/laboratorio" className="glass-btn">
          <span className="emoji">🧪</span> Laboratorio
        </Link>
      </div>
    </div>
  );
}
