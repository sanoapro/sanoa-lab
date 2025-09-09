"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import ColorEmoji from "@/components/ColorEmoji";

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const supabase = getSupabaseBrowser();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let unsub: (() => void) | undefined;

    async function bootstrap() {
      // 1) Revisa sesión actual
      const { data } = await supabase.auth.getSession();
      const session = data.session;

      if (!session) {
        // 2) Si no hay sesión, manda al login con redirect_to
        const to = encodeURIComponent(pathname || "/dashboard");
        router.replace(`/login?redirect_to=${to}`);
        return;
      }

      // 3) Suscríbete a cambios por si la sesión expira
      const { data: sub } = supabase.auth.onAuthStateChange((_event, sess) => {
        if (!sess) {
          const to = encodeURIComponent(pathname || "/dashboard");
          router.replace(`/login?redirect_to=${to}`);
        }
      });
      unsub = () => sub.subscription.unsubscribe();

      setReady(true);
    }

    bootstrap();
    return () => unsub?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  if (!ready) {
    return (
      <div className="min-h-dvh grid place-items-center text-[var(--color-brand-text)]">
        <div className="flex items-center gap-3 text-lg">
          <ColorEmoji token="reloj" />
          Cargando…
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
