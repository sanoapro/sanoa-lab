"use client";

import * as React from "react";

type SubscriptionStatus = {
  ok: boolean;
  data?: {
    active: boolean;
    modules?: Record<string, boolean>;
  };
};

export function useModuleAccess(featureKey: string) {
  const [loading, setLoading] = React.useState(true);
  const [active, setActive] = React.useState(false);
  const [enabled, setEnabled] = React.useState(false);
  const [bankReady, setBankReady] = React.useState(true);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const orgId =
          typeof window !== "undefined" ? window.localStorage.getItem("org_id") : null;

        if (!orgId) {
          if (!cancelled) {
            setBankReady(false);
            setActive(false);
            setEnabled(false);
          }
          return;
        }

        const params = new URLSearchParams({ org_id: orgId });
        const r = await fetch(`/api/billing/subscription/status?${params.toString()}`, {
          cache: "no-store",
        });
        if (!r.ok) {
          if (!cancelled) {
            setBankReady(false);
            setActive(false);
            setEnabled(false);
          }
          return;
        }
        const j = (await r.json()) as SubscriptionStatus;
        if (!cancelled) {
          const ok = "ok" in j ? Boolean(j.ok) : true;
          setBankReady(ok);
          if (ok) {
            const subActive = !!j?.data?.active;
            const modules = j?.data?.modules || {};
            setActive(subActive);
            setEnabled(!!modules[featureKey]);
          } else {
            setActive(false);
            setEnabled(false);
          }
        }
      } catch {
        if (!cancelled) {
          setBankReady(false);
          setActive(false);
          setEnabled(false);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [featureKey]);

  const locked = !(active && enabled);
  return { loading, locked, active, enabled, bankReady };
}
