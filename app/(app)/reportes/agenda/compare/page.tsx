"use client";

import AccentHeader from "@/components/ui/AccentHeader";
import { useMemo } from "react";
import { getActiveOrg } from "@/lib/org-local";
import AgendaCompareForm from "@/components/reports/AgendaCompareForm";

export default function AgendaComparePage() {
  const org = useMemo(()=> getActiveOrg(), []);
  const orgId = org?.id || "";
  return (
    <main className="p-6 md:p-10 space-y-6">
      <AccentHeader
        title="Agenda — Comparar periodos"
        subtitle="Analiza no-show, cancelaciones y tiempos entre dos rangos."
        emojiToken="agenda"
      />
      {!orgId ? (
        <p className="text-amber-700 bg-amber-50 border border-amber-200 rounded p-3">
          Selecciona una organización activa para continuar.
        </p>
      ) : (
        <AgendaCompareForm orgId={orgId} />
      )}
    </main>
  );
}
