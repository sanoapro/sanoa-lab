import * as Sentry from "@sentry/nextjs";

const DSN = process.env.NEXT_PUBLIC_SENTRY_DSN || "";
const ENV = process.env.NEXT_PUBLIC_SENTRY_ENV || process.env.NODE_ENV || "development";

if (typeof window !== "undefined" && DSN) {
  Sentry.init({
    dsn: DSN,
    environment: ENV,
    tracesSampleRate: 0.1, // cliente un poco menor
    sendDefaultPii: false,
    beforeSend(event) {
      // Evita enviar cualquier cookie/query sensible desde el navegador
      if (event.request?.headers) {
        const h = event.request.headers as Record<string, any>;
        const block = [
          "cookie",
          "authorization",
          "x-supabase-auth",
          "sb-access-token",
          "sb-refresh-token",
        ];
        for (const k of block) if (h[k] != null) h[k] = "[REDACTED]";
      }
      return event;
    },
  });
}
