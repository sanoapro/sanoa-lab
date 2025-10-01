"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import AccentHeader from "@/components/ui/AccentHeader";
import ColorEmoji from "@/components/ColorEmoji";
import StarterTips from "@/components/modules/StarterTips";

type QuickAction = {
  href: string;
  label: string;
  emojiToken?: string;
};

type ModuleInfo = {
  token: string;
  name: string;
  tagline: string;
  description: string;
  emojiToken: string;
  href: string;
  features: string[];
  quickActions: QuickAction[];
  tips: string[];
  tipActions?: { href: string; label: string }[];
  bankHref: string;
};

const MODULES: ModuleInfo[] = [
  {
    token: "mente",
    name: "Mente",
    tagline: "Evaluaciones, escalas y planes.",
    description: "Evaluaciones (PHQ-9, GAD-7), seguimiento y planes clínicos personalizados.",
    emojiToken: "mente",
    href: "/modulos/mente",
    features: [
      "Aplicación de escalas estandarizadas con puntajes automáticos.",
      "Notas SOAP con planes de seguimiento longitudinal.",
      "Recordatorios programados y reportes de adherencia a seguimiento.",
    ],
    quickActions: [
      { href: "/prescriptions/templates", label: "Receta / Plantillas", emojiToken: "recetas" },
      { href: "/api/forms/templates", label: "PHQ-9 / GAD-7" },
      { href: "/recordatorios", label: "Recordatorio post-cita" },
    ],
    tips: [
      "Crea plantillas de notas y recetas para acelerar tu consulta.",
      "Configura recordatorios de seguimiento a 7 y 30 días.",
      "Activa reportes semanales de adherencia desde Reportes › Programación.",
    ],
    tipActions: [
      { href: "/reportes/programacion", label: "Programar reportes" },
      { href: "/recordatorios/plantillas", label: "Plantillas de recordatorios" },
    ],
    bankHref: "/banco?module=mente",
  },
  {
    token: "pulso",
    name: "Pulso",
    tagline: "Semáforos, cálculos y riesgo CV.",
    description: "Indicadores clínicos, semáforos y riesgo cardiovascular con alertas automáticas.",
    emojiToken: "pulso",
    href: "/modulos/pulso",
    features: [
      "Seguimiento longitudinal de metas cardiometabólicas.",
      "Paneles de semáforos y reportes de cohortes de alto riesgo.",
      "Calculadoras integradas para IMC, riesgo CV y QTc.",
    ],
    quickActions: [
      { href: "/modulos/pulso/calculadoras/imc", label: "IMC" },
      { href: "/modulos/pulso/calculadoras/cvd", label: "Riesgo CV" },
      { href: "/reportes/rapidos", label: "Semáforos (rápidos)" },
    ],
    tips: [
      "Define rangos de referencia por grupo etario en Ajustes del módulo.",
      "Activa alertas por valores críticos vía Recordatorios.",
      "Usa vistas guardadas de Pacientes para cohortes con riesgo alto.",
    ],
    tipActions: [
      { href: "/saved-views", label: "Vistas guardadas" },
      { href: "/recordatorios", label: "Configurar alertas" },
    ],
    bankHref: "/banco?module=pulso",
  },
  {
    token: "equilibrio",
    name: "Equilibrio",
    tagline: "Hábitos y seguimiento.",
    description: "Planes de hábitos, tareas y seguimiento con indicadores de adherencia.",
    emojiToken: "equilibrio",
    href: "/modulos/equilibrio",
    features: [
      "Planes personalizables con metas de hábitos y rutinas.",
      "Seguimiento longitudinal con tareas y confirmaciones.",
      "Alertas y reportes cuando la adherencia disminuye.",
    ],
    quickActions: [
      { href: "/modulos/equilibrio/planes/nuevo", label: "Nuevo plan de hábitos" },
      { href: "/recordatorios/plantillas", label: "Tareas programadas" },
      { href: "/reportes/overview", label: "Panel longitudinal" },
    ],
    tips: [
      "Crea plantillas de planes reutilizables por especialidad.",
      "Mide adherencia con confirmaciones por WhatsApp.",
      "Configura alertas cuando la adherencia baje del 60%.",
    ],
    tipActions: [
      { href: "/recordatorios", label: "Notificaciones" },
      { href: "/reportes/confirmaciones", label: "Adherencia" },
    ],
    bankHref: "/banco?module=equilibrio",
  },
  {
    token: "sonrisa",
    name: "Sonrisa",
    tagline: "Odontograma y presupuestos.",
    description: "Odontograma digital, presupuestos y documentos con membrete y firma electrónica.",
    emojiToken: "sonrisa",
    href: "/modulos/sonrisa",
    features: [
      "Odontograma con historial por pieza y fotografías clínicas.",
      "Presupuestos inteligentes con plantillas y firmas electrónicas.",
      "Documentos y recetas con membrete, integrados a recordatorios.",
    ],
    quickActions: [
      { href: "/modulos/sonrisa/odontograma/nuevo", label: "Nuevo odontograma" },
      { href: "/modulos/sonrisa/presupuestos/nuevo", label: "Nuevo presupuesto" },
      { href: "/prescriptions/templates", label: "Receta con membrete", emojiToken: "recetas" },
    ],
    tips: [
      "Carga tu membrete y firma en Ajustes para documentos y recetas.",
      "Activa plantillas por procedimiento para agilizar presupuestos.",
      "Comparte PDF con enlaces firmados y expiración corta.",
    ],
    tipActions: [
      { href: "/ajustes", label: "Subir membrete/firma" },
      { href: "/export/metrics/by-tag", label: "Top procedimientos" },
    ],
    bankHref: "/banco?module=sonrisa",
  },
];

const MODULE_TOKENS = new Set(MODULES.map((m) => m.token));

export default function ModulosHubPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const fallbackTab = MODULES[0]?.token ?? "";
  const queryTab = searchParams.get("tab") || undefined;

  // Tab activa derivada de la URL (fuente de verdad)
  const activeTab = React.useMemo(() => {
    if (queryTab && MODULE_TOKENS.has(queryTab)) return queryTab;
    return fallbackTab;
  }, [queryTab, fallbackTab]);

  // Si el queryTab es inválido, reescribe a fallback (una sola vez por cambio)
  React.useEffect(() => {
    if (!queryTab) return;
    if (!MODULE_TOKENS.has(queryTab) && fallbackTab) {
      const params = new URLSearchParams(searchParams.toString());
      params.set("tab", fallbackTab);
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    }
  }, [queryTab, fallbackTab, pathname, router, searchParams]);

  const handleSelect = React.useCallback(
    (token: string) => {
      if (!MODULE_TOKENS.has(token)) return;
      if (token === queryTab) return; // evita replace innecesario
      const params = new URLSearchParams(searchParams.toString());
      params.set("tab", token);
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams, queryTab]
  );

  const activeModule = React.useMemo(
    () => MODULES.find((m) => m.token === activeTab) ?? MODULES[0],
    [activeTab]
  );

  return (
    <main className="p-6 md:p-10 space-y-8">
      <AccentHeader
        title="Especialidades"
        subtitle="Explora los módulos clínicos avanzados, revisa qué incluye cada uno y abre su vista previa."
        emojiToken="carpeta"
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,260px)_1fr]">
        <nav
          className="flex flex-col gap-3"
          aria-label="Módulos"
          role="tablist"
          aria-orientation="vertical"
        >
          {MODULES.map((module) => {
            const tabId = `module-${module.token}`;
            const isActive = module.token === activeModule.token;
            return (
              <button
                key={module.token}
                id={`${tabId}-tab`}
                type="button"
                role="tab"
                aria-controls={`${tabId}-panel`}
                aria-selected={isActive}
                onClick={() => handleSelect(module.token)}
                onKeyDown={(e) => {
                  // Navegación con flechas ↑/↓
                  if (e.key === "ArrowDown" || e.key === "ArrowUp") {
                    e.preventDefault();
                    const idx = MODULES.findIndex((m) => m.token === activeModule.token);
                    const nextIdx =
                      e.key === "ArrowDown"
                        ? Math.min(MODULES.length - 1, idx + 1)
                        : Math.max(0, idx - 1);
                    handleSelect(MODULES[nextIdx].token);
                  }
                }}
                className={`rounded-3xl border bg-white/90 px-4 py-3 text-left transition focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500 ${
                  isActive
                    ? "border-blue-200 bg-blue-50/70 shadow"
                    : "hover:border-blue-200 hover:bg-blue-50/40"
                }`}
              >
                <div className="flex items-start gap-3">
                  <span className="inline-grid h-11 w-11 place-content-center rounded-2xl border bg-white/80">
                    <ColorEmoji token={module.emojiToken} className="text-2xl" />
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-[var(--color-brand-text)]">
                        {module.name}
                      </span>
                      <span className="rounded-full border border-violet-200 bg-violet-100 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-violet-800">
                        Pro
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-slate-600">{module.tagline}</p>
                  </div>
                </div>
              </button>
            );
          })}
        </nav>

        <section
          role="tabpanel"
          id={`module-${activeModule.token}-panel`}
          aria-labelledby={`module-${activeModule.token}-tab`}
          className="space-y-6"
        >
          <div className="rounded-3xl border bg-white/95 p-6 space-y-6 shadow-sm">
            <header className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex items-start gap-4">
                <span className="inline-grid h-16 w-16 place-content-center rounded-3xl border bg-white/90">
                  <ColorEmoji token={activeModule.emojiToken} className="text-4xl" />
                </span>
                <div>
                  <h2 className="text-2xl font-semibold text-[var(--color-brand-text)] md:text-[28px]">
                    {activeModule.name}
                  </h2>
                  <p className="mt-1 text-sm text-[var(--color-brand-text)]/75 md:text-base">
                    {activeModule.description}
                  </p>
                </div>
              </div>
              <span className="rounded-full border border-emerald-200 bg-emerald-100 px-3 py-1 text-sm font-semibold text-emerald-800">
                Vista previa disponible
              </span>
            </header>

            <div className="flex flex-wrap items-center gap-3">
              <Link
                href={activeModule.href}
                className="inline-flex items-center gap-2 rounded-2xl bg-[var(--color-brand-text)] px-5 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5"
              >
                🚀 Abrir módulo
              </Link>
              <Link
                href={activeModule.bankHref}
                className="inline-flex items-center gap-2 rounded-2xl border border-[var(--color-brand-border)] bg-white/80 px-5 py-3 text-sm font-semibold text-[var(--color-brand-text)] transition hover:bg-white"
              >
                <ColorEmoji token="banco" className="text-base" /> Gestionar en Bank
              </Link>
            </div>

            {activeModule.features.length > 0 && (
              <section className="rounded-3xl border bg-white/95 p-5">
                <h3 className="font-semibold text-[var(--color-brand-text)]">Lo que incluye</h3>
                <ul className="mt-3 space-y-2 list-disc pl-5 text-sm text-slate-700">
                  {activeModule.features.map((feature) => (
                    <li key={feature}>{feature}</li>
                  ))}
                </ul>
              </section>
            )}

            {activeModule.quickActions.length > 0 && (
              <section className="rounded-3xl border bg-white/95 p-5">
                <h3 className="font-semibold text-[var(--color-brand-text)]">Acciones rápidas</h3>
                <div className="mt-3 flex flex-wrap gap-2">
                  {activeModule.quickActions.map((action) => (
                    <Link
                      key={`${activeModule.token}-${action.href}`}
                      href={action.href}
                      className="inline-flex items-center gap-2 rounded-2xl border border-[var(--color-brand-border)] bg-white px-3 py-2 text-sm text-[var(--color-brand-text)] transition hover:bg-slate-50"
                    >
                      {action.emojiToken && (
                        <ColorEmoji token={action.emojiToken} className="text-base" />
                      )}
                      {action.label}
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {activeModule.tips.length > 0 && (
              <StarterTips tips={activeModule.tips} actions={activeModule.tipActions} />
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
