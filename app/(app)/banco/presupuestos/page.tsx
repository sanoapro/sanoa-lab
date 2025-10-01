"use client";

import BudgetsGrid from "@/components/bank/BudgetsGrid";
import { useBankActiveOrg } from "@/hooks/useBankActiveOrg";
import OrgInspector from "@/components/shared/OrgInspector";

export default function BankBudgetsPage() {
  const { orgId, isLoading } = useBankActiveOrg();

  if (isLoading) {
    return (
      <main className="p-4 md:p-6 max-w-6xl mx-auto">
        <div className="glass-card p-6 max-w-md space-y-2">
          <div className="h-6 w-48 rounded bg-white/50" />
          <div className="h-4 w-64 rounded bg-white/40" />
          <div className="h-4 w-40 rounded bg-white/40" />
        </div>
      </main>
    );
  }

  return (
    <main className="p-4 md:p-6 max-w-6xl mx-auto space-y-6">
      <h1 className="text-2xl font-semibold">Banco · Presupuestos</h1>
      {!orgId ? <OrgInspector ctaHref="/organizaciones" /> : <BudgetsGrid orgId={orgId} />}
    </main>
  );
}
