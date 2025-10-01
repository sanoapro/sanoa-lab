import * as Sentry from "@sentry/nextjs";

const DSN = process.env.NEXT_PUBLIC_SENTRY_DSN || "";
const ENV =
  process.env.NEXT_PUBLIC_SENTRY_ENV || process.env.NODE_ENV || "development";

// Tasa separada para server (por si quieres diferenciar)
const TRACES_SAMPLE_SERVER = Number(
  process.env.SENTRY_TRACES_SAMPLE_RATE_SERVER ?? "0.15"
);

Sentry.init({
  dsn: DSN || undefined,
  environment: ENV,
  tracesSampleRate: isFinite(TRACES_SAMPLE_SERVER) ? TRACES_SAMPLE_SERVER : 0.15,
  sendDefaultPii: false,

  denyUrls: [
    // Menos relevante en server, pero mantenemos simetría
  ],
  ignoreErrors: [
    // Agrega aquí si detectas ruido en server
  ],

  beforeSend(event) {
    // Redacta headers sensibles (server)
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
    // Limpia querystrings
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
