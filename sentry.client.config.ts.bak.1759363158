// This file configures the initialization of Sentry on the client.
// It runs in the browser. https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  // Usa el mismo DSN que ya tienes en server/edge para mantener consistencia:
  dsn: "https://e6bdf0d1b7681f6c84b8f8a086b93380@o4509991008731136.ingest.us.sentry.io/4509991033110528",

  // Ajusta según tus necesidades:
  tracesSampleRate: 1,

  // Modo debug desactivado en prod
  debug: false,
});
