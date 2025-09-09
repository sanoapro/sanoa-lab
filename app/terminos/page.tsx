"use client";
import ColorEmoji from "@/components/ColorEmoji";

export default function TerminosPage() {
  return (
    <main className="min-h-[100dvh] grid place-items-center p-6">
      <section className="w-full max-w-3xl rounded-3xl border border-[var(--color-brand-border)] bg-white p-8 shadow space-y-4">
        <h1 className="text-3xl font-semibold text-[var(--color-brand-text)] flex items-center gap-3">
          <ColorEmoji token="info" size={22} /> Términos de uso
        </h1>
        <p className="text-[var(--color-brand-text)]/80">
          Al usar Sanoa Lab aceptas hacerlo conforme a la ley aplicable y a estos términos. No subas
          contenidos prohibidos ni compartas credenciales. El servicio puede cambiar sin previo
          aviso.
        </p>
      </section>
    </main>
  );
}
