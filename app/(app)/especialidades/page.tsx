// app/(app)/especialidades/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import AccentHeader from "@/components/ui/AccentHeader";
import ColorEmoji from "@/components/ColorEmoji";
import AnimateIn from "@/components/ui/AnimateIn";

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
  };
};

export default function EspecialidadesPage() {
  const [status, setStatus] = useState<SubscriptionStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [orgId] = useState<string>(() =>
    typeof window !== "undefined" ? window.localStorage.getItem("org_id") || "" : "",
  );

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        if (!orgId) {
          if (!alive) return;
          setStatus({ ok: false, data: { active: false, modules: {} } });
          return;
        }

        const params = new URLSearchParams({ org_id: orgId });
        const r = await fetch(`/api/billing/subscription/status?${params.toString()}`, {
          cache: "no-store",
        });
        if (!r.ok) {
          if (!alive) return;
          setStatus({ ok: false, data: { active: false, modules: {} } });
          return;
        }

        const j = (await r.json()) as SubscriptionStatus;
        if (!alive) return;
        setStatus({ ok: j?.ok ?? true, data: j?.data });
      } catch (err) {
        if (!alive) return;
        setStatus({ ok: false, data: { active: false, modules: {} } });
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [orgId]);

  const bankReady = status ? status.ok !== false : false;
  const modules = bankReady ? status?.data?.modules || {} : {};
  const subActive = bankReady && Boolean(status?.data?.active);

  return (
    <main className="space-y-8">
      <AnimateIn>
        <AccentHeader
          title="Especialidades Pro"
          subtitle="Activa módulos clínicos avanzados y pruébalos en modo vista previa. Gestiona accesos desde Sanoa Bank."
          emojiToken="carpeta"
        />
      </AnimateIn>

      {!loading && status?.ok === false && (
        <AnimateIn>
          <div className="glass rounded-3xl border border-[var(--color-brand-border)] bg-white/95 p-6 text-[var(--color-brand-text)] shadow-[0_10px_30px_rgba(0,0,0,0.05)] dark:bg-slate-900/70 dark:text-slate-100">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h3 className="text-lg font-semibold">Configura Sanoa Bank para desbloquear especialidades</h3>
                <p className="text-sm text-[var(--color-brand-text)]/70 dark:text-slate-100/80">
                  Necesitas completar la configuración de Sanoa Bank antes de activar los módulos Pro en tu organización.
                </p>
              </div>
              <Link
                href="/banco"
                className="inline-flex items-center gap-2 rounded-2xl border border-emerald-400 bg-emerald-300 px-5 py-2 font-semibold text-emerald-950 shadow-[0_0_18px_rgba(52,211,153,0.55)] transition hover:-translate-y-0.5 hover:shadow-[0_0_26px_rgba(52,211,153,0.75)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-400"
              >
                Desbloquear con Sanoa Bank
              </Link>
            </div>
          </div>
        </AnimateIn>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-6">
        {SPECIALTIES.map((spec, idx) => {
          const enabled = Boolean(modules?.[spec.featureKey]);
          const locked = !(subActive && enabled);
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
                    href={`/banco?module=${encodeURIComponent(spec.featureKey)}`}
                    className="inline-flex items-center gap-2 rounded-2xl border border-[var(--color-brand-border)] bg-white/80 px-5 py-3 text-base font-semibold text-[var(--color-brand-text)] transition hover:bg-white/95 dark:bg-slate-900/50 dark:text-slate-100 dark:hover:bg-slate-900/70"
                  >
                    <span className="emoji">🏦</span> Gestionar en Bank
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
