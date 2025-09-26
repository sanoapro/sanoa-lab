"use client";

// Mantén Sentry en cliente si lo usas
import "@/sentry.client.config";
import React, { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";

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
      if (analytics.invoked) {
        // ya está inicializado por otra instancia
        return;
      }
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

function SegmentRouteTracker() {
  const pathname = usePathname();
  const search = useSearchParams();

  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_SEGMENT_WRITE_KEY ?? "";
    ensureSegment(key);
  }, []);

  // Pageview en cada cambio de ruta o query
  useEffect(() => {
    if (typeof window !== "undefined" && window.analytics?.page) {
      window.analytics.page();
    }
  }, [pathname, search?.toString()]);

  return null;
}

// ---------------------------------------

/**
 * Providers de alto nivel que NO deben duplicar
 * el ToastProvider (ya está montado en app/layout.tsx).
 */
export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SegmentRouteTracker />
      {children}
    </>
  );
}
