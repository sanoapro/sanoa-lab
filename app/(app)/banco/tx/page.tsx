"use client";

import { useMemo } from "react";
import TxFilters from "@/components/bank/TxFilters";
import TxTable from "@/components/bank/TxTable";
import SavedViewsBar from "@/components/saved-views/SavedViewsBar";
import ColorEmoji from "@/components/ColorEmoji";
import ActiveOrgSelectorCard from "@/components/org/ActiveOrgSelectorCard";
import { useSearchParams } from "next/navigation";
import { getActiveOrg } from "@/lib/org-local";

export default function BankTxPage() {
  const org = useMemo(() => getActiveOrg(), []);
  const orgId = org?.id || "";
  const search = useSearchParams();
  const qs = search.toString();
  const exportHref = orgId
    ? `/api/bank/tx/export?${new URLSearchParams({ org_id: orgId, ...Object.fromEntries(search.entries()) }).toString()}`
    : "#";

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold flex items-center gap-2">
          <ColorEmoji token="banco" size={18} /> Banco · Transacciones
        </h1>
        <a
          href={exportHref}
          className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl border ${orgId ? "hover:shadow-sm" : "opacity-60 pointer-events-none"}`}
          title="Exportar CSV (respeta filtros)"
        >
          <ColorEmoji token="exportar" size={16} /> Exportar CSV
        </a>
      </div>

      {!orgId ? (
        <ActiveOrgSelectorCard className="mt-4" />
      ) : (
        <>
          <div className="mt-3">
            <SavedViewsBar orgId={orgId} scope="bank_tx" />
          </div>
          <div className="mt-4">
            <TxFilters />
          </div>
          <TxTable orgId={orgId} />
        </>
      )}
    </div>
  );
}
