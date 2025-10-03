"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";

const items = [
  { href: "/dashboard", label: "Dashboard", emoji: "📊" },
  { href: "/consultorio", label: "Consultorio", emoji: "🏥" },
  { href: "/pacientes", label: "Pacientes", emoji: "🧑‍⚕️" },
  { href: "/agenda", label: "Agenda", emoji: "📅" },
  { href: "/banco", label: "Sanoa Bank", emoji: "🏦" },
  { href: "/especialidades", label: "Especialidades", emoji: "🧩" },
  { href: "/reportes", label: "Reportes", emoji: "📈" },
  { href: "/ajustes", label: "Ajustes", emoji: "⚙️" },
];

export default function Sidebar(){
  const pathname = usePathname();
  return (
    <aside className="sidebar glass-card bubble">
      {items.map((it: any) => {
        const active = pathname?.startsWith(it.href);
        return (
          <Link
            key={it.href}
            href={it.href}
            className={clsx("hover-glow text-[15px] sm:text-base", active && "neon")}
            aria-current={active ? "page" : undefined}
          >
            <span className="emoji">{it.emoji}</span>
            <span>{it.label}</span>
          </Link>
        );
      })}
    </aside>
  );
}
