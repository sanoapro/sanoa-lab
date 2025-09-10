// middleware.ts
import { NextResponse } from "next/server";

/**
 * Middleware desactivado a propósito.
 * La protección de rutas la hace <AuthGate/> en el layout del grupo (app).
 * Si en el futuro quieres SSR protegido con cookies de Supabase,
 * reactivamos aquí y sincronizamos sesión vía route handlers.
 */
export function middleware() {
  return NextResponse.next();
}

// Sin matcher => no corre en ninguna ruta
export const config = {
  matcher: [] as string[],
};
