"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useSearchParams } from "next/navigation";

import AccentHeader from "@/components/ui/AccentHeader";
import ColorEmoji from "@/components/ColorEmoji";

// === NUEVO (añadidos, sin quitar tu UI original) ===
import SavedViewsBar from "@/components/saved-views/SavedViewsBar";
import RemindersFilters from "@/components/reminders/Filters";
import RemindersTable from "@/components/reminders/Table";
import { getActiveOrg } from "@/lib/org-local";

export default function RecordatoriosPage() {
  // --- NUEVO: soporte de org activa + export respetando filtros ---
  const org = useMemo(() => getActiveOrg(), []);
  const orgId = org?.id || "";
  const search = useSearchParams();
  const exportHref = orgId
    ? `/api/reminders/export?${new URLSearchParams({
        org_id: orgId,
        ...Object.fromEntries(search.entries()),
      }).toString()}`
    : "#";

  return (
    <main className="p-6 md:p-10 space-y-8">
      {/* Conserva tu encabezado original */}
      <AccentHeader
        title="Recordatorios"
        subtitle="Programa y revisa notificaciones a pacientes (SMS, WhatsApp, Email)."
        emojiToken="recordatorios"
      />

      {/* === TU SECCIÓN ORIGINAL (no se toca) === */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link
          href="/reportes/confirmaciones"
          className="rounded-3xl bg-white/95 border border-[var(--color-brand-border)] p-6 hover:shadow-lg transition"
        >
          <div className="flex items-start gap-4">
            <div className="rounded-2xl p-4 border bg-[var(--color-brand-background)]">
              <ColorEmoji token="reportes" size={28} />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Confirmaciones</h3>
              <p className="text-[var(--color-brand-bluegray)] mt-1">
                Tasa de confirmados / no-show por día.
              </p>
            </div>
          </div>
        </Link>

        <Link
          href="/ajustes/recordatorios"
          className="rounded-3xl bg-white/95 border border-[var(--color-brand-border)] p-6 hover:shadow-lg transition"
        >
          <div className="flex items-start gap-4">
            <div className="rounded-2xl p-4 border bg-[var(--color-brand-background)]">
              <ColorEmoji token="ajustes" size={28} />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Ajustes</h3>
              <p className="text-[var(--color-brand-bluegray)] mt-1">
                Plantillas y canales (SMS/WhatsApp/Email).
              </p>
            </div>
          </div>
        </Link>

        <Link
          href="/recordatorios/plantillas"
          className="rounded-3xl bg-white/95 border border-[var(--color-brand-border)] p-6 hover:shadow-lg transition"
        >
          <div className="flex items-start gap-4">
            <div className="rounded-2xl p-4 border bg-[var(--color-brand-background)]">
              <ColorEmoji token="plantilla" size={28} />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Plantillas</h3>
              <p className="text-[var(--color-brand-bluegray)] mt-1">
                Edita textos por especialidad y haz pruebas antes de enviar.
              </p>
            </div>
          </div>
        </Link>
      </section>

      {/* === NUEVO: Explorador con vistas guardadas, filtros, tabla y export === */}
      {!orgId && (
        <p className="text-amber-700 bg-amber-50 border border-amber-200 rounded p-3">
          Selecciona una organización activa para continuar.
        </p>
      )}

      {orgId && (
        <section className="space-y-6">
          <div className="flex items-center justify-between gap-3">
            <SavedViewsBar orgId={orgId} scope="reminders" />
            <a
              href={exportHref}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border"
              title="Exportar CSV (respeta filtros)"
            >
              <span aria-hidden>📤</span>
              <span>Exportar CSV</span>
            </a>
          </div>

          <RemindersFilters />
          <RemindersTable orgId={orgId} />
        </section>
      )}
    </main>
  );
}
