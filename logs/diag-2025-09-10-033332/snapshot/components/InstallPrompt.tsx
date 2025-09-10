"use client";
import { useEffect, useState } from "react";

export default function InstallPrompt() {
  const [deferred, setDeferred] = useState<any>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // No mostrar si el usuario ya lo descartó
    if (typeof window !== "undefined" && localStorage.getItem("pwaInstallDismissed") === "1") {
      return;
    }
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

  function onLater() {
    try {
      localStorage.setItem("pwaInstallDismissed", "1");
    } catch {}
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="fixed bottom-4 left-0 right-0 mx-auto w-full max-w-sm">
      <div className="rounded-2xl border border-[var(--color-brand-border)] bg-white p-4 shadow">
        <div className="flex items-start gap-3">
          <div className="rounded-xl border border-[var(--color-brand-border)] bg-[var(--color-brand-background)] px-3 py-2">
            📲
          </div>
          <div className="flex-1">
            <p className="text-[var(--color-brand-text)] font-medium">Instala Sanoa</p>
            <p className="text-sm text-[var(--color-brand-bluegray)]">
              Acceso más rápido, pantalla completa y uso offline básico.
            </p>
            <div className="mt-3 flex items-center gap-2">
              <button
                onClick={onInstall}
                className="rounded-md bg-[var(--color-brand-primary)] px-3 py-2 text-sm text-white hover:opacity-90"
              >
                Instalar ahora
              </button>
              <button
                onClick={onLater}
                className="rounded-md border border-[var(--color-brand-border)] px-3 py-2 text-sm hover:bg-[var(--color-brand-background)]"
              >
                Más tarde
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
