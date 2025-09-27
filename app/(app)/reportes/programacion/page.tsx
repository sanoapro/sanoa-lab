"use client";

import AccentHeader from "@/components/ui/AccentHeader";
import SchedulesEditor from "@/components/reports/SchedulesEditor";
import { useMemo } from "react";
import { getActiveOrg } from "@/lib/org-local";

export default function ReportSchedulesPage() {
  const org = useMemo(() => getActiveOrg(), []);
  const orgId = org?.id || "";

  return (
    <main className="p-6 md:p-10 space-y-6">
      <AccentHeader
        title="Programación de reportes"
        subtitle="Envía resúmenes por WhatsApp, SMS o Email en horarios definidos."
        emojiToken="reportes"
      />
      {!orgId ? (
        <p className="text-amber-700 bg-amber-50 border border-amber-200 rounded p-3">
          Selecciona una organización activa para continuar.
        </p>
      ) : (
        <SchedulesEditor orgId={orgId} />
      )}
    </main>
  );
}
