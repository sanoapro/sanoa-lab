"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowser } from "@/lib/supabase-browser";

export default function ClearAuthPage() {
  const router = useRouter();

  useEffect(() => {
    (async () => {
      try {
        // 1) Limpia el token local de Supabase (tu project-ref)
        localStorage.removeItem("sb-mmeybpohqtpvaxuhipjr-auth-token");

        // 2) Cierra sesión local por si hubiera un estado intermedio
        const supabase = getSupabaseBrowser();
        await supabase.auth.signOut({ scope: "local" }); // no llama al servidor

        // 3) Limpia caches del SW (si aplica)
        if ("caches" in window) {
          const keys = await caches.keys();
          await Promise.all(keys.map((k) => caches.delete(k)));
        }
      } catch (_) {}
      // 4) Vuelve al login limpio
      router.replace("/login");
    })();
  }, [router]);

  return (
    <main className="min-h-[100dvh] grid place-items-center p-6">
      <div className="text-[var(--color-brand-bluegray)]">
        Limpiando sesión local… regresando al login.
      </div>
    </main>
  );
}
