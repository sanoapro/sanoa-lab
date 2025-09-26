import Link from "next/link";
import ColorEmoji from "@/components/ColorEmoji";

export default function ModulosIndexPage(){
  return (
    <main className="p-6 md:p-10 space-y-8">
      <header className="space-y-2">
        <h1 className="text-3xl md:text-4xl font-semibold text-[var(--color-brand-text)] tracking-tight flex items-center gap-3">
          <ColorEmoji token="carpeta" size={32} />
          Módulos
        </h1>
        <p className="text-sm text-[var(--color-brand-text)]/80">
          Acceso rápido a las suites de especialidad.
        </p>
      </header>

      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
        <ModuleCard href="/modulos/mente" title="Mente" desc="Evaluaciones y seguimiento" token="mente" />
        <ModuleCard href="/modulos/pulso" title="Pulso" desc="Calculadoras, triaje, auxiliares" token="pulso" />
        <ModuleCard href="/modulos/sonrisa" title="Sonrisa" desc="Odontograma y presupuesto" token="sonrisa" />
        <ModuleCard href="/modulos/equilibrio" title="Equilibrio" desc="Sesiones SOAP y plan" token="equilibrio" />
      </section>
    </main>
  );
}

function ModuleCard({ href, title, desc, token }:{
  href:string; title:string; desc:string; token:string;
}){
  return (
    <Link
      href={href}
      className="group rounded-3xl bg-white/95 border border-[var(--color-brand-border)] shadow-[0_10px_30px_rgba(0,0,0,0.06)] hover:shadow-[0_14px_38px_rgba(0,0,0,0.08)] transition overflow-hidden"
    >
      <div className="p-6 flex items-start gap-4">
        <div className="rounded-2xl p-4 border border-[var(--color-brand-border)] bg-[var(--color-brand-background)]">
          <ColorEmoji token={token} size={28} />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-[var(--color-brand-text)]">{title}</h3>
          <p className="text-[var(--color-brand-bluegray)] mt-1">{desc}</p>
        </div>
      </div>
      <div className="h-px bg-[var(--color-brand-border)] mx-6" />
      <div className="p-6 pt-4 text-sm text-[var(--color-brand-text)]/80">
        <span className="inline-flex items-center gap-2">
          Abrir <ColorEmoji token="siguiente" size={18} />
        </span>
      </div>
    </Link>
  );
}
