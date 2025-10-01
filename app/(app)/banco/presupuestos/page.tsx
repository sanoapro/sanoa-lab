"use client";

import Link from "next/link";
import OrgSwitcherBadge from "@/components/OrgSwitcherBadge";
import BudgetsGrid from "@/components/bank/BudgetsGrid";
import { useBankActiveOrg } from "@/hooks/useBankActiveOrg";

export default function BankBudgetsPage() {
  const { orgId, isLoading } = useBankActiveOrg();

  if (isLoading) {
    return (
      <div className="p-4 md:p-6 max-w-6xl mx-auto">
        <div className="glass-card p-6 max-w-md space-y-2">
          <div className="h-6 w-48 rounded bg-white/50" />
          <div className="h-4 w-64 rounded bg-white/40" />
          <div className="h-4 w-40 rounded bg-white/40" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-6">
      <h1 className="text-2xl font-semibold">Banco · Presupuestos</h1>
      {!orgId && (
        <div className="glass-card p-6 max-w-lg space-y-4">
          <div>
            <p className="text-sm text-[var(--color-brand-text)]/70">
              Selecciona una organización activa para continuar.
            </p>
          </div>
          <OrgSwitcherBadge variant="inline" />
          <Link
            href="/organizaciones"
            className="inline-flex items-center justify-center gap-2 rounded-xl border px-3 py-2 text-sm hover:shadow-sm"
          >
            <span className="emoji">👥</span> Administrar organizaciones
          </Link>
        </div>
      )}
      {orgId && <BudgetsGrid orgId={orgId} />}
    </div>
  );
}
