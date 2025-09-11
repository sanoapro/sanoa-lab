"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getSupabaseBrowser } from "@/lib/supabase-browser";

export default function AuthCallbackPage() {
  const router = useRouter();
  const search = useSearchParams();
  const [msg, setMsg] = useState("Procesando inicio de sesión…");

  const nextSafe = useMemo(() => {
    const n = search.get("next") || "/dashboard";
    return n.startsWith("/") && !n.startsWith("//") ? n : "/dashboard";
  }, [search]);

  useEffect(() => {
    (async () => {
      try {
        const supabase = getSupabaseBrowser();
        const err = search.get("error");
        const errDesc = search.get("error_description");
        const code = search.get("code");

        if (err) {
          setMsg(decodeURIComponent(errDesc || "No se pudo completar el inicio de sesión."));
          setTimeout(() => router.replace("/login"), 1500);
          return;
        }

        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
        }

        const { data } = await supabase.auth.getSession();
        if (!data.session) {
          setMsg("No se encontró sesión activa. Intenta de nuevo.");
          setTimeout(() => router.replace("/login"), 1500);
          return;
        }

        router.replace(nextSafe);
      } catch (e: any) {
        setMsg(e?.message || "No se pudo completar el inicio de sesión. Intenta de nuevo.");
        setTimeout(() => router.replace("/login"), 1800);
      }
    })();
  }, [router, search, nextSafe]);

  return (
    <main className="min-h-[100dvh] grid place-items-center p-6">
      <div className="text-[var(--color-brand-bluegray)]">{msg}</div>
    </main>
  );
}
