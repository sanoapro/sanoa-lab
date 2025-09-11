"use client";

import { useEffect } from "react";
import { toSpanishError } from "@/lib/i18n-errors";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Puedes enviar a Sentry si lo deseas:
    // Sentry.captureException(error);
    console.error("GlobalError:", error);
  }, [error]);

  const msg = toSpanishError(error);

  return (
    <html>
      <body>
        <main className="min-h-[100dvh] grid place-items-center p-6">
          <section className="w-full max-w-lg rounded-2xl border border-[var(--color-brand-border)] bg-white p-6 shadow">
            <h1 className="text-xl font-semibold text-[var(--color-brand-text)] mb-3">
              Ocurrió un problema
            </h1>
            <pre className="whitespace-pre-wrap text-[var(--color-brand-bluegray)] text-sm bg-slate-50 rounded p-3 border border-slate-200">
              {msg}
            </pre>
            <div className="mt-4 flex gap-3">
              <button
                onClick={() => reset()}
                className="rounded-lg bg-[var(--color-brand-bluegray)] px-4 py-2 text-white font-medium"
              >
                Reintentar
              </button>
              <a
                href="/"
                className="rounded-lg border border-[var(--color-brand-border)] px-4 py-2 text-[var(--color-brand-text)]"
              >
                Ir al inicio
              </a>
            </div>
          </section>
        </main>
      </body>
    </html>
  );
}
