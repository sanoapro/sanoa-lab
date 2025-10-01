// app/(app)/bank/tx/page.tsx
"use client";

import EmptyState from "@/components/EmptyState";
import TxFilters from "@/components/bank/TxFilters";
import TxTable from "@/components/bank/TxTable";
import SavedViewsBar from "@/components/saved-views/SavedViewsBar";
import { useSearchParams } from "next/navigation";
import OrgSwitcherBadge from "@/components/OrgSwitcherBadge";
import { useBankActiveOrg } from "@/hooks/useBankActiveOrg";

export default function BankTxPage() {
  const { orgId, isLoading } = useBankActiveOrg();
  const search = useSearchParams();

  const exportHref = orgId
    ? `/api/bank/tx/export?${new URLSearchParams({
        org_id: orgId,
        ...Object.fromEntries(search.entries()),
      }).toString()}`
    : "#";

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
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-semibold tracking-tight">Banco · Transacciones</h1>
        <a
          href={exportHref}
          className="glass-btn neon bubble inline-flex items-center gap-2 text-base font-semibold text-slate-700 hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:text-slate-100 dark:focus-visible:ring-offset-slate-900"
          title="Exportar CSV (respeta filtros)"
        >
          <span className="emoji" aria-hidden>
            📤
          </span>
          Exportar CSV
        </a>
      </div>

      <div className="mt-3">
        <SavedViewsBar orgId={orgId} scope="bank_tx" />
      </div>

      <div className="mt-4">
        <TxFilters />
      </div>

      <TxTable orgId={orgId} />
    </div>
  );
}
