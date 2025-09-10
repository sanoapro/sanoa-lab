"use client";
import { useEffect } from "react";
import { showToast } from "@/components/Toaster";

declare global {
  interface Window {
    __sanoaQueueCount?: number;
  }
}

function broadcastCount() {
  const count = window.__sanoaQueueCount || 0;
  window.dispatchEvent(new CustomEvent("sanoa:queue-count", { detail: { count } }));
}

export default function QueueEvents() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.__sanoaQueueCount == null) window.__sanoaQueueCount = 0;

    const onMsg = (ev: MessageEvent) => {
      const data = ev.data || {};
      if (!data || !data.type) return;

      if (data.type === "queue:added") {
        window.__sanoaQueueCount = data.pending ?? (window.__sanoaQueueCount ?? 0) + 1;
        showToast("Acción encolada (sin conexión). Se enviará al volver Internet.", "info");
        broadcastCount();
      }

      if (data.type === "queue:replay-success") {
        window.__sanoaQueueCount = data.pending ?? 0;
        const n = data?.info?.processed ?? 1;
        showToast(`${n} acción(es) pendientes enviadas.`, "success");
        broadcastCount();
      }

      if (data.type === "queue:replay-fail") {
        showToast("No se pudo enviar la cola. Reintento cuando vuelva la red.", "error");
      }

      if (data.type === "queue:count") {
        window.__sanoaQueueCount = data.pending ?? 0;
        broadcastCount();
      }
    };

    navigator.serviceWorker?.addEventListener?.("message", onMsg);
    return () => navigator.serviceWorker?.removeEventListener?.("message", onMsg);
  }, []);

  return null;
}
