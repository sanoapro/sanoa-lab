"use client";

import { Suspense, useCallback, useMemo } from "react";
import {
  usePathname,
  useRouter,
  useSearchParams,
  type ReadonlyURLSearchParams,
} from "next/navigation";

import TxFilters from "@/components/bank/TxFilters";
import TxTable from "@/components/bank/TxTable";
import OrgInspector from "@/components/shared/OrgInspector";
import { Chip, ChipGroup } from "@/components/ui/chips";
import { TableLoader } from "@/components/ui/states";
import { useBankActiveOrg } from "@/hooks/useBankActiveOrg";

const FLOW_IN = "in" as const;
const FLOW_OUT = "out" as const;
const STATUS_PENDING = "pending" as const;
const STATUS_CLEARED = "cleared" as const;

type FlowFilter = typeof FLOW_IN | typeof FLOW_OUT;
type StatusFilter = typeof STATUS_PENDING | typeof STATUS_CLEARED;

function parseStatus(search: ReadonlyURLSearchParams): StatusFilter | null {
  const values = search
    .getAll("status")
    .flatMap((value) => value.split(",").map((item) => item.trim()).filter(Boolean));

  if (values.length === 1 && (values[0] === STATUS_PENDING || values[0] === STATUS_CLEARED)) {
    return values[0];
  }

  return null;
}

function createQueryString(search: ReadonlyURLSearchParams) {
  return new URLSearchParams(search.toString());
}

export default function BankTransactionsClientPage() {
  const { orgId, isLoading } = useBankActiveOrg();
  const search = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const flow = (search.get("flow") as FlowFilter | null) ?? null;
  const status = parseStatus(search);

  const pushSearch = useCallback(
    (update: (value: URLSearchParams) => void) => {
      const params = createQueryString(search);
      update(params);
      params.set("page", "1");
      const query = params.toString();
      router.push(query ? `${pathname}?${query}` : pathname);
    },
    [pathname, router, search],
  );

  const handleReset = useCallback(() => {
    pushSearch((params) => {
      params.delete("flow");
      params.delete("min");
      params.delete("max");
      params.delete("status");
    });
  }, [pushSearch]);

  const handleFlowChange = useCallback(
    (next: FlowFilter) => {
      pushSearch((params) => {
        const current = params.get("flow");
        if (current === next) {
          params.delete("flow");
          params.delete("min");
          params.delete("max");
          return;
        }

        params.set("flow", next);
        if (next === FLOW_IN) {
          params.set("min", "0");
          params.delete("max");
        } else {
          params.set("max", "-1");
          params.delete("min");
        }
      });
    },
    [pushSearch],
  );

  const handleStatusChange = useCallback(
    (next: StatusFilter) => {
      pushSearch((params) => {
        const values = params
          .getAll("status")
          .flatMap((value) => value.split(",").map((item) => item.trim()).filter(Boolean));
        const current = values.length === 1 ? values[0] : null;

        if (current === next) {
          params.delete("status");
          return;
        }

        params.delete("status");
        params.append("status", next);
      });
    },
    [pushSearch],
  );

  const exportHref = useMemo(() => {
    if (!orgId) return "#";
    const params = createQueryString(search);
    params.set("org_id", orgId);
    return `/api/bank/tx/export?${params.toString()}`;
  }, [orgId, search]);

  const header = (
    <div className="flex items-center gap-3">
      <h1 className="text-xl font-bold">Banco · Transacciones</h1>
      {orgId ? (
        <a
          href={exportHref}
          className="text-sm font-medium text-primary hover:underline"
          title="Exportar CSV"
        >
          Exportar CSV
        </a>
      ) : (
        <span className="text-sm text-muted-foreground">Exportar CSV</span>
      )}
    </div>
  );

  if (isLoading) {
    return (
      <main className="container py-6 space-y-4">
        {header}
        <div className="rounded-lg border bg-background/40 p-6 text-sm text-muted-foreground">
          Cargando organizaciones…
        </div>
      </main>
    );
  }

  if (!orgId) {
    return (
      <main className="container py-6 space-y-4">
        {header}
        <OrgInspector />
      </main>
    );
  }

  return (
    <main className="container py-6 space-y-4">
      {header}

      <section className="space-y-2">
        <ChipGroup>
          <Chip label="Todas" active={!flow && !status} onClick={handleReset} />
          <Chip label="Ingresos" active={flow === FLOW_IN} onClick={() => handleFlowChange(FLOW_IN)} />
          <Chip label="Gastos" active={flow === FLOW_OUT} onClick={() => handleFlowChange(FLOW_OUT)} />
          <Chip
            label="Conciliadas"
            active={status === STATUS_CLEARED}
            onClick={() => handleStatusChange(STATUS_CLEARED)}
          />
          <Chip
            label="Pendientes"
            active={status === STATUS_PENDING}
            onClick={() => handleStatusChange(STATUS_PENDING)}
          />
        </ChipGroup>
        <TxFilters />
      </section>

      <section className="pro-table">
        <Suspense fallback={<TableLoader />}>
          <TxTable orgId={orgId} />
        </Suspense>
      </section>
    </main>
  );
}
