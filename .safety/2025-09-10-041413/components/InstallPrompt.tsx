"use client";
import { useEffect, useState } from "react";

export default function InstallPrompt() {
  const [deferred, setDeferred] = useState<any>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setDeferred(e);
      setVisible(true);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  async function onInstall() {
    if (!deferred) return;
    deferred.prompt();
    await deferred.userChoice;
    setDeferred(null);
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="fixed bottom-3 left-0 right-0 mx-auto w-full max-w-sm rounded-2xl border bg-white p-4 shadow">
      <p className="mb-3 text-sm">
        ¿Quieres instalar <b>Sanoa</b> como app?
      </p>
      <button
        onClick={onInstall}
        className="w-full rounded-md bg-[var(--color-brand-primary)] px-4 py-2 text-white hover:opacity-90"
      >
        Instalar
      </button>
    </div>
  );
}
