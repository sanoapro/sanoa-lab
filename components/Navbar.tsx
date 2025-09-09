"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import ColorEmoji from "@/components/ColorEmoji";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import { useToast } from "@/components/Toast";
import { useState } from "react";

const NAV = [
  { href: "/dashboard", label: "Tablero", emoji: "📊" },
  { href: "/test-ui/upload", label: "Cargas", emoji: "📤" },
  { href: "/perfil", label: "Perfil", emoji: "👤" },
];

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = getSupabaseBrowser();
  const { toast } = useToast();
  const [signingOut, setSigningOut] = useState(false);

  async function handleSignOut() {
    setSigningOut(true);
    const { error } = await supabase.auth.signOut();
    setSigningOut(false);

    if (error) {
      toast({
        variant: "error",
        title: "No pudimos cerrar sesión",
        description: error.message,
        emoji: "🛑",
      });
      return;
    }

    toast({
      variant: "success",
      title: "Sesión cerrada",
      description: "Hasta pronto 👋",
      emoji: "✅",
    });
    router.replace("/login");
  }

  return (
    <header
      className="
        sticky top-0 z-40 bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/70
        border-b border-[var(--color-brand-border)]
      "
    >
      <div className="mx-auto max-w-6xl px-4 h-16 flex items-center justify-between gap-4">
        {/* Brand */}
        <Link href="/dashboard" className="inline-flex items-center gap-2">
          <span className="inline-grid place-content-center h-9 w-9 rounded-xl border border-[var(--color-brand-border)] bg-[var(--color-brand-background)]">
            <ColorEmoji token="hoja" />
          </span>
          <span className="font-semibold text-[var(--color-brand-text)]">Sanoa</span>
        </Link>

        {/* Nav */}
        <nav className="hidden md:flex items-center gap-2">
          {NAV.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`
                  inline-flex items-center gap-2 px-3 py-2 rounded-xl border
                  ${
                    active
                      ? "bg-[var(--color-brand-background)] border-[var(--color-brand-border)]"
                      : "border-transparent hover:bg-[var(--color-brand-background)]"
                  }
                `}
              >
                {/* Para navegación, duotono suave */}
                <ColorEmoji emoji={item.emoji} />
                <span className="text-[var(--color-brand-text)]">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Right actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleSignOut}
            disabled={signingOut}
            className="
              inline-flex items-center gap-2 px-3 py-2 rounded-xl
              bg-[var(--color-brand-primary)] text-white
              hover:brightness-95 active:brightness-90
              disabled:opacity-60 disabled:cursor-not-allowed
              transition
            "
            title="Cerrar sesión"
          >
            <ColorEmoji token="desbloquear" />
            <span>Cerrar sesión</span>
          </button>
        </div>
      </div>
    </header>
  );
}
{
  /* Pacientes */
}
<Link
  href="/pacientes"
  className="inline-flex items-center gap-2 px-3 py-2 rounded-xl
             hover:bg-[color-mix(in_oklab,white_85%,var(--color-brand-primary)_0%)]
             transition"
>
  <ColorEmoji token="pacientes" />
  <span>Pacientes</span>
</Link>;
