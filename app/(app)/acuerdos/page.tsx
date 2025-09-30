// app/(app)/acuerdos/page.tsx
"use client";

import AccentHeader from "@/components/ui/AccentHeader";
import TemplatesEditor from "@/components/agreements/TemplatesEditor";
import SendDialog from "@/components/agreements/SendDialog";

export default function Page() {
  return (
    <main className="p-6 md:p-10 space-y-8">
      <AccentHeader
        title="Acuerdos y contratos"
        subtitle="Define, comparte y asegura la aceptación de acuerdos clave."
        emojiToken="contrato"
      />
      <SendDialog />
      <TemplatesEditor />
    </main>
  );
}
