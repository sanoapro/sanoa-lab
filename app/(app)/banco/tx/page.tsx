// app/(app)/bank/tx/page.tsx
"use client";

import Link from "next/link";
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
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Banco · Transacciones</h1>
        <a
          href={exportHref}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border hover:shadow-sm"
          title="Exportar CSV (respeta filtros)"
        >
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
