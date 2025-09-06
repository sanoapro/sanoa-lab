"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";

const nav = [
  { href: "/dashboard", label: "Tablero", emoji: "📊" },
  { href: "/test-ui", label: "Zona de pruebas", emoji: "🧪" },
  { href: "/test-ui/upload", label: "Subir archivos", emoji: "📤" },
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--color-brand-border)] bg-[var(--color-brand-background)]/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link
          href="/dashboard"
          className="text-lg font-semibold text-[var(--color-brand-text)]"
        >
          <span className="mr-2">🌿</span>
          Sanoa
        </Link>

        <nav className="flex items-center gap-1">
          {nav.map((item) => {
            const active =
              pathname === item.href ||
              (item.href !== "/" && pathname?.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                className={clsx(
                  "rounded-xl px-3 py-2 text-sm transition-colors",
                  active
                    ? "bg-[var(--color-brand-primary)]/15 text-[var(--color-brand-text)]"
                    : "text-[var(--color-brand-text)]/80 hover:bg-[var(--color-brand-primary)]/10 hover:text-[var(--color-brand-text)]"
                )}
              >
                <span className="mr-1">{item.emoji}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
