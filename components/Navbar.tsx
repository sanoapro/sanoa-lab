"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import ColorEmoji from "@/components/ColorEmoji";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import { useToast } from "@/components/Toast";

type NavItem = { href: string; label: string; token: string };

const NAV: NavItem[] = [
  { href: "/dashboard",      label: "Tablero",     token: "tablero" },
  { href: "/agenda",         label: "Agenda",      token: "agenda" },
  { href: "/test-ui/upload", label: "Importar",    token: "cargas" },
  { href: "/pacientes",      label: "Pacientes",   token: "pacientes" },
  { href: "/laboratorio",    label: "Laboratorio", token: "laboratorio" },
  { href: "/perfil",         label: "Perfil",      token: "perfil" },
];

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = getSupabaseBrowser();
  const { toast } = useToast();

  const [signingOut, setSigningOut] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Cierra el menú móvil al cambiar de ruta
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  async function handleSignOut() {
    try {
      setSigningOut(true);
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      toast({
        variant: "success",
        title: "Sesión cerrada",
        description: "Hasta pronto 👋",
        emoji: "✅",
      });
      router.replace("/login");
    } catch (err: any) {
      toast({
        variant: "error",
        title: "No pudimos cerrar sesión",
        description: err?.message || "Inténtalo nuevamente.",
        emoji: "🛑",
      });
    } finally {
      setSigningOut(false);
    }
  }

  function isActive(href: string) {
    if (!pathname) return false;
    return pathname === href || pathname.startsWith(href + "/");
  }

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-900/80 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      {/* Enlace de salto para accesibilidad */}
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] rounded-lg bg-white px-3 py-2 text-sm shadow"
      >
        Ir al contenido
      </a>

      <div className="mx-auto max-w-6xl px-4 h-16 flex items-center justify-between gap-4">
        {/* Brand */}
        <Link href="/dashboard" className="inline-flex items-center gap-2" aria-label="Ir al tablero">
          <span className="inline-grid place-content-center h-9 w-9 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
            <ColorEmoji token="logo" />
          </span>
          <span className="font-semibold text-slate-900 dark:text-white">Sanoa</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1" aria-label="Principal">
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
                  active
                    ? "bg-white dark:bg-white/10 border-slate-200 dark:border-slate-700"
                    : "border-transparent",
                ].join(" ")}
              >
                <ColorEmoji token={item.token} />
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Right actions (desktop) */}
        <div className="hidden md:flex items-center gap-2">
          <button
            onClick={handleSignOut}
            disabled={signingOut}
            aria-busy={signingOut}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-rose-500 text-white hover:brightness-95 active:brightness-90 disabled:opacity-60 disabled:cursor-not-allowed transition"
            title="Cerrar sesión"
          >
            <ColorEmoji token="desbloquear" />
            <span>{signingOut ? "Saliendo…" : "Cerrar sesión"}</span>
          </button>
        </div>

        {/* Mobile toggle */}
        <button
          type="button"
          className="md:hidden inline-flex items-center justify-center rounded-lg p-2 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-100"
          aria-label="Abrir menú"
          aria-expanded={mobileOpen}
          aria-controls="mobile-nav"
          onClick={() => setMobileOpen((v) => !v)}
        >
          {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>

      {/* Mobile panel */}
      <div
        id="mobile-nav"
        className={`md:hidden border-t border-slate-200 dark:border-slate-700 bg-white/90 dark:bg-slate-900/90 backdrop-blur transition-[max-height,opacity] duration-200 overflow-hidden ${
          mobileOpen ? "max-h-[60vh] opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <nav className="px-4 py-3 space-y-1" aria-label="Principal móvil">
          {NAV.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={[
                  "flex items-center gap-2 rounded-lg border px-3 py-2",
                  "text-slate-700 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-white/10",
                  active
                    ? "bg-white dark:bg-white/10 border-slate-200 dark:border-slate-700"
                    : "border-transparent",
                ].join(" ")}
              >
                <ColorEmoji token={item.token} />
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}

          <div className="pt-2">
            <button
              onClick={handleSignOut}
              disabled={signingOut}
              aria-busy={signingOut}
              className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-rose-500 text-white hover:brightness-95 active:brightness-90 disabled:opacity-60 disabled:cursor-not-allowed transition"
              title="Cerrar sesión"
            >
              <ColorEmoji token="desbloquear" />
              <span>{signingOut ? "Saliendo…" : "Cerrar sesión"}</span>
            </button>
          </div>
        </nav>
      </div>
    </header>
  );
}
