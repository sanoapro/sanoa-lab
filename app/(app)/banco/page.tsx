"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import AccentHeader from "@/components/ui/AccentHeader";
import ColorEmoji from "@/components/ColorEmoji";
import OrgSwitcherBadge from "@/components/OrgSwitcherBadge";
import { useToast } from "@/components/Toast";
import { useBankActiveOrg } from "@/hooks/useBankActiveOrg";

const MODULE_DEFS: Array<{
  key: string;
  label: string;
  desc: string;
  token: string;
}> = [
  {
    key: "mente",
    label: "Mente Pro",
    desc: "Evaluaciones clínicas, notas SOAP y seguimiento emocional.",
    token: "mente",
  },
  {
    key: "equilibrio",
    label: "Equilibrio Pro",
    desc: "Planes de hábitos, ejercicios y check-ins automatizados.",
    token: "equilibrio",
  },
  {
    key: "sonrisa",
    label: "Sonrisa Pro",
    desc: "Odontograma digital, presupuestos y firmas electrónicas.",
    token: "sonrisa",
  },
];

type ModulesStatus = { active: boolean; modules: Record<string, boolean> };

function cents(n: number) {
  return (n / 100).toLocaleString("es-MX", { style: "currency", currency: "MXN" });
}

export default function BancoPage() {
  const { orgId, isLoading } = useBankActiveOrg();
  const { toast } = useToast();
  const [modulesStatus, setModulesStatus] = useState<ModulesStatus>({
    active: false,
    modules: {},
  });
  const [loadingModules, setLoadingModules] = useState(false);

  const hasModulesInfo = useMemo(
    () => Object.keys(modulesStatus.modules).length > 0,
    [modulesStatus.modules],
  );

  useEffect(() => {
    if (!orgId) {
      setModulesStatus({ active: false, modules: {} });
      return;
    }
    void refreshModules();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orgId]);

  async function refreshModules() {
    if (!orgId) return;
    setLoadingModules(true);
    try {
      const params = new URLSearchParams({ org_id: orgId });
      const res = await fetch(`/api/billing/subscription/status?${params.toString()}`, {
        cache: "no-store",
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json) {
        throw new Error(json?.error ?? "No se pudo obtener el estado de módulos");
      }
      setModulesStatus({
        active: Boolean(json?.data?.active),
        modules: (json?.data?.modules as Record<string, boolean> | undefined) ?? {},
      });
    } catch (error: any) {
      toast({
        variant: "error",
        title: "No se pudieron cargar las activaciones",
        description: error?.message ?? "Intenta nuevamente más tarde.",
      });
    } finally {
      setLoadingModules(false);
    }
  }

  if (isLoading) {
    return (
      <main className="p-6 md:p-10">
        <div className="glass-card p-6 max-w-md space-y-2">
          <div className="h-6 w-48 rounded bg-white/50" />
          <div className="h-4 w-64 rounded bg-white/40" />
          <div className="h-4 w-40 rounded bg-white/40" />
        </div>
      </main>
    );
  }

  if (!orgId) {
    return (
      <main className="p-6 md:p-10">
        <div className="glass-card p-6 max-w-lg space-y-4">
          <div>
            <h1 className="text-2xl font-semibold">Sanoa Bank</h1>
            <p className="text-sm text-[var(--color-brand-text)]/70">
              Selecciona una organización activa para acceder a saldos, activaciones y reportes.
            </p>
          </div>
          <OrgSwitcherBadge variant="inline" />
          <Link
            href="/organizaciones"
            className="inline-flex items-center justify-center gap-2 rounded-xl border px-3 py-2 text-sm hover:shadow-sm"
          >
            Administrar organizaciones
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="p-6 md:p-10 space-y-8">
      <AccentHeader
        title="Sanoa Bank"
        subtitle="Centraliza tu saldo, depósitos, pagos y activaciones de módulos."
        emojiToken="banco"
      />

      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link href="/banco/tx" className="glass-card p-6 transition hover:shadow-lg">
          <h3 className="font-semibold inline-flex items-center gap-2">
            <ColorEmoji token="banco" /> Transacciones
          </h3>
          <p className="mt-2 text-sm text-[var(--color-brand-bluegray)]">
            Explora, filtra y exporta tus movimientos. Acciones masivas y conciliación.
          </p>
          <span className="inline-flex mt-3 px-3 py-1.5 rounded-lg border text-sm bg-white/60">
            Abrir tabla
          </span>
        </Link>

        <Link href="/banco/reglas" className="glass-card p-6 transition hover:shadow-lg">
          <h3 className="font-semibold inline-flex items-center gap-2">
            <ColorEmoji token="carpeta" /> Reglas
          </h3>
          <p className="mt-2 text-sm text-[var(--color-brand-bluegray)]">
            Clasificación automática por texto, categoría y tags con prioridad.
          </p>
          <span className="inline-flex mt-3 px-3 py-1.5 rounded-lg border text-sm bg-white/60">
            Gestionar reglas
          </span>
        </Link>

        <Link href="/banco/presupuestos" className="glass-card p-6 transition hover:shadow-lg">
          <h3 className="font-semibold inline-flex items-center gap-2">
            <ColorEmoji token="plan" /> Presupuestos
          </h3>
          <p className="mt-2 text-sm text-[var(--color-brand-bluegray)]">
            Define montos por categoría y mes para controlar desvíos.
          </p>
          <span className="inline-flex mt-3 px-3 py-1.5 rounded-lg border text-sm bg-white/60">
            Configurar mes
          </span>
        </Link>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-card p-6">
          <h3 className="font-semibold">Saldo</h3>
          <p className="mt-2 text-3xl tracking-tight">{cents(0)}</p>
          <p className="text-sm text-[var(--color-brand-bluegray)] mt-1">
            Disponible para compras de módulos y créditos de mensajes.
          </p>
          <div className="mt-4 flex gap-2">
            <Link
              href="/banco/ajustes"
              className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-[var(--color-brand-blue)] text-white"
            >
              <ColorEmoji token="ajustes" /> Ajustes
            </Link>
            <Link
              href="/api/billing/stripe/checkout/add-funds"
              className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border bg-white/70"
            >
              <ColorEmoji token="pago" /> Añadir fondos
            </Link>
          </div>
        </div>

        <div className="glass-card p-6">
          <h3 className="font-semibold">Reportes</h3>
          <p className="text-sm text-[var(--color-brand-bluegray)] mt-2">
            Flujo mensual y P&amp;L. Programa envíos recurrentes.
          </p>
          <div className="mt-4 flex gap-2">
            <Link
              href="/banco/reportes"
              className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border bg-white/70"
            >
              <ColorEmoji token="reportes" /> Ver reportes
            </Link>
            <Link
              href="/api/bank/ledger/export"
              className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border bg-white/70"
            >
              <ColorEmoji token="exportar" /> Exportar CSV
            </Link>
          </div>
        </div>

        <div className="glass-card p-6 space-y-3">
          <div className="flex items-start gap-3">
            <span className="rounded-2xl p-3 border border-white/60 bg-white/70">
              <ColorEmoji token="banco" size={24} />
            </span>
            <div>
              <h3 className="font-semibold">Activaciones</h3>
              <p className="text-sm text-[var(--color-brand-bluegray)]">
                Estado en vivo de tus módulos Pro vinculados a la organización activa.
              </p>
            </div>
          </div>
          <button
            onClick={refreshModules}
            disabled={loadingModules}
            className="inline-flex items-center gap-2 rounded-xl border border-[var(--color-brand-border)] px-3 py-2 text-sm font-medium hover:bg-white/80 disabled:opacity-60"
          >
            {loadingModules ? "Actualizando…" : "Actualizar estado"}
          </button>
          <div className="space-y-2 text-sm">
            {MODULE_DEFS.map((module) => {
              const active = modulesStatus.active && Boolean(modulesStatus.modules[module.key]);
              return (
                <div
                  key={module.key}
                  className="flex items-start justify-between gap-3 rounded-2xl border border-white/50 bg-white/60 px-3 py-2"
                >
                  <div>
                    <div className="flex items-center gap-2 font-medium">
                      <ColorEmoji token={module.token} /> {module.label}
                    </div>
                    <p className="text-xs text-[var(--color-brand-bluegray)] mt-0.5">{module.desc}</p>
                  </div>
                  <span
                    className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold ${
                      active
                        ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                        : "bg-amber-100 text-amber-800 border-amber-200"
                    }`}
                  >
                    {active ? "Activo" : "Pendiente"}
                  </span>
                </div>
              );
            })}

            {!loadingModules && !hasModulesInfo && (
              <p className="rounded-2xl border border-dashed border-white/60 bg-white/50 px-3 py-2 text-xs text-[var(--color-brand-bluegray)]">
                Sin activaciones registradas aún. Gestiona módulos desde los ajustes de Bank.
              </p>
            )}
          </div>
          <Link
            href="/banco/ajustes"
            className="inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium hover:bg-white/80"
          >
            <ColorEmoji token="ajustes" /> Gestionar módulos
          </Link>
        </div>
      </section>
    </main>
  );
}
