"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { getActiveOrg as getLegacyActiveOrg, setActiveOrg as setLegacyActiveOrg } from "@/lib/org-local";
import { getCurrentOrgId, listMyOrgs, setCurrentOrgId, type MyOrg } from "@/lib/org";

export type ActiveOrg = { id: string; name: string; slug?: string };

type ApplyOptions = {
  emit?: boolean;
  persistServer?: boolean;
};

function normalizeOrg(item: MyOrg): ActiveOrg {
  return {
    id: item.id,
    name: item.is_personal ? "Personal" : item.name,
    slug: item.slug ?? undefined,
  };
}

function readStoredActiveOrg(): ActiveOrg | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem("active_org");
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<ActiveOrg> | null;
      if (parsed && typeof parsed.id === "string" && typeof parsed.name === "string") {
        return { id: parsed.id, name: parsed.name, slug: parsed.slug };
      }
    }
  } catch {
    // ignore malformed JSON
  }

  const legacy = getLegacyActiveOrg();
  if (legacy.id) {
    return {
      id: legacy.id,
      name: legacy.name ?? "Organización",
    };
  }

  return null;
}

function persistActiveOrgLocal(next: ActiveOrg | null) {
  setLegacyActiveOrg(next ? next.id : null, next?.name ?? null);

  if (typeof window === "undefined") return;

  try {
    if (next) {
      window.localStorage.setItem("active_org", JSON.stringify(next));
    } else {
      window.localStorage.removeItem("active_org");
    }
  } catch {
    // ignore storage write errors
  }
}

export function useActiveOrg() {
  const [org, setOrg] = useState<ActiveOrg | null>(() => readStoredActiveOrg());
  const [loading, setLoading] = useState<boolean>(() => !readStoredActiveOrg());
  const orgRef = useRef<ActiveOrg | null>(org);

  useEffect(() => {
    orgRef.current = org;
  }, [org]);

  const applyActiveOrg = useCallback(
    (next: ActiveOrg | null, options: ApplyOptions = {}) => {
      setOrg(next);
      setLoading(false);
      persistActiveOrgLocal(next);

      if (typeof window !== "undefined" && options.emit) {
        window.dispatchEvent(new CustomEvent("org:changed", { detail: next ?? null }));
      }

      if (options.persistServer && next) {
        void setCurrentOrgId(next.id).catch(() => {
          // silently ignore persistence errors
        });
      }
    },
    [],
  );

  const setActive = useCallback(
    (next: ActiveOrg) => {
      applyActiveOrg(next, { emit: true, persistServer: true });
    },
    [applyActiveOrg],
  );

  useEffect(() => {
    if (org) {
      setLoading(false);
      return;
    }

    let mounted = true;
    setLoading(true);

    (async () => {
      try {
        const [currentIdResult, orgsResult] = await Promise.allSettled([
          getCurrentOrgId(),
          listMyOrgs(),
        ]);

        const currentId =
          currentIdResult.status === "fulfilled" ? currentIdResult.value : null;
        const orgs =
          orgsResult.status === "fulfilled" && Array.isArray(orgsResult.value)
            ? (orgsResult.value as MyOrg[])
            : [];

        let nextOrg: ActiveOrg | null = null;
        let shouldPersistServer = false;

        if (orgs.length > 0) {
          const match = currentId ? orgs.find((item) => item.id === currentId) : undefined;
          const chosen = match ?? orgs[0];
          if (chosen) {
            nextOrg = normalizeOrg(chosen);
            shouldPersistServer = !currentId || !match;
          }
        } else if (currentId) {
          nextOrg = { id: currentId, name: "Organización" };
          shouldPersistServer = false;
        }

        if (nextOrg && mounted) {
          applyActiveOrg(nextOrg, { emit: true, persistServer: shouldPersistServer });
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [applyActiveOrg, org]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleOrgChanged = (event: Event) => {
      const detail = (event as CustomEvent<ActiveOrg | null>).detail;
      if (detail && typeof detail === "object" && typeof detail.id === "string") {
        applyActiveOrg({
          id: detail.id,
          name: detail.name ?? "Organización",
          slug: detail.slug,
        }, { emit: false, persistServer: false });
      } else {
        applyActiveOrg(null, { emit: false, persistServer: false });
      }
    };

    const handleLegacyChange = (event: Event) => {
      const detail = (event as CustomEvent<{ orgId?: string | null }>).detail;
      const nextId = detail?.orgId ?? null;
      if (!nextId) {
        applyActiveOrg(null, { emit: false, persistServer: false });
        return;
      }

      let name = "Organización";
      const legacy = getLegacyActiveOrg();
      if (legacy.id === nextId && legacy.name) {
        name = legacy.name;
      } else if (orgRef.current?.id === nextId) {
        name = orgRef.current.name;
      }

      applyActiveOrg({ id: nextId, name }, { emit: false, persistServer: false });
    };

    window.addEventListener("org:changed", handleOrgChanged);
    window.addEventListener("sanoa:org-changed", handleLegacyChange);

    return () => {
      window.removeEventListener("org:changed", handleOrgChanged);
      window.removeEventListener("sanoa:org-changed", handleLegacyChange);
    };
  }, [applyActiveOrg]);

  return { org, loading, setActive };
}
