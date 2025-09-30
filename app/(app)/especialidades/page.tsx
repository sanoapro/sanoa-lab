import Link from "next/link";

type FeatureKey = "mente" | "pulso" | "sonrisa" | "equilibrio";

async function getActiveOrgId(): Promise<string | null> {
  try {
    const { cookies } = await import("next/headers");
    const cookieStore = await cookies();
    return cookieStore.get("org_id")?.value ?? null;
  } catch {
    return null;
  }
}

async function fetchOrgFeatures(orgId: string) {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_SITE_URL ?? ""}/api/orgs/features/check?org_id=${encodeURIComponent(orgId)}`,
      {
        cache: "no-store",
        headers: { "x-requested-from": "especialidades-page" },
      },
    );
    if (!res.ok) throw new Error("fetch features failed");
    const json = await res.json();
    const features = (json?.features ?? {}) as Partial<Record<FeatureKey, boolean>>;
    const bank_ready = Boolean(json?.bank_ready);
    return { features, bank_ready };
  } catch {
    return { features: {} as Partial<Record<FeatureKey, boolean>>, bank_ready: false };
  }
}

const CATALOG: Array<{
  key: FeatureKey;
  title: string;
  emoji: string;
  description: string;
  viewHref: string;
}> = [
  {
    key: "mente",
    title: "Mente Pro",
    emoji: "🧠",
    description: "Evaluaciones, escalas (PHQ-9, GAD-7) y planes de apoyo.",
    viewHref: "/modulos?tab=mente",
  },
  {
    key: "pulso",
    title: "Pulso Pro",
    emoji: "🫀",
    description: "Indicadores clínicos, semáforos y riesgo CV.",
    viewHref: "/modulos?tab=pulso",
  },
  {
    key: "equilibrio",
    title: "Equilibrio Pro",
    emoji: "🧘",
    description: "Planes de hábitos, seguimiento y check-ins.",
    viewHref: "/modulos?tab=equilibrio",
  },
  {
    key: "sonrisa",
    title: "Sonrisa Pro",
    emoji: "🦷",
    description: "Odontograma, presupuestos y firma digital.",
    viewHref: "/modulos?tab=sonrisa",
  },
];

function StatusChip({ active }: { active: boolean }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
        active
          ? "bg-emerald-500/10 text-emerald-600 ring-1 ring-emerald-500/20"
          : "bg-amber-500/10 text-amber-600 ring-1 ring-amber-500/20"
      }`}
    >
      {active ? "Activa" : "Bloqueada"}
    </span>
  );
}

export default async function Page() {
  const orgId = await getActiveOrgId();
  if (!orgId) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold">
          <span className="emoji">🧩</span> Especialidades
        </h1>
        <div className="glass-card">
          <p className="mb-3">
            Selecciona una organización activa para ver y gestionar tus Especialidades Pro.
          </p>
          <div className="mt-2">
            <Link href="/dashboard" className="glass-btn">
              <span className="emoji mr-1">🏷️</span> Elegir organización
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const { features, bank_ready } = await fetchOrgFeatures(orgId);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">
          <span className="emoji">🧩</span> Especialidades
        </h1>
        <div className="flex items-center gap-2">
          <Link href="/banco" className="glass-btn">
            <span className="emoji mr-1">🏦</span> Sanoa Bank
          </Link>
          <Link href="/modulos" className="glass-btn">
            <span className="emoji mr-1">📚</span> Ver módulos
          </Link>
        </div>
      </div>

      <div className="glass-card">
        <p className="text-sm text-contrast mb-2">
          Activa sólo lo que necesites. <strong>Las Especialidades Pro se habilitan a través de Sanoa Bank</strong> y
          puedes cambiarlas en cualquier momento.
        </p>
        {!bank_ready && (
          <div className="mt-2 text-sm">
            <span className="emoji mr-1">ℹ️</span>
            Primero configura tu cuenta en <Link className="underline" href="/banco">Sanoa Bank</Link> para poder
            desbloquear.
          </div>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {CATALOG.map((item) => {
          const active = Boolean(features[item.key]);
          const unlockHref = bank_ready ? `/banco?checkout=${item.key}&org_id=${orgId}` : "/banco";
          return (
            <div key={item.key} className="glass-card bubble">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-semibold">
                    <span className="emoji mr-2">{item.emoji}</span>
                    {item.title}
                  </h3>
                  <p className="mt-1 text-sm text-contrast/90">{item.description}</p>
                </div>
                <StatusChip active={active} />
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                <Link href={item.viewHref} className="glass-btn">
                  <span className="emoji mr-1">👀</span> Ver módulo
                </Link>
                {active ? (
                  <Link href="/banco" className="glass-btn">
                    <span className="emoji mr-1">🧾</span> Gestionar en Bank
                  </Link>
                ) : (
                  <Link href={unlockHref} className="glass-btn neon">
                    <span className="emoji mr-1">🔓</span> Desbloquear con Sanoa Bank
                  </Link>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="glass-card">
        <h4 className="font-medium mb-1">
          <span className="emoji mr-1">🧾</span> Suscripciones
        </h4>
        <p className="text-sm text-contrast mb-3">
          Resumen rápido de tus estados para <span className="font-medium">esta organización</span>.
        </p>
        <ul className="grid sm:grid-cols-2 lg:grid-cols-4 gap-2">
          {CATALOG.map((m) => {
            const active = Boolean(features[m.key]);
            return (
              <li key={m.key} className="flex items-center justify-between glass-subtle px-3 py-2 rounded-xl">
                <div className="flex items-center gap-2">
                  <span className="emoji">{m.emoji}</span>
                  <span className="text-sm">{m.title.replace(" Pro", "")}</span>
                </div>
                <StatusChip active={active} />
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
