// app/(app)/recordatorios/cola/page.tsx
"use client";

import AccentHeader from "@/components/ui/AccentHeader";
import QueueTable from "@/components/reminders/QueueTable";

export default function Page() {
  return (
    <main className="p-6 md:p-10 space-y-8">
      <AccentHeader
        title="Cola de recordatorios"
        subtitle="Revisar pendientes, enviados y errores."
        emojiToken="recordatorios"
      />
      <QueueTable />
    </main>
  );
}
