"use client";
import { useEffect, useState } from "react";

export default function Gate({
  orgId,
  featureId,
  children,
  fallback,
}: {
  orgId: string;
  featureId: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  const [ok, setOk] = useState<boolean | null>(null);
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const r = await fetch("/api/orgs/features/check", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ org_id: orgId, feature_id: featureId }),
        });
        const j = await r.json();
        if (mounted) setOk(!!j.has);
      } catch {
        if (mounted) setOk(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [orgId, featureId]);

  if (ok === null) return <div className="text-sm opacity-70">Verificando acceso…</div>;
  if (!ok)
    return (
      <div className="p-4 rounded border text-sm">
        {fallback || <div>Función no habilitada para tu organización.</div>}
      </div>
    );
  return <>{children}</>;
}
