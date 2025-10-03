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
  { href: "/areas", label: "Especialidades", token: "puzzle", emoji: "🧩" },
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
      });
      return;
    }
    toast({
      variant: "success",
      title: "Sesión cerrada",
      description: "Hasta pronto 👋",
    });
    router.replace("/login");
  }

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-900/80 backdrop-blur">
      <div className="mx-auto max-w-6xl px-5 h-[4.5rem] flex items-center justify-between gap-4 text-base">
        {/* Brand */}
        <Link
          href="/consultorio"
          className="inline-flex items-center gap-2 rounded-xl px-1.5 py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300/70 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
          aria-label="Ir a Consultorio"
        >
          <span className="inline-grid place-content-center h-9 w-9 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
            <ColorEmoji token="logo" />
          </span>
          <span className="font-semibold text-slate-900 dark:text-white">Sanoa</span>
        </Link>

        {/* Nav */}
        <nav className="hidden md:flex items-center gap-1.5 text-[1.05rem]">
          {NAV.map((item: any) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/consultorio" && pathname.startsWith(item.href + "/"));
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={[
                  "inline-flex items-center gap-3 px-3.5 py-3.5 rounded-xl border transition font-semibold tracking-tight",
                  "text-slate-700 dark:text-slate-100 hover:bg-slate-50/90 dark:hover:bg-white/10",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300/70 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent",
                  isActive
                    ? "bg-white dark:bg-white/10 border-slate-200 dark:border-slate-700"
                    : "border-transparent",
                ].join(" ")}
              >
                <EmojiIcon emoji={item.emoji} title={item.label} />
                <span className="font-semibold text-[1.05rem]">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Right actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleSignOut}
            disabled={signingOut}
            className="inline-flex items-center gap-2 px-4 py-3.5 rounded-2xl bg-rose-500 text-white text-[1.05rem] font-semibold shadow-md hover:brightness-95 active:brightness-90 disabled:opacity-60 disabled:cursor-not-allowed transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-300/70 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
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
