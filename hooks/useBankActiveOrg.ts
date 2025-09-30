"use client";

import { useEffect, useRef, useState } from "react";
import { listMyOrgs, setCurrentOrgId, type MyOrg } from "@/lib/org";
import { getActiveOrg, setActiveOrg } from "@/lib/org-local";

const NEW_STORAGE_KEY = "sanoa.currentOrg";

type ActiveOrgState = {
  orgId: string | null;
  isLoading: boolean;
};

export function useBankActiveOrg(): ActiveOrgState {
  const initial = getActiveOrg();
  const [orgId, setOrgId] = useState<string | null>(initial.id ?? null);
  const [isLoading, setIsLoading] = useState<boolean>(() => !initial.id);
  const orgsRef = useRef<MyOrg[]>([]);

  useEffect(() => {
    let mounted = true;

    async function bootstrap() {
      if (orgId) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const list = await listMyOrgs();
        if (!mounted) return;
        orgsRef.current = list;

        if (list.length === 1) {
          const unique = list[0];
          try {
            await setCurrentOrgId(unique.id);
          } catch {
            // ignore: graceful fallback without blocking UI
          }
          setActiveOrg(unique.id, unique.name);
          if (!mounted) return;
          setOrgId(unique.id);
          return;
        }

        if (typeof window !== "undefined") {
          try {
            const storedId = window.localStorage.getItem(NEW_STORAGE_KEY);
            if (storedId) {
              const match = list.find((item) => item.id === storedId);
              if (match) {
                setActiveOrg(match.id, match.name);
                if (!mounted) return;
                setOrgId(match.id);
                return;
              }
            }
          } catch {
            // ignore storage errors silently
          }
        }
      } catch {
        // ignore errors: component will fall back to empty state
      } finally {
        if (mounted) setIsLoading(false);
      }
    }

    void bootstrap();

    const handleChange = async (event: Event) => {
      if (!mounted) return;
      const detail = (event as CustomEvent).detail as { orgId?: string | null } | undefined;
      const nextId = detail?.orgId ?? null;
      if (!nextId) {
        setActiveOrg(null);
        setOrgId(null);
        return;
      }

      let list = orgsRef.current;
      if (!list || list.length === 0) {
        try {
          list = await listMyOrgs();
          if (mounted) orgsRef.current = list;
        } catch {
          list = [];
        }
      }

      const match = list.find((item) => item.id === nextId);
      setActiveOrg(nextId, match?.name);
      setOrgId(nextId);
    };

    window.addEventListener("sanoa:org-changed", handleChange);

    return () => {
      mounted = false;
      window.removeEventListener("sanoa:org-changed", handleChange);
    };
  }, [orgId]);

  return { orgId, isLoading };
}
