"use client";

import { useEffect } from "react";
import Link from "next/link";
import ColorEmoji from "@/components/ColorEmoji";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Útil en dev
    // eslint-disable-next-line no-console
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-[60vh] grid place-items-center p-6">
      <section className="surface-light w-full max-w-lg rounded-2xl border border-[var(--color-brand-border)] bg-white/95 backdrop-blur shadow-lg p-6 space-y-4">
        <h2 className="text-2xl font-semibold flex items-center gap-2">
          <ColorEmoji emoji="🛟" /> Algo no salió bien
        </h2>
        <p className="text-sm text-[var(--color-brand-bluegray)]">
          Intenta reintentar o vuelve al tablero.
        </p>

        <div className="flex gap-2">
          <button
            onClick={() => reset()}
            className="rounded-xl bg-[var(--color-brand-primary)] px-4 py-2 text-white font-semibold hover:brightness-95"
          >
            Reintentar
          </button>
          <Link
            href="/dashboard"
            className="rounded-xl border border-[var(--color-brand-border)] px-4 py-2 bg-white hover:bg-white/80"
          >
            Ir al tablero
          </Link>
        </div>

        {process.env.NODE_ENV !== "production" && (
          <pre className="mt-3 text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg p-3 overflow-auto whitespace-pre-wrap">
            {error?.message}
            {error?.digest ? `\n\nDigest: ${error.digest}` : ""}
          </pre>
        )}
      </section>
    </div>
  );
}
