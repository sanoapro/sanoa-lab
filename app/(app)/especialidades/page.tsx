// app/(app)/especialidades/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import AccentHeader from "@/components/ui/AccentHeader";
import AnimateIn from "@/components/ui/AnimateIn";
import OrgSwitcherBadge from "@/components/OrgSwitcherBadge";
import { useBankActiveOrg } from "@/hooks/useBankActiveOrg";

type FeatureKey = "mente" | "pulso" | "sonrisa" | "equilibrio";

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

type SubscriptionStatus = {
  ok?: boolean;
  data?: {
    active?: boolean;
    modules?: Record<string, boolean> | null;
    bank_ready?: boolean;
  };
  error?: string;
};

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

export default function EspecialidadesPage() {
  const { orgId, isLoading: orgLoading } = useBankActiveOrg();
  const [status, setStatus] = useState<SubscriptionStatus | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let alive = true;

    if (!orgId) {
      setStatus(null);
      setLoading(false);
      return () => {
        alive = false;
      };
    }

    (async () => {
      try {
        setLoading(true);
        const params = new URLSearchParams({ org_id: orgId });
        const r = await fetch(`/api/billing/subscription/status?${params.toString()}`, {
          cache: "no-store",
        });
        const j = (await r.json()) as SubscriptionStatus;
        if (!alive) return;
        setStatus(j);
      } catch (err) {
        if (!alive) return;
        setStatus({ ok: false, error: (err as Error)?.message });
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [orgId]);

  const modules = useMemo(() => status?.data?.modules || {}, [status]);
  const subActive = Boolean(status?.data?.active);
  const bankReady = Boolean(status?.data?.bank_ready);

  if (orgLoading) {
    return (
      <main className="space-y-8">
        <AnimateIn>
          <AccentHeader
            title="Especialidades Pro"
            subtitle="Activa módulos clínicos avanzados y pruébalos en modo vista previa. Gestiona accesos desde Sanoa Bank."
            emojiToken="carpeta"
          />
        </AnimateIn>
        <div className="glass relative flex flex-col gap-3 rounded-3xl p-6 md:p-8">
          <p className="text-sm text-[var(--color-brand-text)]/70 dark:text-slate-100/80">
            Cargando organizaciones…
          </p>
        </div>
      </main>
    );
  }

  if (!orgId) {
    return (
      <main className="space-y-8">
        <AnimateIn>
          <AccentHeader
            title="Especialidades Pro"
            subtitle="Activa módulos clínicos avanzados y pruébalos en modo vista previa. Gestiona accesos desde Sanoa Bank."
            emojiToken="carpeta"
          />
        </AnimateIn>
        <div className="glass relative flex flex-col gap-4 rounded-3xl p-6 md:p-8 max-w-xl">
          <p className="text-base text-[var(--color-brand-text)]/80 dark:text-slate-100/90">
            Selecciona una organización activa para continuar.
          </p>
          <OrgSwitcherBadge variant="inline" />
          <Link
            href="/organizaciones"
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[var(--color-brand-border)] bg-white/80 px-5 py-3 text-sm font-semibold text-[var(--color-brand-text)] transition hover:bg-white/95 dark:bg-slate-900/50 dark:text-slate-100 dark:hover:bg-slate-900/70"
          >
            Administrar organizaciones
          </Link>
          <p className="text-xs text-[var(--color-brand-text)]/60 dark:text-slate-100/70">
            Tip: también puedes cambiar de organización desde la esquina superior derecha.
          </p>
        </div>
      </main>
    );
  }

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
        {!bankReady && (
          <div className="mt-2 text-sm">
            <span className="emoji mr-1">ℹ️</span>
            Primero configura tu cuenta en{" "}
            <Link className="underline" href="/banco">
              Sanoa Bank
            </Link>{" "}
            para poder desbloquear.
          </div>
        )}
      </div>

      {!bankReady && (
        <div className="rounded-3xl border border-amber-200 bg-amber-50 p-5 text-sm font-medium text-amber-800 dark:border-amber-300/60 dark:bg-amber-500/10 dark:text-amber-200">
          Primero configura Sanoa Bank para activar estas especialidades.
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {CATALOG.map((item) => {
          const active = Boolean(modules[item.key]);
          const unlockHref = bankReady
            ? `/banco?checkout=${encodeURIComponent(item.key)}&org_id=${encodeURIComponent(orgId)}`
            : "/banco";
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
            const active = Boolean(modules[m.key]);
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
