"use client";

import AccentHeader from "@/components/ui/AccentHeader";
import { getActiveOrg } from "@/lib/org-local";
import { useMemo } from "react";
import QuickExports from "@/components/reports/QuickExports";

export default function QuickReportsPage() {
  const org = useMemo(() => getActiveOrg(), []);
  const orgId = org?.id || "";

  return (
    <main className="p-6 md:p-10 space-y-6">
      <AccentHeader
        title="Reportes rápidos"
        subtitle="Descarga XLSX de pacientes, agenda y métricas por periodo."
        emojiToken="exportar"
      />
      {!orgId ? (
        <p className="text-amber-700 bg-amber-50 border border-amber-200 rounded p-3">
          Selecciona una organización activa para continuar.
        </p>
      ) : (
        <QuickExports orgId={orgId} />
      )}
    </main>
  );
}
