"use client";

import * as React from "react";

type SubscriptionStatus = {
  ok: boolean;
  data?: {
    active: boolean;
    modules?: Record<string, boolean>;
  };
};

type ModulesMap = Record<string, boolean>;

export function useModuleAccess(featureKey?: string) {
  const [loading, setLoading] = React.useState(true);
  const [active, setActive] = React.useState(false);
  const [enabled, setEnabled] = React.useState(false);
  const [bankReady, setBankReady] = React.useState(true);
  const [features, setFeatures] = React.useState<ModulesMap>({});
  const [orgId, setOrgId] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const storageOrgId =
          typeof window !== "undefined" ? window.localStorage.getItem("org_id") : null;

        if (!cancelled) {
          setOrgId(storageOrgId);
        }

        if (!storageOrgId) {
          if (!cancelled) {
            setBankReady(false);
            setActive(false);
            setEnabled(false);
            setFeatures({});
          }
          return;
        }

        const params = new URLSearchParams({ org_id: storageOrgId });
        const r = await fetch(`/api/billing/subscription/status?${params.toString()}`, {
          cache: "no-store",
        });
        if (!r.ok) {
          if (!cancelled) {
            setBankReady(false);
            setActive(false);
            setEnabled(false);
            setFeatures({});
          }
          return;
        }
        const j = (await r.json()) as SubscriptionStatus;
        if (!cancelled) {
          const ok = "ok" in j ? Boolean(j.ok) : true;
          setBankReady(ok);
          if (ok) {
            const subActive = !!j?.data?.active;
            const modules = (j?.data?.modules || {}) as ModulesMap;
            setActive(subActive);
            setFeatures(modules);
            setEnabled(featureKey ? !!modules[featureKey] : false);
          } else {
            setActive(false);
            setEnabled(false);
            setFeatures({});
          }
        }
      } catch {
        if (!cancelled) {
          setBankReady(false);
          setActive(false);
          setEnabled(false);
          setFeatures({});
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [featureKey]);

  const locked = featureKey ? !(active && enabled) : !active;
  return { loading, locked, active, enabled, bankReady, features, orgId };
}
