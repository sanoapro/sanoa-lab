// app/(app)/recordatorios/ajustes/page.tsx
"use client";

import AccentHeader from "@/components/ui/AccentHeader";
import PrefsForm from "@/components/reminders/PrefsForm";

export default function Page() {
  return (
    <main className="p-6 md:p-10 space-y-8">
      <AccentHeader
        title="Ajustes de recordatorios"
        subtitle="Configura ventana horaria, días activos, canales y reintentos."
        emojiToken="ajustes"
      />
      <PrefsForm />
    </main>
  );
}
