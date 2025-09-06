"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import UiCard from "@/components/UiCard";
import ColorEmoji from "@/components/ColorEmoji";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function DashboardPage() {
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setEmail(data.user?.email ?? null);
    });
  }, []);

  async function logout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <main className="min-h-dvh bg-[var(--color-brand-background)] p-6 md:p-10 flex items-center justify-center">
      <UiCard>
        {/* Header */}
        <div className="px-7 md:px-10 py-8 bg-[linear-gradient(180deg,#fff,rgba(255,255,255,0.7))]">
          <h1 className="text-4xl md:text-5xl font-semibold text-[var(--color-brand-text)] tracking-tight flex items-center gap-4">
            <ColorEmoji emoji="👋" size={40} mode="duotone" />
            Dashboard
          </h1>
          <p className="mt-2 text-[var(--color-brand-bluegray)] text-lg">
            <ColorEmoji emoji="✨" size={20} className="mr-1" />{" "}
            {email ? (
              <>Bienvenido/a <span className="font-medium text-[var(--color-brand-text)]">{email}</span></>
            ) : (
              <>Cargando usuario…</>
            )}
          </p>
        </div>

        {/* Acciones */}
        <div className="px-7 md:px-10 py-8 space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <button
              onClick={() => router.push("/test-ui/upload")}
              className="
                rounded-2xl px-5 py-4 border border-[var(--color-brand-border)]
                bg-white hover:bg-[color-mix(in_oklab,#fff_85%,var(--color-brand-primary)_10%)]
                text-[var(--color-brand-text)] transition inline-flex items-center gap-3 justify-center
              "
            >
              <ColorEmoji emoji="📤" mode="duotone" />
              Ir a Subida de archivos
            </button>

            <button
              onClick={logout}
              className="
                rounded-2xl px-5 py-4
                bg-[var(--color-brand-primary)] text-white
                hover:brightness-95 active:brightness-90
                transition inline-flex items-center gap-3 justify-center
              "
            >
              <ColorEmoji emoji="🚪" mode="native" />
              Cerrar sesión
            </button>
          </div>
        </div>
      </UiCard>
    </main>
  );
}
