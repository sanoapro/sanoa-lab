"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function FeatureGate({
  orgIdKey = "org_id",
  needs,
  children,
}: {
  orgIdKey?: string; // localStorage key
  needs: string | string[]; // feature_id o lista
  children: React.ReactNode;
}) {
  const [ok, setOk] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);
  const [orgId] = useState<string>(() =>
    typeof window !== "undefined" ? localStorage.getItem(orgIdKey) || "" : "",
  );

  useEffect(() => {
    (async () => {
      if (!orgId) {
        setLoading(false);
        return;
      }
      try {
        const r = await fetch(`/api/org/features?org_id=${orgId}`);
        const j = await r.json();
        const f = new Set<string>(j?.features || []);
        const required = Array.isArray(needs) ? needs : [needs];
        setOk(required.every((x) => f.has(x)));
      } finally {
        setLoading(false);
      }
    })();
  }, [orgId, needs]);

  if (loading) return <div className="text-sm opacity-70">Cargando…</div>;
  if (ok) return <>{children}</>;

  return (
    <div className="rounded-2xl border border-[var(--color-brand-border)] p-4 bg-[var(--color-brand-background)]">
      <div className="text-sm font-medium">Función Pro</div>
      <div className="text-sm opacity-70">
        Necesitas habilitar tu plan para acceder a este módulo.
      </div>
      <div className="mt-3">
        <Link
          href="/ajustes/plan"
          className="inline-flex text-sm px-3 py-2 rounded-xl bg-black text-white hover:opacity-90"
        >
          Ver planes
        </Link>
      </div>
    </div>
  );
}
