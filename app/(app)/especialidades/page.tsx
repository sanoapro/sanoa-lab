// app/(app)/especialidades/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import AccentHeader from "@/components/ui/AccentHeader";
import ColorEmoji from "@/components/ColorEmoji";
import AnimateIn from "@/components/ui/AnimateIn";
import OrgSwitcherBadge from "@/components/OrgSwitcherBadge";
import { useBankActiveOrg } from "@/hooks/useBankActiveOrg";

const SPECIALTIES = [
  {
    href: "/modulos/mente",
    name: "Mente",
    desc: "Evaluaciones clínicas avanzadas, notas SOAP y seguimiento emocional.",
    token: "mente",
    featureKey: "mente",
  },
  {
    href: "/modulos/pulso",
    name: "Pulso",
    desc: "Indicadores vitales, metas cardiometabólicas y panel de riesgo.",
    token: "pulso",
    featureKey: "pulso",
  },
  {
    href: "/modulos/equilibrio",
    name: "Equilibrio",
    desc: "Planes de hábitos, ejercicios y bitácoras de progreso.",
    token: "equilibrio",
    featureKey: "equilibrio",
  },
  {
    href: "/modulos/sonrisa",
    name: "Sonrisa",
    desc: "Odontograma digital, presupuestos inteligentes y firmas electrónicas.",
    token: "sonrisa",
    featureKey: "sonrisa",
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
    <main className="space-y-8">
      <AnimateIn>
        <AccentHeader
          title="Especialidades Pro"
          subtitle="Activa módulos clínicos avanzados y pruébalos en modo vista previa. Gestiona accesos desde Sanoa Bank."
          emojiToken="carpeta"
        />
      </AnimateIn>

      {!bankReady && (
        <div className="rounded-3xl border border-amber-200 bg-amber-50 p-5 text-sm font-medium text-amber-800 dark:border-amber-300/60 dark:bg-amber-500/10 dark:text-amber-200">
          Primero configura Sanoa Bank para activar estas especialidades.
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-6">
        {SPECIALTIES.map((spec, idx) => {
          const enabled = Boolean(modules?.[spec.featureKey]);
          const locked = !(subActive && enabled && bankReady);
          const checkoutHref = `/banco?checkout=${encodeURIComponent(spec.featureKey)}&org_id=${encodeURIComponent(orgId)}`;
          return (
            <AnimateIn key={spec.featureKey} delay={idx * 60}>
              <div className="glass relative flex h-full flex-col gap-6 rounded-3xl p-6 md:p-8">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <span className="inline-grid h-16 w-16 place-content-center rounded-3xl border border-[var(--color-brand-border)] bg-white/80 text-5xl dark:bg-slate-900/40">
                      <ColorEmoji token={spec.token} className="text-5xl" />
                    </span>
                    <div className="space-y-2">
                      <h2 className="text-2xl font-semibold text-[var(--color-brand-text)] md:text-[28px]">
                        {spec.name}
                      </h2>
                      <p className="text-base leading-relaxed text-[var(--color-brand-text)]/80 dark:text-slate-100/90">
                        {spec.desc}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`rounded-full border px-3 py-1 text-sm font-medium ${
                      locked
                        ? "bg-amber-100 text-amber-800 border-amber-200"
                        : "bg-emerald-100 text-emerald-900 border-emerald-200"
                    }`}
                  >
                    {locked ? "Bloqueada" : "Activa"}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <Link
                    href={spec.href}
                    className={`glass-btn inline-flex items-center gap-2 rounded-full px-5 py-3 text-base font-semibold transition ${
                      locked ? "pointer-events-none opacity-60" : "hover:-translate-y-0.5"
                    }`}
                    aria-disabled={locked}
                    onClick={(e) => {
                      if (locked) e.preventDefault();
                    }}
                  >
                    🚀 Abrir vista previa
                  </Link>
                  <Link
                    href={checkoutHref}
                    className="inline-flex items-center gap-2 rounded-2xl border border-[var(--color-brand-border)] bg-white/80 px-5 py-3 text-base font-semibold text-[var(--color-brand-text)] transition hover:bg-white/95 dark:bg-slate-900/50 dark:text-slate-100 dark:hover:bg-slate-900/70"
                  >
                    {locked ? (
                      <>
                        <span className="emoji">🔓</span> Desbloquear
                      </>
                    ) : (
                      <>
                        <span className="emoji">🏦</span> Gestionar en Bank
                      </>
                    )}
                  </Link>
                </div>

                {locked && (
                  <div className="text-sm text-[var(--color-brand-text)]/70 dark:text-slate-100/80">
                    Requiere suscripción activa. Completa la compra en Sanoa Bank y los accesos se desbloquearán al instante.
                  </div>
                )}

                {loading && idx === 0 && (
                  <div className="text-xs text-[var(--color-brand-text)]/60 dark:text-slate-100/70">
                    Comprobando estado de módulos…
                  </div>
                )}
              </div>
            </AnimateIn>
          );
        })}
      </div>
    </main>
  );
}
