export const metadata = {
  title: "Zona de pruebas — Sanoa",
};

export default function TestUIPage() {
  return (
    <section className="space-y-6">
      <header className="rounded-2xl border border-[var(--color-brand-border)] bg-white/90 p-6 shadow-sm">
        <h1 className="text-2xl font-semibold">
          <span className="mr-2">🧪</span> Zona de pruebas
        </h1>
        <p className="mt-2 text-sm text-[var(--color-brand-text)]/75">
          Aquí probamos componentes, estilos y flujos.
        </p>
      </header>

      <div className="rounded-2xl border border-[var(--color-brand-border)] bg-white/90 p-5 shadow-sm">
        <div className="mb-2 text-lg font-medium">
          <span className="mr-2">📤</span> Subir archivos
        </div>
        <p className="mb-4 text-sm text-[var(--color-brand-text)]/75">
          Ir al módulo de carga y gestión de archivos (Supabase).
        </p>
        <a
          href="/test-ui/upload"
          className="inline-flex items-center justify-center rounded-xl border border-[var(--color-brand-border)] bg-[var(--color-brand-primary)]/10 px-3 py-2 text-sm font-medium text-[var(--color-brand-text)] hover:bg-[var(--color-brand-primary)]/15"
        >
          Abrir módulo
        </a>
      </div>
    </section>
  );
}
