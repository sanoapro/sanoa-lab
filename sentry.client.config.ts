import * as Sentry from "@sentry/nextjs";

const DSN = process.env.NEXT_PUBLIC_SENTRY_DSN || "";
const ENV =
  process.env.NEXT_PUBLIC_SENTRY_ENV || process.env.NODE_ENV || "development";

// Permite ajustar la tasa sin tocar código (ej. 0.1 = 10%)
const TRACES_SAMPLE =
  Number(process.env.NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE ?? "0.10");

// Activa Replay solo si lo decides por env
const ENABLE_REPLAY = process.env.NEXT_PUBLIC_SENTRY_REPLAY === "1";
const REPLAY_ERROR_RATE = Number(
  process.env.NEXT_PUBLIC_SENTRY_REPLAY_ERROR_RATE ?? "0.05"
);
const REPLAY_SESSION_RATE = Number(
  process.env.NEXT_PUBLIC_SENTRY_REPLAY_SESSION_RATE ?? "0.01"
);

Sentry.init({
  dsn: DSN || undefined,
  environment: ENV,
  tracesSampleRate: isFinite(TRACES_SAMPLE) ? TRACES_SAMPLE : 0.1,
  sendDefaultPii: false,

  // Filtra ruido típico de extensiones/ads
  denyUrls: [
    /extensions\//i,
    /^chrome:\/\//i,
    /\/browser-sync\//i,
    /\/__webpack_hmr/i,
  ],
  ignoreErrors: [
    "ResizeObserver loop limit exceeded",
    "Network Error",
    "Load failed",
  ],

  // Replay opcional controlado por env
  integrations: ENABLE_REPLAY ? [Sentry.replayIntegration()] : [],

  replaysOnErrorSampleRate: ENABLE_REPLAY ? (isFinite(REPLAY_ERROR_RATE) ? REPLAY_ERROR_RATE : 0.05) : 0,
  replaysSessionSampleRate: ENABLE_REPLAY ? (isFinite(REPLAY_SESSION_RATE) ? REPLAY_SESSION_RATE : 0.01) : 0,

  beforeSend(event) {
    // Redacta headers sensibles (cliente)
    if (event.request?.headers && typeof event.request.headers === "object") {
      const h = event.request.headers as Record<string, any>;
      const block = [
        "cookie",
        "authorization",
        "x-supabase-auth",
        "sb-access-token",
        "sb-refresh-token",
      ];
      for (const raw of Object.keys(h)) {
        const k = raw.toLowerCase();
        if (block.includes(k)) h[raw] = "[REDACTED]";
      }
    }
    // Limpia querystrings con posibles tokens
    if (event.request?.url) {
      try {
        const u = new URL(event.request.url);
        for (const key of Array.from(u.searchParams.keys())) {
          if (/(token|key|secret|code)/i.test(key)) {
            u.searchParams.set(key, "[REDACTED]");
          }
        }
        event.request.url = u.toString();
      } catch {}
    }
    return event;
  },
});
