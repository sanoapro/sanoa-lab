// app/(app)/dashboard/page.tsx
import InstallPrompt from "@/components/InstallPrompt";
import Link from "next/link";
import ColorEmoji from "@/components/ColorEmoji";

export default function TableroPage() {
  return (
    <main className="p-6 md:p-10 space-y-8">
      <InstallPrompt />

      <header className="space-y-2">
        <h1 className="text-3xl md:text-4xl font-semibold text-[var(--color-brand-text)] tracking-tight flex items-center gap-3">
          <ColorEmoji token="tablero" size={32} />
          Tablero
        </h1>
        <p className="text-sm text-[var(--color-brand-text)]/80">
          Accesos rápidos a tus funciones principales.
        </p>
      </header>

      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
        {/* Pacientes */}
        <Link
          href="/pacientes"
          className="group rounded-3xl bg-white/95 border border-[var(--color-brand-border)] shadow-[0_10px_30px_rgba(0,0,0,0.06)] hover:shadow-[0_14px_38px_rgba(0,0,0,0.08)] transition overflow-hidden"
        >
          <div className="p-6 flex items-start gap-4">
            <div className="rounded-2xl p-4 border border-[var(--color-brand-border)] bg-[var(--color-brand-background)]">
              <ColorEmoji token="pacientes" size={28} />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-[var(--color-brand-text)]">Pacientes</h3>
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

        {/* Agenda */}
        <Link
          href="/agenda"
          className="group rounded-3xl bg-white/95 border border-[var(--color-brand-border)] shadow-[0_10px_30px_rgba(0,0,0,0.06)] hover:shadow-[0_14px_38px_rgba(0,0,0,0.08)] transition overflow-hidden"
        >
          <div className="p-6 flex items-start gap-4">
            <div className="rounded-2xl p-4 border border-[var(--color-brand-border)] bg-[var(--color-brand-background)]">
              <ColorEmoji token="agenda" size={28} />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-[var(--color-brand-text)]">Agenda</h3>
              <p className="text-[var(--color-brand-bluegray)] mt-1">
                Crea y vincula citas fácilmente.
              </p>
            </div>
          </div>
          <div className="h-px bg-[var(--color-brand-border)] mx-6" />
          <div className="p-6 pt-4 text-sm text-[var(--color-brand-text)]/80">
            <span className="inline-flex items-center gap-2">
              Abrir agenda <ColorEmoji token="siguiente" size={18} />
            </span>
          </div>
        </Link>

        {/* Laboratorio */}
        <Link
          href="/laboratorio"
          className="group rounded-3xl bg-white/95 border border-[var(--color-brand-border)] shadow-[0_10px_30px_rgba(0,0,0,0.06)] hover:shadow-[0_14px_38px_rgba(0,0,0,0.08)] transition overflow-hidden"
        >
          <div className="p-6 flex items-start gap-4">
            <div className="rounded-2xl p-4 border border-[var(--color-brand-border)] bg-[var(--color-brand-background)]">
              <ColorEmoji token="laboratorio" size={28} />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-[var(--color-brand-text)]">Laboratorio</h3>
              <p className="text-[var(--color-brand-bluegray)] mt-1">
                Solicitudes y resultados en un solo lugar.
              </p>
            </div>
          </div>
          <div className="h-px bg-[var(--color-brand-border)] mx-6" />
          <div className="p-6 pt-4 text-sm text-[var(--color-brand-text)]/80">
            <span className="inline-flex items-center gap-2">
              Abrir <ColorEmoji token="siguiente" size={18} />
            </span>
          </div>
        </Link>

        {/* Módulos */}
        <Link
          href="/modulos"
          className="group rounded-3xl bg-white/95 border border-[var(--color-brand-border)] shadow-[0_10px_30px_rgba(0,0,0,0.06)] hover:shadow-[0_14px_38px_rgba(0,0,0,0.08)] transition overflow-hidden"
        >
          <div className="p-6 flex items-start gap-4">
            <div className="rounded-2xl p-4 border border-[var(--color-brand-border)] bg-[var(--color-brand-background)]">
              <ColorEmoji token="carpeta" size={28} />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-[var(--color-brand-text)]">Módulos</h3>
              <p className="text-[var(--color-brand-bluegray)] mt-1">
                Mente, Pulso, Sonrisa y Equilibrio.
              </p>
            </div>
          </div>
          <div className="h-px bg-[var(--color-brand-border)] mx-6" />
          <div className="p-6 pt-4 text-sm text-[var(--color-brand-text)]/80">
            <span className="inline-flex items-center gap-2">
              Ver módulos <ColorEmoji token="siguiente" size={18} />
            </span>
          </div>
        </Link>

        {/* Recordatorios */}
        <Link
          href="/recordatorios"
          className="group rounded-3xl bg-white/95 border border-[var(--color-brand-border)] shadow-[0_10px_30px_rgba(0,0,0,0.06)] hover:shadow-[0_14px_38px_rgba(0,0,0,0.08)] transition overflow-hidden"
        >
          <div className="p-6 flex items-start gap-4">
            <div className="rounded-2xl p-4 border border-[var(--color-brand-border)] bg-[var(--color-brand-background)]">
              <ColorEmoji token="recordatorios" size={28} />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-[var(--color-brand-text)]">
                Recordatorios
              </h3>
              <p className="text-[var(--color-brand-bluegray)] mt-1">
                Confirmaciones y no-show diarios.
              </p>
            </div>
          </div>
          <div className="h-px bg-[var(--color-brand-border)] mx-6" />
          <div className="p-6 pt-4 text-sm text-[var(--color-brand-text)]/80">
            <span className="inline-flex items-center gap-2">
              Abrir <ColorEmoji token="siguiente" size={18} />
            </span>
          </div>
        </Link>

        {/* Banco */}
        <Link
          href="/banco"
          className="group rounded-3xl bg-white/95 border border-[var(--color-brand-border)] shadow-[0_10px_30px_rgba(0,0,0,0.06)] hover:shadow-[0_14px_38px_rgba(0,0,0,0.08)] transition overflow-hidden"
        >
          <div className="p-6 flex items-start gap-4">
            <div className="rounded-2xl p-4 border border-[var(--color-brand-border)] bg-[var(--color-brand-background)]">
              <ColorEmoji token="banco" size={28} />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-[var(--color-brand-text)]">Sanoa Bank</h3>
              <p className="text-[var(--color-brand-bluegray)] mt-1">
                Saldo, depósitos, pagos y facturación.
              </p>
            </div>
          </div>
          <div className="h-px bg-[var(--color-brand-border)] mx-6" />
          <div className="p-6 pt-4 text-sm text-[var(--color-brand-text)]/80">
            <span className="inline-flex items-center gap-2">
              Abrir <ColorEmoji token="siguiente" size={18} />
            </span>
          </div>
        </Link>
      </section>
    </main>
  );
}
