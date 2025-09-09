import * as Sentry from "@sentry/nextjs";

const DSN = process.env.NEXT_PUBLIC_SENTRY_DSN || "";
const ENV = process.env.NEXT_PUBLIC_SENTRY_ENV || process.env.NODE_ENV || "development";

if (DSN) {
  Sentry.init({
    dsn: DSN,
    environment: ENV,
    tracesSampleRate: 0.15, // ajusta si necesitas más/menos performance
    sendDefaultPii: false,
    beforeSend(event) {
      // Redacta headers sensibles
      if (event.request?.headers) {
        const h = event.request.headers as Record<string, any>;
        const block = ["cookie", "authorization", "x-supabase-auth", "sb-access-token", "sb-refresh-token"];
        for (const k of block) {
          if (h[k] != null) h[k] = "[REDACTED]";
          if (h[k.toLowerCase?.()] != null) h[k.toLowerCase()] = "[REDACTED]";
          if (h[k.toUpperCase?.()] != null) h[k.toUpperCase()] = "[REDACTED]";
        }
      }
      return event;
    },
  });
}
