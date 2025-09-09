"use client";
import { useEffect, useState } from "react";

export default function OfflineIndicator() {
  const [online, setOnline] = useState(true);
  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);
  if (online) return null;
  return (
    <div className="fixed bottom-3 left-1/2 -translate-x-1/2 z-50 w-[min(640px,calc(100%-24px))] rounded-2xl border border-[var(--color-brand-border)] bg-white text-[var(--color-brand-text)] shadow-[0_10px_30px_rgba(0,0,0,0.06)]">
      <div className="px-4 py-2 text-sm flex items-center gap-2">
        <span>🔌</span>
        <span>Sin conexión. Tus cambios se enviarán cuando vuelva Internet.</span>
      </div>
    </div>
  );
}
