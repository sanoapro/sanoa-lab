"use client";
import { useEffect, useState } from "react";

export default function PendingQueueBadge() {
  const [count, setCount] = useState<number>(0);

  useEffect(() => {
    const onCount = (e: Event) => {
      const ce = e as CustomEvent<{ count: number }>;
      setCount(ce.detail?.count ?? 0);
    };
    window.addEventListener("sanoa:queue-count", onCount);
    // Inicializa desde variable global si existe
    setCount((window as any).__sanoaQueueCount || 0);
    return () => window.removeEventListener("sanoa:queue-count", onCount);
  }, []);

  if (count <= 0) return null;
  return (
    <div className="fixed bottom-16 right-3 z-50 rounded-full border border-[var(--color-brand-border)] bg-white shadow-[0_10px_30px_rgba(0,0,0,0.06)]">
      <div className="px-3 py-1.5 text-sm flex items-center gap-2">
        <span>📨</span>
        <span className="font-medium text-[var(--color-brand-text)]">{count}</span>
        <span className="text-[var(--color-brand-bluegray)]">pendiente(s)</span>
      </div>
    </div>
  );
}
