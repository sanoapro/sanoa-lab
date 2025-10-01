// components/Navbar.tsx
"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

import { useToastSafe } from "@/components/Toast";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import { cn } from "@/lib/utils";
import ActiveOrgInspector from "@/components/organizations/ActiveOrgInspector";

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
    <header className="sticky top-0 z-50 px-3 py-4 sm:px-5">
      <div className="mx-auto max-w-6xl">
        <div className="glass bubble relative flex items-center gap-3 px-5 py-4">
          {/* Brand */}
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-lg font-semibold tracking-tight text-slate-900 transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:text-white dark:focus-visible:ring-offset-slate-900 md:text-xl"
            aria-label="Ir al dashboard"
          >
            <span className="emoji">✨</span>
            <span>Sanoa</span>
          </Link>

          {/* Main nav */}
          <nav
            className="ml-4 flex min-w-0 flex-1 items-center gap-2 overflow-x-auto whitespace-nowrap"
            aria-label="Secciones principales"
          >
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
                    "glass-btn bubble text-base font-semibold text-slate-700 transition-colors focus-visible:ring-2 focus-visible:ring-sky-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:text-slate-100 dark:focus-visible:ring-offset-slate-900",
                    isActive
                      ? "neon bg-white/85 text-slate-900 dark:bg-slate-900/70 dark:text-white"
                      : "bg-white/60 hover:bg-white/75 dark:bg-slate-950/40 dark:hover:bg-slate-950/55",
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

          <div className="ml-auto flex items-center gap-2">
            <div
              className="hidden flex-wrap items-center justify-end gap-2 sm:flex"
              aria-label="Accesos rápidos"
            >
              {QUICK_LINKS.map((item) => {
                const isActive =
                  pathname === item.href ||
                  (item.href !== "/" && pathname.startsWith(item.href + "/"));

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "glass-btn bubble text-base font-semibold text-slate-700 transition-colors focus-visible:ring-2 focus-visible:ring-sky-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:text-slate-100 dark:focus-visible:ring-offset-slate-900",
                      isActive
                        ? "neon bg-white/85 text-slate-900 dark:bg-slate-900/70 dark:text-white"
                        : "bg-white/60 hover:bg-white/75 dark:bg-slate-950/40 dark:hover:bg-slate-950/55",
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

            <ActiveOrgInspector />

            <button
              onClick={handleSignOut}
              disabled={signingOut}
              className="glass-btn neon inline-flex shrink-0 items-center gap-2 text-base text-rose-600 transition-colors hover:bg-white/75 disabled:cursor-not-allowed disabled:opacity-70 focus-visible:ring-2 focus-visible:ring-rose-400/60 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:text-rose-200 dark:hover:bg-slate-950/55 dark:focus-visible:ring-offset-slate-900"
              aria-busy={signingOut}
            >
              <span className="emoji" aria-hidden>
                🔓
              </span>
              {signingOut ? "Cerrando…" : "Cerrar sesión"}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
