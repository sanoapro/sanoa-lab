import InstallPrompt from "@/components/InstallPrompt";
import Link from "next/link";
import ColorEmoji from "@/components/ColorEmoji";

export default function TableroPage() {
  return (
    <main className="p-6 md:p-10 space-y-8">
      <InstallPrompt />

      {/* Encabezado */}
      <header className="space-y-2">
        <h1 className="text-3xl md:text-4xl font-semibold text-[var(--color-brand-text)] tracking-tight flex items-center gap-3">
          <ColorEmoji token="tablero" size={32} />
          Tablero
        </h1>
        <p className="text-[var(--color-brand-bluegray)]">
          Accesos rápidos a tus funciones principales.
        </p>
      </header>

      {/* Grid de tarjetas */}
      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
        {/* Pacientes */}
        <Link
          href="/pacientes"
          className="group rounded-3xl bg-white/95 border border-[var(--color-brand-border)]
                     shadow-[0_10px_30px_rgba(0,0,0,0.06)] hover:shadow-[0_14px_38px_rgba(0,0,0,0.08)]
                     transition overflow-hidden"
        >
          <div className="p-6 flex items-start gap-4">
            <div className="rounded-2xl p-4 border border-[var(--color-brand-border)] bg-[var(--color-brand-background)]">
              <ColorEmoji token="pacientes" size={28} />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-semibold text-[var(--color-brand-text)]">Pacientes</h3>
              <p className="text-[var(--color-brand-bluegray)] mt-1">
                Busca, registra y gestiona expedientes.
              </p>
            </div>
          </div>
          <div className="h-px bg-[var(--color-brand-border)] mx-6" />
          <div className="p-6 pt-4 text-sm text-[var(--color-brand-text)]/80">
            <span className="inline-flex items-center gap-2">
              Entrar <ColorEmoji token="siguiente" size={18} />
            </span>
          </div>
        </Link>

        {/* Subir archivos */}
        <Link
          href="/test-ui/upload"
          className="group rounded-3xl bg-white/95 border border-[var(--color-brand-border)]
                     shadow-[0_10px_30px_rgba(0,0,0,0.06)] hover:shadow-[0_14px_38px_rgba(0,0,0,0.08)]
                     transition overflow-hidden"
        >
          <div className="p-6 flex items-start gap-4">
            <div className="rounded-2xl p-4 border border-[var(--color-brand-border)] bg-[var(--color-brand-background)]">
              <ColorEmoji token="subir" size={28} />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-semibold text-[var(--color-brand-text)]">
                Subir archivos
              </h3>
              <p className="text-[var(--color-brand-bluegray)] mt-1">
                Carga documentos y gestiona tus contenidos.
              </p>
            </div>
          </div>
          <div className="h-px bg-[var(--color-brand-border)] mx-6" />
          <div className="p-6 pt-4 text-sm text-[var(--color-brand-text)]/80">
            <span className="inline-flex items-center gap-2">
              Ir ahora <ColorEmoji token="siguiente" size={18} />
            </span>
          </div>
        </Link>

        {/* Mis archivos */}
        <Link
          href="/test-ui"
          className="group rounded-3xl bg-white/95 border border-[var(--color-brand-border)]
                     shadow-[0_10px_30px_rgba(0,0,0,0.06)] hover:shadow-[0_14px_38px_rgba(0,0,0,0.08)]
                     transition overflow-hidden"
        >
          <div className="p-6 flex items-start gap-4">
            <div className="rounded-2xl p-4 border border-[var(--color-brand-border)] bg-[var(--color-brand-background)]">
              <ColorEmoji token="carpeta" size={28} />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-semibold text-[var(--color-brand-text)]">Mis archivos</h3>
              <p className="text-[var(--color-brand-bluegray)] mt-1">
                Revisa, descarga o comparte tus documentos.
              </p>
            </div>
          </div>
          <div className="h-px bg-[var(--color-brand-border)] mx-6" />
          <div className="p-6 pt-4 text-sm text-[var(--color-brand-text)]/80">
            <span className="inline-flex items-center gap-2">
              Ver listado <ColorEmoji token="ver" size={18} />
            </span>
          </div>
        </Link>

        {/* Próximamente (ejemplo de tarjeta “deshabilitada”) */}
        <div
          className="rounded-3xl bg-white/60 border border-[var(--color-brand-border)]
                        shadow-[0_10px_30px_rgba(0,0,0,0.04)] overflow-hidden opacity-70"
        >
          <div className="p-6 flex items-start gap-4">
            <div className="rounded-2xl p-4 border border-[var(--color-brand-border)] bg-[var(--color-brand-background)]">
              <ColorEmoji token="laboratorio" size={28} />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-semibold text-[var(--color-brand-text)]">
                Laboratorio (próximamente)
              </h3>
              <p className="text-[var(--color-brand-bluegray)] mt-1">
                Resultados y órdenes en un solo lugar.
              </p>
            </div>
          </div>
          <div className="h-px bg-[var(--color-brand-border)] mx-6" />
          <div className="p-6 pt-4 text-sm text-[var(--color-brand-text)]/70">
            <span className="inline-flex items-center gap-2">
              En desarrollo <ColorEmoji token="info" size={16} />
            </span>
          </div>
        </div>
      </section>
    </main>
  );
}
