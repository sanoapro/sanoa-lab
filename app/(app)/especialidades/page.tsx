export const metadata = { title: "Especialidades Pro" };

type FeatureKey = "mente" | "pulso" | "equilibrio" | "sonrisa";

type FeaturesResponse = Partial<Record<FeatureKey, boolean>>;

const CARDS: ReadonlyArray<{
  key: FeatureKey;
  title: string;
  emoji: string;
  desc: string;
}> = [
  { key: "mente", title: "Mente Pro", emoji: "🧠", desc: "Evaluaciones, escalas y planes de apoyo." },
  { key: "pulso", title: "Pulso Pro", emoji: "❤️‍🔥", desc: "Indicadores clínicos, semáforos y riesgo CV." },
  { key: "equilibrio", title: "Equilibrio Pro", emoji: "🧘", desc: "Planes de hábitos y seguimiento." },
  { key: "sonrisa", title: "Sonrisa Pro", emoji: "🦷", desc: "Odontograma, presupuestos y firma." },
];

async function getFeatures(): Promise<FeaturesResponse> {
  const url = `${process.env.NEXT_PUBLIC_SITE_URL ?? ""}/api/org/features`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) return {};
  return (await res.json()) as FeaturesResponse;
}

export default async function Page() {
  const features = await getFeatures();

  return (
    <div className="space-y-3">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">
          <span className="emoji">🧩</span> Especialidades
        </h1>
        <a className="glass-btn" href="/banco">
          <span className="emoji">🏦</span> Sanoa Bank
        </a>
      </header>

      <p className="text-contrast/80">
        Especialidades con herramientas avanzadas. Desbloquéalas desde Sanoa Bank.
      </p>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {CARDS.map((card) => {
          const active = Boolean(features?.[card.key]);
          return (
            <div key={card.key} className="glass-card bubble space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="emoji text-2xl">{card.emoji}</span>
                  <div className="font-semibold">{card.title}</div>
                </div>
                <span className={`badge ${active ? "badge-active" : "badge-inactive"}`}>
                  <span className="emoji">{active ? "🟢" : "🔒"}</span>
                  {active ? "Activo" : "Por activar"}
                </span>
              </div>
              <p className="text-sm text-contrast/80">{card.desc}</p>
              <div className="flex gap-2">
                <a className="glass-btn" href={`/modulos/${card.key}`}>
                  <span className="emoji">👀</span> Ver módulo
                </a>
                {!active && (
                  <a className="glass-btn" href={`/banco?unlock=${card.key}`}>
                    <span className="emoji">💎</span> Desbloquear
                  </a>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
