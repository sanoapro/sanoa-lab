// components/Navbar.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import OrgSwitcher from "@/components/OrgSwitcher";
import DensityToggle from "./DensityToggle";
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
  const pathname = usePathname();

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

        {/* Quick links + density */}
        <div className="ml-auto hidden sm:flex flex-wrap items-center justify-end gap-2" aria-label="Accesos rápidos">
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

          <DensityToggle />
        </div>
      </div>
    </nav>
  );
}
