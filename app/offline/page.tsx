"use client";
import ColorEmoji from "@/components/ColorEmoji";

export default function OfflinePage() {
  return (
    <main className="min-h-[100dvh] grid place-items-center p-6">
      <section className="w-full max-w-lg rounded-3xl border border-[var(--color-brand-border)] bg-white p-8 shadow">
        <h1 className="text-2xl md:text-3xl font-semibold text-[var(--color-brand-text)] flex items-center gap-3">
          <ColorEmoji emoji="📴" size={20} />
          Estás sin conexión
        </h1>
        <p className="mt-2 text-[var(--color-brand-bluegray)]">
          No pudimos cargar esta página. Conéctate a internet e inténtalo de nuevo.
        </p>
        <div className="mt-6 flex gap-3">
          <a href="/dashboard" className="rounded-xl bg-[var(--color-brand-primary)] px-4 py-2 text-white">Ir al Tablero</a>
          <button onClick={() => location.reload()} className="rounded-xl border border-[var(--color-brand-border)] px-4 py-2">
            Reintentar
          </button>
        </div>
      </section>
    </main>
  );
}
