"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";
import ColorEmoji from "@/components/ColorEmoji";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log en consola para desarrollo
    // eslint-disable-next-line no-console
    console.error("[GlobalError]", error);

    // Reporta a Sentry
    Sentry.captureException(error);

    // (Opcional) Mostrar diálogo de reporte solo en producción
    if (process.env.NODE_ENV === "production") {
      // Puedes pasar datos del usuario si los tienes (email, name, etc.)
      Sentry.showReportDialog({
        // user: { email: "user@example.com", name: "Nombre" },
      });
    }
  }, [error]);

  return (
    <html lang="es">
      <body className="min-h-screen grid place-items-center bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 p-6">
        <div className="max-w-lg w-full space-y-4">
          <h2 className="text-2xl font-semibold flex items-center gap-2">
            <ColorEmoji emoji="🧯" /> Ocurrió un error
          </h2>
          <p className="text-sm opacity-80">Puedes reintentar o volver al tablero.</p>
          <div className="flex gap-2">
            <button
              onClick={() => reset()}
              className="rounded-xl bg-[var(--color-brand-primary)] px-4 py-2 text-white font-semibold hover:brightness-95"
            >
              Reintentar
            </button>
            <a
              href="/dashboard"
              className="rounded-xl border border-[var(--color-brand-border)] px-4 py-2 bg-white hover:bg-white/80"
            >
              Ir al tablero
            </a>
          </div>

          {process.env.NODE_ENV !== "production" && (
            <pre className="text-xs opacity-80 whitespace-pre-wrap">
              {error.message}
              {error.digest ? `\n\nDigest: ${error.digest}` : ""}
            </pre>
          )}
        </div>
      </body>
    </html>
  );
}
