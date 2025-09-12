// app/error.tsx
'use client';

import Link from 'next/link';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="es">
      <body>
        <main className="min-h-[100dvh] grid place-items-center p-6">
          <section className="w-full max-w-lg rounded-2xl border border-[var(--color-brand-border)] bg-white p-6 shadow">
            <h1 className="text-xl font-semibold mb-3 text-[var(--color-brand-text)]">
              Ocurrió un problema
            </h1>
            <p className="mb-4 text-[var(--color-brand-bluegray)]">
              {error.message || 'Error inesperado.'}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => reset()}
                className="btn btn-primary"
              >
                Reintentar
              </button>
              <Link href="/" className="btn btn-ghost">
                Ir al inicio
              </Link>
            </div>
          </section>
        </main>
      </body>
    </html>
  );
}
