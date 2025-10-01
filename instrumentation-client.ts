// This file configures the initialization of Sentry on the client.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

const DSN = process.env.NEXT_PUBLIC_SENTRY_DSN;
const ENV = process.env.NEXT_PUBLIC_SENTRY_ENV || process.env.NODE_ENV || "development";

// Permite ajustar tasas desde ENV sin tocar código
const TRACES_SAMPLE = Number(process.env.NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE ?? "1");
const ENABLE_LOGS = (process.env.NEXT_PUBLIC_SENTRY_ENABLE_LOGS ?? "true") === "true";
const DEBUG = (process.env.NEXT_PUBLIC_SENTRY_DEBUG ?? "false") === "true";

Sentry.init({
  dsn: DSN || undefined,
  environment: ENV,

  // Ajusta en prod si quieres menos tráfico (p.ej. 0.1)
  tracesSampleRate: isFinite(TRACES_SAMPLE) ? TRACES_SAMPLE : 1,

  // Logs del SDK en consola (útil en setup/dev)
  enableLogs: ENABLE_LOGS,
  debug: DEBUG,

  // (Opcional) filtra ruido típico
  denyUrls: [/extensions\//i, /^chrome:\/\//i, /\/__webpack_hmr/i],
  ignoreErrors: ["ResizeObserver loop limit exceeded"],

  // Redacta headers y querystrings sensibles
  beforeSend(event) {
    if (event.request?.headers && typeof event.request.headers === "object") {
      const h = event.request.headers as Record<string, any>;
      const block = ["cookie", "authorization", "x-supabase-auth", "sb-access-token", "sb-refresh-token"];
      for (const raw of Object.keys(h)) {
        const k = raw.toLowerCase();
        if (block.includes(k)) h[raw] = "[REDACTED]";
      }
    }
    if (event.request?.url) {
      try {
        const u = new URL(event.request.url);
        for (const key of Array.from(u.searchParams.keys())) {
          if (/(token|key|secret|code)/i.test(key)) u.searchParams.set(key, "[REDACTED]");
        }
        event.request.url = u.toString();
      } catch {}
    }
    return event;
  },
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
