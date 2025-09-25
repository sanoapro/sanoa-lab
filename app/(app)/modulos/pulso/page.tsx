import Link from "next/link";
import ColorEmoji from "@/components/ColorEmoji";
import AccentHeader from "@/components/ui/AccentHeader";

export default function PulsoPage(){
  return (
    <main className="p-6 md:p-10 space-y-8">
      <header className="space-y-2">
        <h1 className="text-3xl md:text-4xl font-semibold text-[var(--color-brand-text)] tracking-tight flex items-center gap-3">
          <ColorEmoji token="agenda" size={32} />
          Pulso
        </h1>
        <p className="text-sm text-[var(--color-brand-text)]/80">
          Suite para medicina general y especialidades: calculadoras, scores, triaje y herramientas clínicas.
        </p>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Tile href="/modulos/pulso/calculadoras" title="Calculadoras" desc="IMC, SC, ClCr, GAP, QTc…" emoji="🧮" />
        <Tile href="/modulos/pulso/scores" title="Scores clínicos" desc="CURB-65, CHA₂DS₂-VASc, HAS-BLED, qSOFA" emoji="📋" />
        <Tile href="/modulos/pulso/triage" title="Triaje" desc="Clasificación por signos vitales" emoji="🚦" />
        <Tile href="/modulos/pulso/herramientas" title="Herramientas" desc="Interacciones y atajos" emoji="🧰" />
      </section>

      <section className="space-y-3">
        <AccentHeader emoji="ℹ️">Aviso</AccentHeader>
        <p className="text-sm text-[var(--color-brand-text)]/70">
          Estas funciones son auxiliares para profesionales. No sustituyen el juicio clínico. Verifica unidades y resultados.
        </p>
      </section>
    </main>
  );
}

function Tile({ href, title, desc, emoji }:{
  href:string; title:string; desc:string; emoji:string;
}){
  return (
    <Link
      href={href}
      className="group rounded-3xl bg-white/95 border border-[var(--color-brand-border)] shadow-[0_10px_30px_rgba(0,0,0,0.06)] hover:shadow-[0_14px_38px_rgba(0,0,0,0.08)] transition overflow-hidden"
    >
      <div className="p-6 flex items-start gap-4">
        <div className="rounded-2xl p-4 border border-[var(--color-brand-border)] bg-[var(--color-brand-background)]">
          <span className="text-2xl">{emoji}</span>
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-[var(--color-brand-text)]">{title}</h3>
          <p className="text-[var(--color-brand-bluegray)] mt-1">{desc}</p>
        </div>
      </div>
      <div className="h-px bg-[var(--color-brand-border)] mx-6" />
      <div className="p-6 pt-4 text-sm text-[var(--color-brand-text)]/80">
        <span className="inline-flex items-center gap-2">
          Abrir <span>➡️</span>
        </span>
      </div>
    </Link>
  );
}
