import ModuleCard from "@/components/ModuleCard";
import { useModuleAccess } from "@/components/modules/useModuleAccess";

export const metadata = { title: "Especialidades" };

const ITEMS = [
  { key: "mente", title: "Mente Pro", desc: "Evaluaciones, escalas y planes de apoyo.", emoji: "🧠" },
  { key: "pulso", title: "Pulso Pro", desc: "Indicadores clínicos, semáforos y riesgo CV.", emoji: "🫀" },
  { key: "equilibrio", title: "Equilibrio Pro", desc: "Planes de hábitos y seguimiento.", emoji: "⚖️" },
  { key: "sonrisa", title: "Sonrisa Pro", desc: "Odontograma, presupuestos y firma.", emoji: "😁" },
] as const;

export default function Page() {
  const { features, orgId } = useModuleAccess();

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">
        <span className="emoji">🧩</span> Especialidades
      </h1>
      <p className="text-sm text-contrast/80">
        Especialidades con herramientas avanzadas. Desbloquea desde Sanoa Bank.
      </p>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {ITEMS.map((item) => {
          const active = !!features?.[item.key];
          const checkoutUrl = orgId
            ? `/banco?checkout=${item.key}&org_id=${orgId}`
            : `/banco?checkout=${item.key}`;

          return (
            <ModuleCard
              key={item.key}
              title={
                <>
                  <span className="emoji">{item.emoji}</span> {item.title}
                </>
              }
              className="bubble space-y-2"
            >
              <p className="text-sm text-contrast/85">{item.desc}</p>
              <div className="flex items-center gap-2">
                {active ? (
                  <span className="glass-btn">
                    <span className="emoji">🟢</span> Activo
                  </span>
                ) : (
                  <a className="glass-btn neon" href={checkoutUrl} title="Desbloquear en Sanoa Bank">
                    <span className="emoji">🔓</span> Desbloquear
                  </a>
                )}
              </div>
            </ModuleCard>
          );
        })}
      </div>
    </div>
  );
}
