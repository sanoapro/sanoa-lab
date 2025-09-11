// app/not-found.tsx
import Link from "next/link";
import ColorEmoji from "@/components/ColorEmoji";

export default function NotFound() {
  return (
    <main className="min-h-[60vh] w-full grid place-items-center px-4 py-20">
      <div className="w-full max-w-3xl rounded-3xl bg-white/95 shadow-xl ring-1 ring-[var(--color-brand-border)]">
        <div className="p-8 md:p-10">
          <div className="flex items-center gap-3 mb-2">
            <ColorEmoji
              token="busqueda"
              toneA="var(--color-brand-primary)"
              toneB="var(--color-brand-coral)"
              size={34}
              className="shrink-0"
            />
            <h1 className="text-3xl md:text-[2.15rem] font-semibold text-[var(--color-brand-text)]">
              Página no encontrada
            </h1>
          </div>

          <p className="text-[var(--color-brand-text)]/70 leading-relaxed">
            Uy… no pudimos encontrar lo que buscas (404). Verifica la URL o vuelve al inicio.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-xl bg-[var(--color-brand-primary)] px-4 py-2.5 text-white font-medium shadow-sm hover:opacity-95 transition"
            >
              <ColorEmoji token="home" toneA="#FFFFFF" toneB="#FFFFFF" size={18} />
              Inicio
            </Link>

            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 rounded-xl bg-[var(--color-brand-coral)] px-4 py-2.5 text-white font-medium shadow-sm hover:opacity-95 transition"
            >
              <ColorEmoji token="tablero" toneA="#FFFFFF" toneB="#FFFFFF" size={18} />
              Ir al dashboard
            </Link>

            <a
              href="mailto:soporte@sanoa.dev?subject=Reporte%20404"
              className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-[var(--color-brand-text)] font-medium shadow-sm ring-1 ring-[var(--color-brand-border)] hover:bg-[var(--color-brand-background)] transition"
            >
              <ColorEmoji
                token="puzzle"
                toneA="var(--color-brand-text)"
                toneB="var(--color-brand-bluegray)"
                size={18}
              />
              Reportar
            </a>
          </div>
        </div>

        <div className="border-t border-[var(--color-brand-border)]/80 px-8 md:px-10 py-4 text-sm text-[var(--color-brand-text)]/60">
          Código de estado: <span className="font-mono">404</span>
        </div>
      </div>
    </main>
  );
}
