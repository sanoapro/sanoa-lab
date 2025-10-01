"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

type Props = { children: React.ReactNode };

export default function RequireAuth({ children }: Props) {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let mounted = true;

    // 1) Chequeo inicial
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      const isAuthed = Boolean(data.session);
      if (!isAuthed) router.replace("/login");
      setChecking(false);
    });

    // 2) Suscripción a cambios de auth
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      const isAuthed = Boolean(session);
      if (!isAuthed) router.replace("/login");
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, [router]);

  if (checking) {
    return (
      <main className="min-h-dvh flex items-center justify-center bg-[var(--color-brand-background)]">
        <div className="rounded-3xl bg-white/90 border border-[var(--color-brand-border)] shadow-[0_10px_30px_rgba(0,0,0,0.06)] px-8 py-7">
          <p className="text-[var(--color-brand-text)] text-lg">Verificando sesión…</p>
        </div>
      </main>
    );
  }

  return <>{children}</>;
}

export { RequireAuth };
