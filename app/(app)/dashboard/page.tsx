// app/(app)/dashboard/page.tsx
import InstallPrompt from "@/components/InstallPrompt";
import Link from "next/link";
import ColorEmoji from "@/components/ColorEmoji";

export const metadata = {
  title: "Tablero",
  description: "Accesos rápidos a tus funciones principales.",
};

type CardProps = {
  href: string;
  title: string;
  description: string;
  cta: string;
  emojiToken:
    | "tablero"
    | "pacientes"
    | "agenda"
    | "laboratorio"
    | "carpeta"
    | "recordatorios"
    | "banco"
    | "siguiente";
};

function DashboardCard({ href, title, description, cta, emojiToken }: CardProps) {
  return (
    <Link
      href={href}
      className="group rounded-3xl bg-white/95 border border-[var(--color-brand-border)] shadow-[0_10px_30px_rgba(0,0,0,0.06)] hover:shadow-[0_14px_38px_rgba(0,0,0,0.08)] transition overflow-hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-blue)]"
      aria-label={`${title}: ${description}`}
    >
      <div className="p-6 flex items-start gap-4">
        <div className="rounded-2xl p-4 border border-[var(--color-brand-border)] bg-[var(--color-brand-background)]">
          <ColorEmoji token={emojiToken} size={28} />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-[var(--color-brand-text)]">{title}</h3>
          <p className="text-[var(--color-brand-bluegray)] mt-1">{description}</p>
        </div>
      </div>
      <div className="h-px bg-[var(--color-brand-border)] mx-6" />
      <div className="p-6 pt-4 text-sm text-[var(--color-brand-text)]/80">
        <span className="inline-flex items-center gap-2">
          {cta} <ColorEmoji token="siguiente" size={18} />
        </span>
      </div>
    </Link>
  );
}

export default function TableroPage() {
  return (
    <main className="p-6 md:p-10 space-y-8">
      {/* Prompt para instalar PWA (client component) */}
      <InstallPrompt />

      <header className="space-y-2" role="region" aria-labelledby="tablero-heading">
        <h1
          id="tablero-heading"
          className="text-3xl md:text-4xl font-semibold text-[var(--color-brand-text)] tracking-tight flex items-center gap-3"
        >
          <ColorEmoji token="tablero" size={32} />
          Tablero
        </h1>
        <p className="text-sm text-[var(--color-brand-text)]/80">
          Accesos rápidos a tus funciones principales.
        </p>
      </header>

      <section
        className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6"
        role="region"
        aria-label="Accesos rápidos"
      >
        <DashboardCard
          href="/pacientes"
          title="Pacientes"
          description="Busca, registra y gestiona expedientes."
          cta="Entrar"
          emojiToken="pacientes"
        />

        <DashboardCard
          href="/agenda"
          title="Agenda"
          description="Crea y vincula citas fácilmente."
          cta="Abrir agenda"
          emojiToken="agenda"
        />

        <DashboardCard
          href="/laboratorio"
          title="Laboratorio"
          description="Solicitudes y resultados en un solo lugar."
          cta="Abrir"
          emojiToken="laboratorio"
        />

        <DashboardCard
          href="/modulos"
          title="Módulos"
          description="Mente, Pulso, Sonrisa y Equilibrio."
          cta="Ver módulos"
          emojiToken="carpeta"
        />

        <DashboardCard
          href="/recordatorios"
          title="Recordatorios"
          description="Confirmaciones y no-show diarios."
          cta="Abrir"
          emojiToken="recordatorios"
        />

        <DashboardCard
          href="/banco"
          title="Sanoa Bank"
          description="Saldo, depósitos, pagos y facturación."
          cta="Abrir"
          emojiToken="banco"
        />
      </section>
    </main>
  );
}
