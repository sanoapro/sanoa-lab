// components/Navbar.tsx
"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import ColorEmoji from "@/components/ColorEmoji";
import EmojiIcon from "@/components/EmojiIcon";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import { useToastSafe } from "@/components/Toast";

type NavItem = { href: string; label: string; token: string; emoji: string };

const NAV: NavItem[] = [
  { href: "/consultorio", label: "Consultorio", token: "tablero", emoji: "🩺" },
  { href: "/areas", label: "Áreas Pro", token: "carpeta", emoji: "🗂️" },
  { href: "/banco", label: "Banco", token: "banco", emoji: "🏦" },
  { href: "/perfil", label: "Perfil", token: "perfil", emoji: "🙂" },
  { href: "/ajustes", label: "Ajustes", token: "ajustes", emoji: "⚙️" },
];

export default function Navbar() {
  const pathname = usePathname() || "";
  const router = useRouter();
  const supabase = getSupabaseBrowser();
  const { toast } = useToastSafe();
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
    <header className="sticky top-0 z-40 border-b border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-900/80 backdrop-blur">
      <div className="mx-auto max-w-6xl px-4 h-16 flex items-center justify-between gap-4">
        {/* Brand */}
        <Link
          href="/consultorio"
          className="inline-flex items-center gap-2"
          aria-label="Ir a Consultorio"
        >
          <span className="inline-grid place-content-center h-9 w-9 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
            <ColorEmoji token="logo" />
          </span>
          <span className="font-semibold text-slate-900 dark:text-white">Sanoa</span>
        </Link>

        {/* Nav */}
        <nav className="hidden md:flex items-center gap-1 text-[17px]">
          {NAV.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/consultorio" && pathname.startsWith(item.href + "/"));
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={[
                  "inline-flex items-center gap-3 px-3 py-3 rounded-lg border transition",
                  "text-slate-700 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-white/10",
                  isActive
                    ? "bg-white dark:bg-white/10 border-slate-200 dark:border-slate-700"
                    : "border-transparent",
                ].join(" ")}
              >
                <EmojiIcon emoji={item.emoji} title={item.label} />
                <span className="font-medium text-[17px]">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Right actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleSignOut}
            disabled={signingOut}
            className="inline-flex items-center gap-2 px-3 py-3 rounded-xl bg-rose-500 text-white text-[17px] hover:brightness-95 active:brightness-90 disabled:opacity-60 disabled:cursor-not-allowed transition"
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
