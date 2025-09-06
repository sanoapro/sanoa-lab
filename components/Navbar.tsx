"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import ColorEmoji from "@/components/ColorEmoji";

type Item = { href: string; label: string; emoji: string };

const items: Item[] = [
  { href: "/dashboard",      label: "Tablero",     emoji: "📊" },
  { href: "/test-ui/upload", label: "Mis archivos",emoji: "🗂️" },
  { href: "/perfil",         label: "Perfil",      emoji: "👤" },
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <nav
      className="
        sticky top-0 z-40 backdrop-blur-md border-b border-[var(--color-brand-border)]
        bg-[color-mix(in_oklab,white_82%,var(--color-brand-background)_18%)]
      "
    >
      <div className="mx-auto max-w-6xl px-4 py-3 flex items-center gap-4">
        {/* Marca */}
        <Link href="/dashboard" className="flex items-center gap-2">
          <ColorEmoji emoji="🍃" mode="native" />
          <span className="font-semibold text-[var(--color-brand-text)]">Sanoa</span>
        </Link>

        {/* Navegación */}
        <ul className="ml-auto flex items-center gap-1">
          {items.map((it) => {
            const active = pathname === it.href;
            return (
              <li key={it.href}>
                <Link
                  href={it.href}
                  className={`
                    inline-flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition
                    ${active
                      ? "bg-[var(--color-brand-primary)] text-white"
                      : "text-[var(--color-brand-text)] hover:bg-white border border-transparent hover:border-[var(--color-brand-border)]"}
                  `}
                >
                  <ColorEmoji emoji={it.emoji} mode={it.emoji === "📊" ? "duotone" : "duotone"} />
                  {it.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
