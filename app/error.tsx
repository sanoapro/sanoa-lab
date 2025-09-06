// app/error.tsx
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
    // Puedes enviar esto a tu servicio de logs si quieres.
    // console.error(error);
  }, [error]);

  const copyDetails = async () => {
    const text = `Mensaje: ${error.message}\nDigest: ${error.digest ?? "—"}`;
    try {
      await navigator.clipboard.writeText(text);
      alert("Detalles copiados al portapapeles.");
    } catch {
      alert("No se pudieron copiar los detalles.");
    }
  };

  return (
    <main className="min-h-[60vh] w-full grid place-items-center px-4 py-20">
      <div className="w-full max-w-3xl rounded-3xl bg-white/95 shadow-xl ring-1 ring-[var(--color-brand-border)]">
        <div className="p-8 md:p-10">
          <div className="flex items-center gap-3 mb-2">
            <ColorEmoji
              emoji="⚠️"
              toneA="var(--color-brand-primary)"
              toneB="var(--color-brand-coral)"
              size={34}
              className="shrink-0"
            />
            <h1 className="text-3xl md:text-[2.15rem] font-semibold text-[var(--color-brand-text)]">
              Ocurrió un error
            </h1>
          </div>

          <p className="text-[var(--color-brand-text)]/70 leading-relaxed">
            Algo salió mal al cargar esta página. Puedes intentar de nuevo o
            regresar al inicio.
          </p>

          <div className="mt-6 rounded-xl bg-[var(--color-brand-background)]/70 ring-1 ring-[var(--color-brand-border)] p-4">
            <p className="text-sm text-[var(--color-brand-text)]/75">
              <span className="font-semibold">Detalle:</span>{" "}
              {error.message || "—"}
            </p>
            {error.digest && (
              <p className="text-xs text-[var(--color-brand-text)]/60 mt-1">
                digest: <span className="font-mono">{error.digest}</span>
              </p>
            )}
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <button
              onClick={() => reset()}
              className="inline-flex items-center gap-2 rounded-xl bg-[var(--color-brand-primary)] px-4 py-2.5 text-white font-medium shadow-sm hover:opacity-95 transition"
            >
              <ColorEmoji emoji="🔄" toneA="#FFFFFF" toneB="#FFFFFF" size={18} />
              Reintentar
            </button>

            <button
              onClick={copyDetails}
              className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-[var(--color-brand-text)] font-medium shadow-sm ring-1 ring-[var(--color-brand-border)] hover:bg-[var(--color-brand-background)] transition"
            >
              <ColorEmoji
                emoji="📋"
                toneA="var(--color-brand-text)"
                toneB="var(--color-brand-bluegray)"
                size={18}
              />
              Copiar detalle
            </button>

            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-xl bg-[var(--color-brand-coral)] px-4 py-2.5 text-white font-medium shadow-sm hover:opacity-95 transition"
            >
              <ColorEmoji emoji="🏠" toneA="#FFFFFF" toneB="#FFFFFF" size={18} />
              Ir al inicio
            </Link>
          </div>
        </div>

        <div className="border-t border-[var(--color-brand-border)]/80 px-8 md:px-10 py-4 text-sm text-[var(--color-brand-text)]/60">
          Si el problema persiste, escríbenos a{" "}
          <a
            className="underline decoration-[var(--color-brand-primary)] underline-offset-2"
            href="mailto:soporte@sanoa.dev?subject=Error%20en%20Sanoa"
          >
            soporte@sanoa.dev
          </a>
        </div>
      </div>
    </main>
  );
}
