// app/(app)/recordatorios/page.tsx
import Link from "next/link";
import AccentHeader from "@/components/ui/AccentHeader";
import ColorEmoji from "@/components/ColorEmoji";

export default function RecordatoriosPage() {
  return (
    <main className="p-6 md:p-10 space-y-8">
      <AccentHeader
        title="Recordatorios"
        subtitle="Programa y revisa notificaciones a pacientes (SMS, WhatsApp, Email)."
        emojiToken="recordatorios"
      />

      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
      </section>
    </main>
  );
}
