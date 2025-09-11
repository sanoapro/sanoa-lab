"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getSupabaseBrowser } from "@/lib/supabase-browser";

function toReadableError(e: unknown): string {
  const msg =
    typeof e === "object" && e && "message" in e ? String((e as any).message) : String(e ?? "");
  if (/Unable to exchange external code/i.test(msg) || /PKCE/i.test(msg)) {
    return "No se pudo canjear el código de inicio de sesión (PKCE). Posible causa: regresaste a un dominio distinto del que inició el login. Abre el login y el callback en el mismo dominio/puerto.";
  }
  return msg || "No se pudo completar el inicio de sesión.";
}

export default function AuthCallbackPage() {
  const router = useRouter();
  const search = useSearchParams();
  const [msg, setMsg] = useState("Procesando inicio de sesión…");

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const supabase = getSupabaseBrowser();

        const error = search.get("error");
        const description = search.get("error_description");
        const next = (() => {
          const n = search.get("next") || "/dashboard";
          return n.startsWith("/") && !n.startsWith("//") ? n : "/dashboard";
        })();
        const code = search.get("code");

        // Error directo del proveedor (Google)
        if (error) {
          setMsg(decodeURIComponent(description || "Error de autenticación."));
          setTimeout(() => router.replace("/login"), 1600);
          return;
        }

        // Flujo estándar: canje de código a sesión
        if (code) {
          const { error: exError } = await supabase.auth.exchangeCodeForSession(code);
          if (exError) throw exError;
          if (!mounted) return;
          setMsg("¡Listo! Redirigiendo…");
          router.replace(next);
          return;
        }

        // Fallback: si ya hay sesión (deep-link, refresh, etc.)
        const { data } = await supabase.auth.getSession();
        if (data.session) {
          router.replace(next);
          return;
        }

        setMsg("No se encontró sesión activa. Intenta de nuevo.");
        setTimeout(() => router.replace("/login"), 1400);
      } catch (e) {
        setMsg(toReadableError(e));
        setTimeout(() => router.replace("/login"), 1600);
      }
    })();

    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main className="min-h-[100dvh] grid place-items-center p-6">
      <div className="text-[var(--color-brand-bluegray)]">{msg}</div>
    </main>
  );
}
