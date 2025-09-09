"use client";
import ColorEmoji from "@/components/ColorEmoji";

export default function PrivacidadPage() {
  return (
    <main className="min-h-[100dvh] grid place-items-center p-6">
      <section className="w-full max-w-3xl rounded-3xl border border-[var(--color-brand-border)] bg-white p-8 shadow space-y-4">
        <h1 className="text-3xl font-semibold text-[var(--color-brand-text)] flex items-center gap-3">
          <ColorEmoji token="info" size={22} /> Política de privacidad
        </h1>
        <p className="text-[var(--color-brand-text)]/80">
          Respetamos tu privacidad. Los archivos que subes se almacenan en Supabase Storage y son
          visibles únicamente para tu cuenta, gracias a políticas RLS por propietario.
        </p>
        <ul className="list-disc pl-5 text-[var(--color-brand-text)]/80 space-y-1">
          <li>No vendemos ni compartimos tus datos con terceros.</li>
          <li>Usamos cookies para autenticación segura.</li>
          <li>Puedes solicitar eliminación de datos escribiéndonos.</li>
        </ul>
      </section>
    </main>
  );
}
