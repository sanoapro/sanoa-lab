"use client";

import { useEffect, useMemo, useState } from "react";
import AccentHeader from "@/components/ui/AccentHeader";
import { getActiveOrg } from "@/lib/org-local";
import TemplatesEditor from "@/components/reminders/TemplatesEditor";

export default function TemplatesPage() {
  const org = useMemo(() => getActiveOrg(), []);
  const orgId = org?.id || "";

  return (
    <main className="p-6 md:p-10 space-y-6">
      <AccentHeader
        title="Plantillas de recordatorios"
        subtitle="Define textos con variables por especialidad y canal. Previsualiza con datos de ejemplo."
        emojiToken="plantilla"
      />
      {!orgId ? (
        <p className="text-amber-700 bg-amber-50 border border-amber-200 rounded p-3">
          Selecciona una organización activa para continuar.
        </p>
      ) : (
        <TemplatesEditor orgId={orgId} />
      )}
    </main>
  );
}
