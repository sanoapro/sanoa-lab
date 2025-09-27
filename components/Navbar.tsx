// components/Navbar.tsx
"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import ColorEmoji from "@/components/ColorEmoji";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import { useToastSafe } from "@/components/Toast";

type NavItem = { href: string; label: string; token: string };

const NAV: NavItem[] = [
  { href: "/dashboard", label: "Tablero", token: "tablero" },
  { href: "/agenda", label: "Agenda", token: "agenda" },
  { href: "/pacientes", label: "Pacientes", token: "pacientes" },
  { href: "/laboratorio", label: "Laboratorio", token: "laboratorio" },
  { href: "/modulos", label: "Módulos", token: "carpeta" },
  { href: "/recordatorios", label: "Recordatorios", token: "recordatorios" },
  { href: "/reportes", label: "Reportes", token: "reportes" },
  { href: "/banco", label: "Banco", token: "banco" },
  { href: "/ajustes/plan", label: "Plan", token: "plan" },
];

// Subnavegación contextual para Banco
const BANK_NAV: { href: string; label: string }[] = [
  { href: "/banco", label: "Resumen" },
  { href: "/banco/tx", label: "Transacciones" },
  { href: "/banco/reglas", label: "Reglas" },
  { href: "/banco/presupuestos", label: "Presupuestos" },
];

export default function Navbar() {
  const pathname = usePathname() || "";
  const router = useRouter();
  const supabase = getSupabaseBrowser();
  const { toast } = useToastSafe();
  const [signingOut, setSigningOut] = useState(false);

  const isBank = useMemo(
    () => pathname === "/banco" || pathname.startsWith("/banco/"),
    [pathname]
  );

  function isActive(href: string) {
    return pathname === href || (href !== "/dashboard" && pathname.startsWith(href + "/"));
  }

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
      {/* Barra principal */}
      <div className="mx-auto max-w-6xl px-4 h-16 flex items-center justify-between gap-4">
        {/* Brand */}
        <Link href="/dashboard" className="inline-flex items-center gap-2" aria-label="Ir al tablero">
          <span className="inline-grid place-content-center h-9 w-9 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
            <ColorEmoji token="logo" />
          </span>
          <span className="font-semibold text-slate-900 dark:text-white">Sanoa</span>
        </Link>

        {/* Nav */}
        <nav className="hidden md:flex items-center gap-1" aria-label="Navegación principal">
          {NAV.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={[
                  "inline-flex items-center gap-2 px-3 py-2 rounded-lg border transition",
                  "text-slate-700 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-white/10",
                  active ? "bg-white dark:bg-white/10 border-slate-200 dark:border-slate-700" : "border-transparent",
                ].join(" ")}
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
            className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-rose-500 text-white hover:brightness-95 active:brightness-90 disabled:opacity-60 disabled:cursor-not-allowed transition"
            title="Cerrar sesión"
          >
            <ColorEmoji token="desbloquear" />
            <span>Cerrar sesión</span>
          </button>
        </div>
      </div>

      {/* Subnavegación contextual: Banco */}
      {isBank && (
        <div className="border-t border-slate-200 dark:border-slate-700">
          <div className="mx-auto max-w-6xl px-4 h-12 flex items-center gap-2 overflow-x-auto" aria-label="Navegación de Banco">
            {BANK_NAV.map((it) => {
              const active = pathname === it.href || pathname.startsWith(it.href + "/");
              return (
                <Link
                  key={it.href}
                  href={it.href}
                  aria-current={active ? "page" : undefined}
                  className={[
                    "inline-flex items-center px-3 py-1.5 rounded-lg border text-sm transition",
                    active
                      ? "bg-white dark:bg-white/10 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                      : "border-transparent text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/10",
                  ].join(" ")}
                >
                  {it.label}
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </header>
  );
}
