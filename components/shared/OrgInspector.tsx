// components/shared/OrgInspector.tsx
"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import OrgSwitcherBadge from "@/components/OrgSwitcherBadge";

type Props = {
  children?: ReactNode;
  title?: string;
  description?: string;
};

export default function OrgInspector({
  children,
  title = "Selecciona una organización activa para continuar.",
  description = "El contenido se habilita cuando eliges una organización en el switcher.",
}: Props) {
  const [ready, setReady] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const r = await fetch("/api/orgs/features/check", { cache: "no-cache" });
        // Si 200, asumimos que hay org activa (o el endpoint responde con algo útil).
        if (!cancelled) setReady(r.ok);
      } catch {
        if (!cancelled) setReady(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  if (ready === null) {
    return <div className="skeleton h-12 w-full" />;
  }

  if (!ready) {
    return (
      <div className="rounded-lg border border-border p-4 bg-card">
        <div className="text-base font-semibold mb-1">{title}</div>
        <div className="text-sm text-muted-foreground mb-3">{description}</div>
        <OrgSwitcherBadge />
      </div>
    );
  }

  return <>{children}</>;
}
