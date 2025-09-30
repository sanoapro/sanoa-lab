"use client";

import Link from "next/link";
import OrgSwitcherBadge from "@/components/OrgSwitcherBadge";
import RulesEditor from "@/components/bank/RulesEditor";
import { useBankActiveOrg } from "@/hooks/useBankActiveOrg";

export default function BankRulesPage() {
  const { orgId, isLoading } = useBankActiveOrg();

  if (isLoading) {
    return (
      <div className="p-4 md:p-6 max-w-6xl mx-auto">
        <div className="glass-card p-6 max-w-md">
          <h1 className="text-lg font-semibold mb-2">
            <span className="emoji">🏦</span> Sanoa Bank
          </h1>
          <p className="text-sm text-slate-600">Cargando organizaciones…</p>
        </div>
      </div>
    );
  }

  if (!orgId) {
    return (
      <div className="p-4 md:p-6 max-w-6xl mx-auto">
        <div className="glass-card p-6 max-w-md">
          <h1 className="text-lg font-semibold mb-2">
            <span className="emoji">🏦</span> Sanoa Bank
          </h1>
          <p className="mb-4">Selecciona una organización activa para continuar.</p>
          <div className="flex flex-col gap-3">
            <OrgSwitcherBadge variant="inline" />
            <Link
              href="/organizaciones"
              className="inline-flex items-center justify-center gap-2 rounded-xl border px-3 py-2 text-sm hover:shadow-sm"
            >
              Administrar organizaciones
            </Link>
            <p className="text-xs text-slate-500">
              Tip: también puedes cambiar de organización desde la esquina superior derecha.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-semibold mb-2">Banco · Reglas</h1>
      <RulesEditor />
    </div>
  );
}
