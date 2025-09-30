"use client";

import { useMemo } from "react";
import OrgSwitcherBadge from "@/components/OrgSwitcherBadge";
import TxFilters from "@/components/bank/TxFilters";
import TxTable from "@/components/bank/TxTable";
import SavedViewsBar from "@/components/saved-views/SavedViewsBar";
import { useSearchParams } from "next/navigation";
import { getActiveOrg } from "@/lib/org-local";

export default function BankTxPage() {
  const org = useMemo(() => getActiveOrg(), []);
  const orgId = org?.id ?? "";
  const search = useSearchParams();
  const exportHref = orgId
    ? `/api/bank/tx/export?${new URLSearchParams({
        org_id: orgId,
        ...Object.fromEntries(search.entries()),
      }).toString()}`
    : "#";

  if (!orgId) {
    return (
      <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-4">
        <h1 className="text-2xl font-semibold">
          <span className="emoji">🏦</span> Banco · Transacciones
        </h1>
        <div className="glass-card space-y-3">
          <p>Selecciona una organización activa para continuar.</p>
          <OrgSwitcherBadge />
          <p className="text-xs text-slate-500">
            ¿Sólo tienes una organización? Se seleccionará automáticamente en próximas visitas.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-4">
      <h1 className="text-2xl font-semibold">
        <span className="emoji">🏦</span> Banco · Transacciones
      </h1>
      <div className="glass-card space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <a href={exportHref} className="glass-btn inline-flex items-center gap-2">
            <span className="emoji">📤</span> Exportar CSV
          </a>
        </div>
        <div>
          <SavedViewsBar orgId={orgId} scope="bank_tx" />
        </div>
        <TxFilters />
        <TxTable orgId={orgId} />
      </div>
    </div>
  );
}
