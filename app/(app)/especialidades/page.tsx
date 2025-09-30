import Link from "next/link";
import ModuleCard from "@/components/ModuleCard";
import { ModuleGate } from "@/components/modules/ModuleGate";

const modules = [
  { key: "mente", title: "Mente Pro", desc: "Evaluaciones, escalas y planes de apoyo.", emoji: "🧠" },
  { key: "pulso", title: "Pulso Pro", desc: "Indicadores clínicos, semáforos y riesgo CV.", emoji: "🫀" },
  { key: "equilibrio", title: "Equilibrio Pro", desc: "Planes de hábitos y seguimiento.", emoji: "⚖️" },
  { key: "sonrisa", title: "Sonrisa Pro", desc: "Odontograma, presupuestos y firma.", emoji: "😄" },
];

export default function Page() {
  return (
    <div className="space-y-6">
      <header className="flex items-center gap-3">
        <h1 className="text-2xl font-semibold"><span className="emoji">🧩</span> Especialidades</h1>
        <Link href="/banco" className="glass-btn ml-auto">Desbloquear en Sanoa Bank</Link>
      </header>

      <p className="text-sm text-slate-600 dark:text-slate-300">
        Especialidades con herramientas avanzadas. <b>Desbloquea</b> módulos desde <Link href="/banco" className="underline">Sanoa Bank</Link>.
      </p>

      <div className="grid gap-4 md:grid-cols-2">
        {modules.map((m) => (
          <ModuleGate key={m.key} feature={m.key}>
            <ModuleCard
              title={`${m.emoji} ${m.title}`}
              description={m.desc}
              ctas={[
                { label: "Ver módulo", href: `/modulos/${m.key}` },
                { label: "Desbloquear", href: "/banco" },
              ]}
            />
          </ModuleGate>
        ))}
      </div>

      <div className="glass-card text-sm">
        <h2 className="font-medium mb-2"><span className="emoji">🔓</span> Suscripciones</h2>
        <p>Estado por módulo: <i>activo</i> / <i>por activar</i>. Para activar, usa el botón “Desbloquear”.</p>
      </div>
    </div>
  );
}
