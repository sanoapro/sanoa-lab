export async function GET() {
  // Lanzará un error para que Sentry lo capture (si DSN está configurado)
  throw new Error("Sentry test error from /api/sentry-debug");
}
