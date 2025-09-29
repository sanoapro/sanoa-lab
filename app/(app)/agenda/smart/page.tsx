// app/(app)/agenda/smart/page.tsx
"use client";
import AccentHeader from "@/components/ui/AccentHeader";
import AppointmentForm from "@/components/agenda/AppointmentForm";

export default function AgendaSmartPage() {
  return (
    <main className="p-6 md:p-10 space-y-6">
      <AccentHeader
        title="Agenda inteligente"
        subtitle="Sugerencias de horarios, riesgo de no-show y recordatorios automáticos."
        emojiToken="agenda"
      />
      <AppointmentForm />
    </main>
  );
}
