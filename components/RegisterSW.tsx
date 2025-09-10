"use client";
import { useEffect } from "react";

export default function RegisterSW() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if ("serviceWorker" in navigator) {
      // Ajusta la ruta si tu SW vive en otro lugar (ej. /service-worker.js)
      navigator.serviceWorker.register("/sw.js").catch(() => { /* noop */ });

      navigator.serviceWorker.addEventListener("controllerchange", () => {
        // no-op: puedes forzar reload si lo deseas
      });

      navigator.serviceWorker.addEventListener("message", (event: MessageEvent) => {
        // Reemite a window si tu app escucha mensajes globales (cola, etc.)
        (window as any).postMessage?.(event.data);
      });
    }
  }, []);

  return null;
}
