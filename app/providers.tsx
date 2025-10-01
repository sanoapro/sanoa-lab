"use client";

import "../sentry.client.config"; // <-- relativo a /app/providers.tsx (sube un nivel)
import type { ReactNode } from "react";
import { Suspense, useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { ThemeProvider } from "next-themes";
import { ToastProvider } from "@/components/Toast";
import Toaster from "@/components/Toaster";

// ---- Segment Loader (analytics.js) ----
declare global {
  interface Window {
    analytics?: any;
  }
}

function ensureSegment(writeKey: string) {
  if (!writeKey) return;

  // Evita doble inyección
  if (typeof window !== "undefined" && !window.analytics) {
    const analytics: any = (window.analytics = window.analytics || []);
    if (!analytics.initialize) {
      if (analytics.invoked) return;
      analytics.invoked = true;
      analytics.methods = [
        "trackSubmit",
        "trackClick",
        "trackLink",
        "trackForm",
        "pageview",
        "identify",
        "reset",
        "group",
        "track",
        "ready",
        "alias",
        "debug",
        "page",
        "screen",
        "once",
        "off",
        "on",
        "addSourceMiddleware",
        "addIntegrationMiddleware",
        "setAnonymousId",
        "addDestinationMiddleware",
        "register",
      ];
      analytics.factory = function (method: string) {
        return function () {
          const args = Array.prototype.slice.call(arguments);
          args.unshift(method);
          analytics.push(args);
          return analytics;
        };
      };
      for (let i = 0; i < analytics.methods.length; i++) {
        const key = analytics.methods[i];
        analytics[key] = analytics.factory(key);
      }
      analytics.load = function (key: string, opts?: Record<string, any>) {
        const script = document.createElement("script");
        script.type = "text/javascript";
        script.async = true;
        script.setAttribute("data-global-segment-analytics-key", "analytics");
        script.src = "https://cdn.segment.com/analytics.js/v1/" + key + "/analytics.min.js";
        const first = document.getElementsByTagName("script")[0];
        first?.parentNode?.insertBefore(script, first);
        analytics._loadOptions = opts;
      };
      analytics._writeKey = writeKey;
    }
    window.analytics.load(writeKey);
  }
}

// ---- Sentry (opcional) ----
let sentryAttempted = false;
function tryLoadSentry() {
  if (sentryAttempted) return;
  sentryAttempted = true;

  // Sólo intenta si hay DSN configurado
  const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN || process.env.SENTRY_DSN;
  if (!dsn) return;

  // Desde app/providers.tsx, el root está 1 nivel arriba
  import("../sentry.client.config").catch(() => {
    // Si no existe el archivo, no hacemos nada y evitamos romper el build
  });
}

/** Hook bridge: usa hooks de navegación y dispara page() */
function QueryParamsBridge() {
  const pathname = usePathname();
  const search = useSearchParams();

  // Cargar Segment y (opcional) Sentry una vez
  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_SEGMENT_WRITE_KEY ?? "";
    ensureSegment(key);
    tryLoadSentry();
  }, []);

  // Pageview en cada cambio de ruta o query
  useEffect(() => {
    if (typeof window !== "undefined" && window.analytics?.page) {
      window.analytics.page();
    }
  }, [pathname, search?.toString()]);

  return null;
}

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <ToastProvider>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <Suspense fallback={null}>
          <QueryParamsBridge />
        </Suspense>
        {children}
      </ThemeProvider>
      <Toaster />
    </ToastProvider>
  );
}
