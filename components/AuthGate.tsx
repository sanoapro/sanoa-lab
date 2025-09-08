// components/AuthGate.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import ColorEmoji from "@/components/ColorEmoji";

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const supabase = getSupabaseBrowser();
  const [status, setStatus] = useState<"checking" | "ok">("checking");

  useEffect(() => {
    let mounted = true;

    async function check() {
      const { data } = await supabase.auth.getSession();
      if (!mounted) return;

      if (!data.session) {
        router.replace("/login");
        return;
      }

      setStatus("ok");
    }

    check();

    const { data: sub } = supabase.auth.onAuthStateChange((_evt, session) => {
      if (!session) router.replace("/login");
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, [router, supabase]);

  if (status === "checking") {
    return (
      <div className="min-h-dvh bg-[var(--color-brand-background)] flex items-center justify-center p-6">
        <div className="w-full max-w-md rounded-3xl bg-white border border-[var(--color-brand-border)] shadow-[0_10px_30px_rgba(0,0,0,0.06)] p-8 text-center">
          <div className="mx-auto mb-3 h-12 w-12 grid place-content-center rounded-2xl bg-[var(--color-brand-background)] border border-[var(--color-brand-border)]">
            <ColorEmoji emoji="🍃" mode="native" />
          </div>
          <p className="text-lg text-[var(--color-brand-text)] font-medium">Cargando tu sesión…</p>
          <p className="text-sm text-[color-mix(in_oklab,var(--color-brand-text)_75%,white)] mt-1">
            Un momento por favor.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
