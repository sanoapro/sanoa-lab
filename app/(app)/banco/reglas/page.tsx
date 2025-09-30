"use client";

import Link from "next/link";
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
        <div className="glass-card bubble text-contrast max-w-md p-6">
          <h1 className="mb-3 text-2xl font-semibold">
            <span className="emoji">🏦</span> Sanoa Bank
          </h1>
          <p className="mb-4 text-base text-slate-700 dark:text-slate-200">
            Selecciona una organización activa para continuar.
          </p>
          <div className="flex flex-col gap-3">
            <OrgSwitcherBadge variant="inline" />
            <Link
              href="/organizaciones"
              className="glass-btn bubble text-base font-semibold text-slate-700 transition-shadow hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:text-slate-100 dark:focus-visible:ring-offset-slate-900"
            >
              <span className="emoji" aria-hidden>
                🧭
              </span>
              Administrar organizaciones
            </Link>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Tip: también puedes cambiar de organización desde la esquina superior derecha.
            </p>
          </div>
        </div>
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
