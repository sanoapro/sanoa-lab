"use client";

import type { AuthChangeEvent, Session } from "@supabase/supabase-js";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import ColorEmoji from "@/components/ColorEmoji";

/**
 * AuthGate:
 * - Protege rutas del app.
 * - Redirige a /login si no hay sesión.
 * - Si hay sesión y estás en /login, te manda a /dashboard.
 */
export default function AuthGate({
  children,
  redirectToIfAuthed = "/dashboard",
  redirectToIfAnon = "/login",
}: {
  children: React.ReactNode;
  redirectToIfAuthed?: string;
  redirectToIfAnon?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const supabase = getSupabaseBrowser();

  const [hydrated, setHydrated] = useState(false);
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    let mounted = true;

    (async () => {
      const { data } = await supabase.auth.getSession();
      if (!mounted) return;

      setSession(data.session ?? null);
      setHydrated(true);

      // Redirecciones iniciales
      if (!data.session) {
        if (pathname !== redirectToIfAnon) router.replace(redirectToIfAnon);
      } else if (pathname === "/login") {
        router.replace(redirectToIfAuthed);
      }
    })();

    // Suscribirse a cambios de sesión
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event: AuthChangeEvent, s: any) => {
      setSession(s ?? null);

      if (!s) {
        router.replace(redirectToIfAnon);
      } else if (pathname === "/login") {
        router.replace(redirectToIfAuthed);
      }
    });

    return () => {
      mounted = false;
      subscription?.unsubscribe();
    };
  }, [pathname, redirectToIfAnon, redirectToIfAuthed, router, supabase]);

  // Espera a hidratar para evitar “flash” y discrepancias de SSR/CSR
  if (!hydrated) {
    return (
      <div
        className="flex items-center justify-center py-16 text-sm text-[var(--color-brand-bluegray)]"
        aria-busy="true"
        aria-live="polite"
      >
        <ColorEmoji token="reloj" size={18} />
        <span className="ml-2">Cargando sesión…</span>
      </div>
    );
  }

  // Si no hay sesión, no mostramos contenido protegido
  if (!session) return null;

  return <>{children}</>;
}
