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

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const r = await fetch("/api/billing/subscription/status", { cache: "no-store" });
        const j = (await r.json()) as SubscriptionStatus;
        if (!cancelled) {
          const subActive = !!j?.data?.active;
          const modules = j?.data?.modules || {};
          setActive(subActive);
          setEnabled(!!modules[featureKey]);
        }
      } catch {
        if (!cancelled) {
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
  return { loading, locked, active, enabled };
}
