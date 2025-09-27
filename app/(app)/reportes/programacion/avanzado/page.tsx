"use client";

import AccentHeader from "@/components/ui/AccentHeader";
import { useMemo } from "react";
import { getActiveOrg } from "@/lib/org-local";
import AdvancedScheduleEditor from "@/components/reports/AdvancedScheduleEditor";

export default function SchedulesAdvancedPage() {
  const org = useMemo(()=> getActiveOrg(), []);
  const orgId = org?.id || "";
  return (
    <main className="p-6 md:p-10 space-y-6">
      <AccentHeader
        title="Programación avanzada"
        subtitle='Crea alertas "agenda_alerts" con umbrales y ventana.'
        emojiToken="alerta"
      />
      {!orgId ? (
        <p className="text-amber-700 bg-amber-50 border border-amber-200 rounded p-3">
          Selecciona una organización activa para continuar.
        </p>
      ) : (
        <AdvancedScheduleEditor orgId={orgId} />
      )}
    </main>
  );
}
