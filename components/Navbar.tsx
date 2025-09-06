"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import ColorEmoji from "@/components/ColorEmoji";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

function NavItem({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const active =
    pathname === href ||
    (href !== "/" && pathname?.startsWith(href) ? true : false);

  return (
    <Link
      href={href}
      className={[
        "inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition",
        active
          ? "bg-[var(--color-brand-primary)] text-white"
          : "text-[var(--color-brand-text)]/80 hover:bg-[var(--color-brand-background)]",
      ].join(" ")}
    >
      {children}
    </Link>
  );
}

export default function Navbar() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setEmail(data.user?.email ?? null);
    });
  }, []);

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      alert("No se pudo cerrar sesión");
      return;
    }
    router.push("/login");
  };

  const initial = email?.charAt(0).toUpperCase() ?? "•";

  return (
    <header className="sticky top-0 z-40 w-full bg-white/90 backdrop-blur border-b border-[var(--color-brand-border)]">
      <div className="mx-auto max-w-6xl px-4 py-3 flex items-center gap-3">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2 group">
          <ColorEmoji
            emoji="🌿"
            size={26}
            toneA="var(--color-brand-primary)"
            toneB="var(--color-brand-coral)"
            className="translate-y-[1px]"
          />
          <span className="text-lg font-semibold text-[var(--color-brand-text)] group-hover:opacity-90">
            Sanoa
          </span>
        </Link>

        {/* Nav (desktop) */}
        <nav className="ml-4 hidden md:flex items-center gap-2">
          <NavItem href="/dashboard">
            <ColorEmoji emoji="📊" size={16} toneA="#fff" toneB="#fff" />
            Dashboard
          </NavItem>
          <NavItem href="/test-ui/upload">
            <ColorEmoji emoji="📤" size={16} toneA="#fff" toneB="#fff" />
            Subidas
          </NavItem>
        </nav>

        <div className="flex-1" />

        {/* User */}
        <div className="hidden md:flex items-center gap-3">
          {email ? (
            <>
              <div className="h-8 w-8 grid place-items-center rounded-full bg-[var(--color-brand-primary)] text-white font-semibold">
                {initial}
              </div>
              <span className="text-sm text-[var(--color-brand-text)]/80">
                {email}
              </span>
              <button
                onClick={signOut}
                className="inline-flex items-center gap-2 rounded-xl bg-[var(--color-brand-coral)] px-3 py-2 text-white text-sm font-medium hover:opacity-95 transition"
              >
                <ColorEmoji emoji="🚪" size={16} toneA="#fff" toneB="#fff" />
                Salir
              </button>
            </>
          ) : (
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-xl bg-[var(--color-brand-primary)] px-3 py-2 text-white text-sm font-medium hover:opacity-95 transition"
            >
              <ColorEmoji emoji="🔐" size={16} toneA="#fff" toneB="#fff" />
              Entrar
            </Link>
          )}
        </div>

        {/* Mobile toggle */}
        <button
          className="md:hidden ml-2 rounded-lg ring-1 ring-[var(--color-brand-border)] px-2 py-1 text-[var(--color-brand-text)]/80"
          aria-label="Abrir menú"
          onClick={() => setOpen((v) => !v)}
        >
          <ColorEmoji
            emoji={open ? "✖️" : "☰"}
            size={18}
            toneA="var(--color-brand-text)"
            toneB="var(--color-brand-bluegray)"
          />
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden border-t border-[var(--color-brand-border)] bg-white">
          <div className="mx-auto max-w-6xl px-4 py-3 flex flex-col gap-2">
            <NavItem href="/dashboard">
              <ColorEmoji emoji="📊" size={16} toneA="#fff" toneB="#fff" />
              Dashboard
            </NavItem>
            <NavItem href="/test-ui/upload">
              <ColorEmoji emoji="📤" size={16} toneA="#fff" toneB="#fff" />
              Subidas
            </NavItem>

            <div className="h-px bg-[var(--color-brand-border)] my-2" />

            {email ? (
              <button
                onClick={signOut}
                className="inline-flex items-center gap-2 rounded-xl bg-[var(--color-brand-coral)] px-3 py-2 text-white text-sm font-medium hover:opacity-95 transition w-fit"
              >
                <ColorEmoji emoji="🚪" size={16} toneA="#fff" toneB="#fff" />
                Salir
              </button>
            ) : (
              <Link
                href="/login"
                className="inline-flex items-center gap-2 rounded-xl bg-[var(--color-brand-primary)] px-3 py-2 text-white text-sm font-medium hover:opacity-95 transition w-fit"
              >
                <ColorEmoji emoji="🔐" size={16} toneA="#fff" toneB="#fff" />
                Entrar
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
