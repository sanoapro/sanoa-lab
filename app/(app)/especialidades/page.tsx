import Link from "next/link";

type FeatureKey = "mente" | "pulso" | "equilibrio" | "sonrisa";

type FeaturesResponse = {
  org_id?: string;
} & Partial<Record<FeatureKey, boolean>>;

async function getFeatures(): Promise<FeaturesResponse> {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "";
  const res = await fetch(`${base}/api/org/features`, { cache: "no-store" });
  if (!res.ok) return {};
  return (await res.json()) as FeaturesResponse;
}

const CARDS: ReadonlyArray<{
  key: FeatureKey;
  title: string;
  desc: string;
  emoji: string;
}> = [
  { key: "mente", title: "Mente Pro", desc: "Evaluaciones, escalas y planes de apoyo.", emoji: "🧠" },
  { key: "pulso", title: "Pulso Pro", desc: "Indicadores clínicos, semáforos y riesgo CV.", emoji: "❤️" },
  { key: "equilibrio", title: "Equilibrio Pro", desc: "Planes de hábitos y seguimiento.", emoji: "🧘" },
  { key: "sonrisa", title: "Sonrisa Pro", desc: "Odontograma, presupuestos y firma.", emoji: "😄" },
];

export default async function Page() {
  const f = await getFeatures();
  const org_id = f?.org_id ?? "";

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-semibold">
        <span className="emoji">🧩</span> Especialidades
      </h1>
      <p className="text-contrast">
        Especialidades con herramientas avanzadas. Desbloquéalas desde Sanoa Bank.
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        {CARDS.map((c) => {
          const active = Boolean(f?.[c.key]);
          return (
            <div key={c.key} className="glass-card bubble space-y-2">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold">
                    <span className="emoji">{c.emoji}</span> {c.title}
                  </h3>
                  <p className="text-sm text-contrast">{c.desc}</p>
                  <p
                    className={`mt-1 text-xs ${
                      active ? "text-green-600 dark:text-green-400" : "text-amber-600 dark:text-amber-400"
                    }`}
                  >
                    {active ? "Activo ✅" : "Por activar 🔒"}
                  </p>
                </div>
                <div className="flex flex-col gap-2">
                  <Link href={`/modulos/${c.key}`} className="glass-btn">
                    <span className="emoji">🔗</span> Ver módulo
                  </Link>
                  {!active && (
                    <Link
                      className="glass-btn neon"
                      href={`/banco?checkout=${c.key}${org_id ? `&org_id=${org_id}` : ""}`}
                    >
                      <span className="emoji">💳</span> Desbloquear
                    </Link>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {!org_id && (
        <div className="glass-card">
          <p>Selecciona una organización activa para poder desbloquear una especialidad.</p>
        </div>
      )}
    </div>
  );
}
