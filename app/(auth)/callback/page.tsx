"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getSupabaseBrowser } from "@/lib/supabase-browser";

export default function AuthCallbackPage() {
  const router = useRouter();
  const search = useSearchParams();
  const [msg, setMsg] = useState("Procesando inicio de sesión…");

  useEffect(() => {
    (async () => {
      const supabase = getSupabaseBrowser();
      const next = search.get("next") || "/dashboard";
      const code = search.get("code");
      const err = search.get("error");
      const errDesc = search.get("error_description");

      try {
        if (err) throw new Error(errDesc || err);

        if (code) {
          // Flujo PKCE (?code=...)
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
          router.replace(next);
          return;
        }

        // Flujo implícito (fragmento #access_token=...)
        const { data, error: urlErr } = await supabase.auth.getSessionFromUrl({
          storeSession: true,
        });
        if (urlErr) throw urlErr;

        if (data?.session) {
          router.replace(next);
          return;
        }

        // Último intento: quizá ya hay sesión
        const { data: cur } = await supabase.auth.getSession();
        if (cur.session) {
          router.replace(next);
          return;
        }

        setMsg("No se encontró sesión activa. Intenta de nuevo.");
        setTimeout(() => router.replace("/login"), 1500);
      } catch (e: any) {
        setMsg(e?.message ? `Error: ${e.message}` : "No se pudo completar el inicio de sesión. Intenta de nuevo.");
        setTimeout(() => router.replace("/login"), 1800);
      }
    })();
  }, [router, search]);

  return (
    <main className="min-h-[100dvh] grid place-items-center p-6">
      <div className="text-[var(--color-brand-bluegray)]">{msg}</div>
    </main>
  );
}