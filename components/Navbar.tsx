// components/Navbar.tsx
"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import OrgSwitcher from "@/components/OrgSwitcher";
import DensityToggle from "./DensityToggle";
import ActiveOrgInspector from "@/components/organizations/ActiveOrgInspector";
import { cn } from "@/lib/utils";
import { getSupabaseBrowser } from "@/lib/supabase-browser";

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
  const pathname = usePathname();
  const router = useRouter();
  const [signingOut, setSigningOut] = React.useState(false);

  async function handleSignOut() {
    try {
      setSigningOut(true);
      const supa = getSupabaseBrowser();
      await supa.auth.signOut();
      router.push("/login");
      router.refresh();
    } catch {
      // opcional: podrías mostrar un toast si tienes un sistema de notificaciones
    } finally {
      setSigningOut(false);
    }
  }

  return (
    <nav className="sticky top-0 z-40 glass-card bubble nav-lg !rounded-2xl mx-2 mt-2">
      <div className="flex flex-wrap items-center gap-3 px-2 md:px-3">
        {/* Brand + Org */}
        <div className="flex items-center gap-3 min-w-0">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-lg font-semibold tracking-tight"
            aria-label="Ir al dashboard"
          >
            <span className="emoji" aria-hidden>✨</span>
            <span>Sanoa</span>
          </Link>

          <OrgSwitcher />
        </div>

        {/* Main nav */}
        <nav
          className="flex min-w-0 flex-1 items-center gap-2 overflow-x-auto whitespace-nowrap"
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
                  "glass-btn bubble text-sm md:text-base font-semibold transition-colors",
                  isActive
                    ? "neon bg-white/85 text-slate-900 dark:bg-slate-900/70 dark:text-white"
                    : "bg-white/60 hover:bg-white/75 dark:bg-slate-950/40 dark:hover:bg-slate-950/55",
                )}
                title={item.label}
              >
                <span className="emoji mr-1" aria-hidden>{item.emoji}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Quick links + tools */}
        <div className="ml-auto flex items-center gap-2">
          <div
            className="hidden sm:flex flex-wrap items-center justify-end gap-2"
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
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "glass-btn bubble text-sm md:text-base font-semibold transition-colors",
                    isActive
                      ? "neon bg-white/85 text-slate-900 dark:bg-slate-900/70 dark:text-white"
                      : "bg-white/60 hover:bg-white/75 dark:bg-slate-950/40 dark:hover:bg-slate-950/55",
                  )}
                  title={item.label}
                >
                  <span className="emoji mr-1" aria-hidden>{item.emoji}</span>
                  {item.label}
                </Link>
              );
            })}
          </div>

          <ActiveOrgInspector />

          <button
            onClick={handleSignOut}
            disabled={signingOut}
            className="glass-btn neon inline-flex shrink-0 items-center gap-2 text-sm md:text-base text-rose-600 transition-colors hover:bg-white/75 disabled:cursor-not-allowed disabled:opacity-70 focus-visible:ring-2 focus-visible:ring-rose-400/60 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:text-rose-200 dark:hover:bg-slate-950/55 dark:focus-visible:ring-offset-slate-900"
            aria-busy={signingOut}
          >
            <span className="emoji" aria-hidden>🔓</span>
            {signingOut ? "Cerrando…" : "Cerrar sesión"}
          </button>

          <DensityToggle />
        </div>
      </div>
    </nav>
  );
}
