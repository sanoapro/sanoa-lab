"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import ColorEmoji from "@/components/ColorEmoji";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import { useToast } from "@/components/Toast";

type NavItem = {
  href: string;
  label: string;
  token: string; // ColorEmoji token
};

const NAV: NavItem[] = [
  { href: "/dashboard", label: "Tablero", token: "tablero" },
  { href: "/test-ui/upload", label: "Cargas", token: "cargas" },
  { href: "/pacientes", label: "Pacientes", token: "pacientes" }, // integrado
  { href: "/perfil", label: "Perfil", token: "perfil" },
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
        <Link href="/dashboard" className="inline-flex items-center gap-2" aria-label="Ir al tablero">
          <span className="inline-grid place-content-center h-9 w-9 rounded-xl border border-[var(--color-brand-border)] bg-[var(--color-brand-background)]">
            <ColorEmoji token="logo" />
          </span>
          <span className="font-semibold text-[var(--color-brand-text)]">Sanoa</span>
        </Link>

        {/* Nav */}
        <nav className="hidden md:flex items-center gap-2">
          {NAV.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className="
                  inline-flex items-center gap-2 px-3 py-2 rounded-lg
                  text-[color-mix(in_oklab,var(--color-brand-text),#000_0%)]/90
                  hover:bg-gray-50
                  border border-transparent
                  aria-[current=page]:bg-gray-100
                  aria-[current=page]:text-[var(--color-brand-text)]
                  aria-[current=page]:border-[var(--color-brand-border)]
                  transition
                "
              >
                <ColorEmoji token={item.token} />
                <span className="font-medium">{item.label}</span>
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
