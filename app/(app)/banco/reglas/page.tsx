"use client";

import EmptyState from "@/components/EmptyState";
import OrgSwitcherBadge from "@/components/OrgSwitcherBadge";
import RulesEditor from "@/components/bank/RulesEditor";
import { useBankActiveOrg } from "@/hooks/useBankActiveOrg";

export default function BankRulesPage() {
  const { orgId, isLoading } = useBankActiveOrg();

  if (isLoading) {
    return (
      <div className="mx-auto max-w-6xl p-4 md:p-6">
        <div className="glass-card bubble text-contrast max-w-md p-6">
          <h1 className="mb-3 text-2xl font-semibold">
            <span className="emoji">🏦</span> Sanoa Bank
          </h1>
          <p className="text-base text-slate-600 dark:text-slate-200/90">Cargando organizaciones…</p>
        </div>
      </div>
    );
  }

  if (!orgId) {
    return (
      <div className="mx-auto max-w-6xl p-4 md:p-6">
        <EmptyState
          emoji="🏷️"
          title="Selecciona una organización"
          hint="Elige la organización activa para ver tus transacciones y reglas."
          ctaText="Elegir organización"
          onCta={() =>
            document
              .querySelector('[data-org-switcher]')
              ?.dispatchEvent(new Event("click", { bubbles: true }))
          }
        >
          <OrgSwitcherBadge variant="inline" />
          <p className="text-sm text-slate-500 dark:text-slate-400">
            También puedes cambiarla desde la esquina superior derecha.
          </p>
        </EmptyState>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl p-4 md:p-6">
      <h1 className="mb-3 text-3xl font-semibold tracking-tight">Banco · Reglas</h1>
      <RulesEditor />
    </div>
  );
}
