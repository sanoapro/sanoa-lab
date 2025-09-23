// /app/error.tsx
"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Puedes loguear a Sentry aquí si lo deseas
    // Sentry.captureException(error);
    console.error("GlobalError:", error);
  }, [error]);

  return (
    <html>
      <body className="min-h-screen grid place-items-center bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 p-6">
        <div className="max-w-lg w-full space-y-4">
          <h2 className="text-2xl font-semibold">Algo no salió bien</h2>
          <p className="text-sm opacity-80">
            {error?.message || "Ocurrió un error inesperado."}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => reset()}
              className="px-4 py-2 rounded-lg bg-slate-900 text-white dark:bg-white dark:text-slate-900"
            >
              Reintentar
            </button>
            <button
              onClick={() => location.reload()}
              className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700"
            >
              Recargar
            </button>
          </div>
          {error?.digest && (
            <p className="text-xs opacity-60">Ref: {error.digest}</p>
          )}
        </div>
      </body>
    </html>
  );
}
