// app/(app)/ajustes/identidad/page.tsx
"use client";

import AccentHeader from "@/components/ui/AccentHeader";
import BrandingForm from "@/components/branding/BrandingForm";

export default function Page() {
  return (
    <main className="p-6 md:p-10 space-y-8">
      <AccentHeader
        title="Identidad del especialista"
        subtitle="Configura tu membrete, firma y datos para documentos."
        emojiToken="ajustes"
      />
      <BrandingForm />
    </main>
  );
}
