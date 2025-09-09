"use client";
import ColorEmoji from "@/components/ColorEmoji";

export default function AcercaPage() {
  return (
    <main className="min-h-[100dvh] grid place-items-center p-6">
      <section className="w-full max-w-3xl rounded-3xl border border-[var(--color-brand-border)] bg-white p-8 shadow space-y-4">
        <h1 className="text-3xl font-semibold text-[var(--color-brand-text)] flex items-center gap-3">
          <ColorEmoji token="hoja" size={22} /> Acerca de Sanoa
        </h1>
        <p className="text-[var(--color-brand-text)]/80">
          Sanoa Lab es una PWA modular para el ecosistema clínico, pensada para público latino.
          Minimalista, accesible y lista para usarse en cualquier dispositivo.
        </p>
        <p className="text-[var(--color-brand-bluegray)] text-sm">
          Versión de la app disponible offline parcial gracias a Service Worker.
        </p>
      </section>
    </main>
  );
}
