"use client";

// Mantén Sentry en cliente si lo usas
import "@/sentry.client.config";
import React from "react";

/**
 * Providers de alto nivel que NO deben duplicar
 * el ToastProvider (ya está montado en app/layout.tsx).
 */
export default function Providers({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
