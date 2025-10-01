"use client";

import RulesEditor from "@/components/bank/RulesEditor";
import { useBankActiveOrg } from "@/hooks/useBankActiveOrg";
import OrgInspector from "@/components/shared/OrgInspector";

export default function BankRulesPage() {
  const { orgId, isLoading } = useBankActiveOrg();

  if (isLoading) {
    return (
      <main className="mx-auto max-w-6xl p-4 md:p-6">
        <div className="glass-card bubble text-contrast max-w-md p-6">
          <h1 className="mb-3 text-2xl font-semibold">
            <span className="emoji">🏦</span> Sanoa Bank
          </h1>
          <p className="text-base text-slate-600 dark:text-slate-200/90">Cargando organizaciones…</p>
        </div>
      </main>
    );
  }

  if (!orgId) {
    return (
      <main className="container py-6">
        <OrgInspector />
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl p-4 md:p-6">
      <h1 className="mb-3 text-3xl font-semibold tracking-tight">Banco · Reglas</h1>
      <RulesEditor />
    </main>
  );
}
