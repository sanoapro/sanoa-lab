"use client";
import { useEffect, useRef, useState } from "react";

export default function RegisterSW() {
  const [updateReady, setUpdateReady] = useState(false);
  const waitingSW = useRef<ServiceWorker | null>(null);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    let reg: ServiceWorkerRegistration;

    const onControllerChange = () => window.location.reload();

    const registerNow = async () => {
      try {
        reg = await navigator.serviceWorker.register("/sw.js");

        // Limpieza ligera al arrancar (no bloqueante)
        const sendCleanup = () => {
          if (navigator.serviceWorker.controller) {
            navigator.serviceWorker.controller.postMessage({ type: "CLEANUP_RUNTIME", limit: 200 });
          }
        };
        setTimeout(sendCleanup, 3000);

        if (reg.waiting) {
          waitingSW.current = reg.waiting;
          setUpdateReady(true);
        }
        reg.addEventListener("updatefound", () => {
          const sw = reg.installing;
          if (!sw) return;
          sw.addEventListener("statechange", () => {
            if (sw.state === "installed" && navigator.serviceWorker.controller) {
              waitingSW.current = reg.waiting || sw;
              setUpdateReady(true);
            }
          });
        });
        navigator.serviceWorker.addEventListener("controllerchange", onControllerChange);
      } catch (e) {
        console.error("SW register error:", e);
      }
    };

    registerNow();
    return () => navigator.serviceWorker.removeEventListener("controllerchange", onControllerChange);
  }, []);

  const applyUpdate = () => {
    try {
      waitingSW.current?.postMessage({ type: "SKIP_WAITING" });
    } catch (e) {
      console.error(e);
      window.location.reload();
    }
  };

  if (!updateReady) return null;

  return (
    <div className="fixed bottom-4 left-0 right-0 z-50 mx-auto w-full max-w-md">
      <div className="mx-4 rounded-2xl border border-[var(--color-brand-border)] bg-white shadow">
        <div className="flex items-center justify-between gap-3 p-3">
          <p className="text-sm text-[var(--color-brand-text)]">Nueva versión disponible.</p>
          <div className="flex gap-2">
            <button
              onClick={() => { waitingSW.current = null; }}
              className="rounded-md border border-[var(--color-brand-border)] px-3 py-1.5 text-sm hover:bg-[var(--color-brand-background)]"
            >
              Luego
            </button>
            <button
              onClick={applyUpdate}
              className="rounded-md bg-[var(--color-brand-primary)] px-3 py-1.5 text-sm text-white hover:opacity-90"
            >
              Actualizar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
