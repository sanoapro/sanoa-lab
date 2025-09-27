"use client";

import { useMemo } from "react";
import TxFilters from "@/components/bank/TxFilters";
import TxTable from "@/components/bank/TxTable";
import { getActiveOrg } from "@/lib/org-local";

export default function BankTxPage() {
  const org = useMemo(() => getActiveOrg(), []);
  const orgId = org?.id || "";

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-semibold mb-2">Banco · Transacciones</h1>
      {!orgId && <p className="text-amber-700 bg-amber-50 border border-amber-200 rounded p-3 mb-4">Selecciona una organización activa para continuar.</p>}
      {orgId && (
        <>
          <TxFilters />
          <TxTable orgId={orgId} />
        </>
      )}
    </div>
  );
}
