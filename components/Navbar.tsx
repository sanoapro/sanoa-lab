// components/Navbar.tsx
"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

import { useToastSafe } from "@/components/Toast";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import { cn } from "@/lib/utils";

type NavItem = { href: string; label: string; emoji: string };

const NAV: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", emoji: "🏠" },
  { href: "/agenda", label: "Agenda", emoji: "📅" },
  { href: "/pacientes", label: "Pacientes", emoji: "🧑‍⚕️" },
  { href: "/consultorio", label: "Consultorio", emoji: "🏥" },
  { href: "/especialidades", label: "Especialidades", emoji: "🧩" },
  { href: "/banco", label: "Banco", emoji: "🏦" },
];

const QUICK_LINKS: NavItem[] = [
  { href: "/recordatorios", label: "Recordatorios", emoji: "⏰" },
  { href: "/perfil", label: "Perfil", emoji: "👤" },
  { href: "/ajustes", label: "Ajustes", emoji: "⚙️" },
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
    <header className="sticky top-0 z-50 px-3 py-3 sm:px-4">
      <div className="mx-auto max-w-6xl">
        <div className="glass relative flex items-center gap-3 rounded-2xl border border-white/20 px-4 py-3 shadow-lg backdrop-blur">
          {/* Brand */}
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-base font-semibold tracking-tight text-slate-900 transition hover:opacity-90 dark:text-white"
            aria-label="Ir al dashboard"
          >
            <span className="emoji">✨</span>
            <span>Sanoa</span>
          </Link>

          {/* Main nav */}
          <nav className="ml-3 flex min-w-0 flex-1 items-center gap-1.5 overflow-x-auto whitespace-nowrap">
            {NAV.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== "/" && pathname.startsWith(item.href + "/"));

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "glass-btn inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-700 transition-colors dark:text-slate-100",
                    isActive
                      ? "ring-2 ring-sky-500/40 bg-white/80 text-slate-900 dark:bg-slate-900/70 dark:text-white"
                      : "bg-white/60 hover:bg-white/70 dark:bg-slate-950/40 dark:hover:bg-slate-950/55",
                  )}
                >
                  <span className="emoji mr-1" aria-hidden>
                    {item.emoji}
                  </span>
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Quick links */}
          <div className="ml-auto hidden flex-wrap items-center justify-end gap-2 sm:flex">
            {QUICK_LINKS.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== "/" && pathname.startsWith(item.href + "/"));

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "glass-btn inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-700 transition-colors dark:text-slate-100",
                    isActive
                      ? "ring-2 ring-sky-500/40 bg-white/80 text-slate-900 dark:bg-slate-900/70 dark:text-white"
                      : "bg-white/60 hover:bg-white/70 dark:bg-slate-950/40 dark:hover:bg-slate-950/55",
                  )}
                >
                  <span className="emoji mr-1" aria-hidden>
                    {item.emoji}
                  </span>
                  {item.label}
                </Link>
              );
            })}
          </div>

          {/* Sign out */}
          <button
            onClick={handleSignOut}
            disabled={signingOut}
            className="glass-btn ml-2 inline-flex shrink-0 items-center gap-2 px-3 py-2 text-sm font-semibold text-rose-600 transition-colors hover:bg-white/70 disabled:cursor-not-allowed disabled:opacity-70 dark:text-rose-200 dark:hover:bg-slate-950/55"
            aria-busy={signingOut}
          >
            <span className="emoji" aria-hidden>
              🔓
            </span>
            {signingOut ? "Cerrando…" : "Cerrar sesión"}
          </button>
        </div>
      </div>
    </header>
  );
}
