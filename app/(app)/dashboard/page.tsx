export const metadata = {
  title: "Tablero — Sanoa",
};

export default function DashboardPage() {
  return (
    <section className="space-y-6">
      <header className="rounded-2xl border border-[var(--color-brand-border)] bg-white/90 p-6 shadow-sm">
        <h1 className="text-2xl font-semibold">
          <span className="mr-2">📊</span> Tablero
        </h1>
        <p className="mt-2 text-sm text-[var(--color-brand-text)]/75">
          Resumen general y accesos rápidos.
        </p>
      </header>

      {/* Ejemplo de tarjetas rápidas */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-2xl border border-[var(--color-brand-border)] bg-white/90 p-5 shadow-sm">
          <div className="mb-2 text-lg font-medium">
            <span className="mr-2">🧪</span> Zona de pruebas
          </div>
          <p className="mb-4 text-sm text-[var(--color-brand-text)]/75">
            Componentes de prueba y carga de archivos.
          </p>
          <a
            href="/test-ui"
            className="inline-flex items-center justify-center rounded-xl border border-[var(--color-brand-border)] bg-[var(--color-brand-primary)]/10 px-3 py-2 text-sm font-medium text-[var(--color-brand-text)] hover:bg-[var(--color-brand-primary)]/15"
          >
            Ir ahora
          </a>
        </div>

        <div className="rounded-2xl border border-[var(--color-brand-border)] bg-white/90 p-5 shadow-sm">
          <div className="mb-2 text-lg font-medium">
            <span className="mr-2">📤</span> Subir archivos
          </div>
          <p className="mb-4 text-sm text-[var(--color-brand-text)]/75">
            Sube y gestiona tus archivos en Supabase.
          </p>
          <a
            href="/test-ui/upload"
            className="inline-flex items-center justify-center rounded-xl border border-[var(--color-brand-border)] bg-[var(--color-brand-primary)]/10 px-3 py-2 text-sm font-medium text-[var(--color-brand-text)] hover:bg-[var(--color-brand-primary)]/15"
          >
            Abrir
          </a>
        </div>
      </div>
    </section>
  );
}
