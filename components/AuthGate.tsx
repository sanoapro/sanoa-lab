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
 * - Si hay sesión y estás en /login, te manda al dashboard (o a /).
 */
export default function AuthGate({
  children,
  redirectToIfAuthed = "/",
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
      setSession(data.session);
      setHydrated(true);

      // Redirecciones iniciales
      if (!data.session && pathname !== redirectToIfAnon) {
        router.replace(redirectToIfAnon);
      } else if (data.session && pathname === "/login") {
        router.replace(redirectToIfAuthed);
      }
    })();

    // Escucha cambios de sesión
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event: AuthChangeEvent, s) => {
      setSession(s ?? null);

      if (!s) {
        router.replace(redirectToIfAnon);
      } else {
        // Si loguea en /login, empújalo adentro
        if (pathname === "/login") router.replace(redirectToIfAuthed);
      }
    });

    return () => {
      mounted = false;
      subscription?.unsubscribe();
    };
  }, [pathname, redirectToIfAnon, redirectToIfAuthed, router, supabase]);

  if (!hydrated) {
    return (
      <div className="flex items-center justify-center py-16 text-sm text-muted-foreground">
        <ColorEmoji token="reloj" size={18} />
        &nbsp;Cargando sesión…
      </div>
    );
  }

  // Si no hay sesión, no flashes contenido protegido
  if (!session) return null;

  return <>{children}</>;
}
