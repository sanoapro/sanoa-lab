"use client";
import { useMemo } from "react";
import AccentHeader from "@/components/ui/AccentHeader";
import Gate from "@/components/Gate";
import AssessmentsScreen from "@/components/mente/AssessmentsScreen";
import { getActiveOrg } from "@/lib/org-local";

export default function MenteEvaluacionesPage() {
  const org = useMemo(() => getActiveOrg(), []);
  const orgId = org?.id || "";

  return (
    <main className="p-6 md:p-10 space-y-6">
      <AccentHeader
        title="Mente — Evaluaciones"
        subtitle="PHQ-9, GAD-7 y AUDIT-C con guardado en expediente y línea de tiempo."
        emojiToken="mente"
      />
      {!orgId ? (
        <p className="text-amber-700 bg-amber-50 border border-amber-200 rounded p-3">
          Selecciona una organización activa para continuar.
        </p>
      ) : (
        <Gate
          orgId={orgId}
          featureId="mente.evaluaciones"
          fallback={
            <div className="border rounded-2xl p-4">
              No tienes habilitada la función de Evaluaciones.
            </div>
          }
        >
          <AssessmentsScreen />
        </Gate>
      )}
    </main>
  );
}
