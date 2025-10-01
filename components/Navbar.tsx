// components/Navbar.tsx
"use client";

import Link from "next/link";
import { useState } from "react";
import OrgSwitcherBadge from "./OrgSwitcherBadge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Menu } from "lucide-react";

const links = [
  { href: "/dashboard", label: "Inicio" },
  { href: "/consultorio", label: "Consultorio" },
  { href: "/pacientes", label: "Pacientes" },
  { href: "/especialidades", label: "Especialidades" },
  { href: "/reportes/agenda/risk-pacientes", label: "Reportes" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 border-b border-border shadow-sm">
      <div className="container h-16 flex items-center gap-3">
        <div className="flex items-center gap-3">
          <button
            className="md:hidden inline-flex items-center justify-center rounded-md h-10 w-10 border border-transparent hover:border-border"
            aria-label="Abrir menú"
            onClick={() => setOpen((v) => !v)}
          >
            <Menu className="emoji" size={20} />
          </button>
          <Link href="/" className="font-bold text-lg leading-none">
            Sanoa<span className="text-primary">Lab</span>
          </Link>
        </div>

        <nav className={cn("hidden md:flex items-center gap-4 ml-4")}>
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="text-sm hover:underline underline-offset-4">
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <OrgSwitcherBadge />
          <Button asChild variant="primary" className="hidden sm:inline-flex">
            <Link href="/prescriptions/templates">Nueva receta</Link>
          </Button>
        </div>
      </div>

      {/* Mobile nav */}
      {open && (
        <div className="md:hidden border-t border-border bg-card">
          <nav className="container py-2 grid">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="px-1 py-2 text-sm border-b last:border-b-0 border-border"
                onClick={() => setOpen(false)}
              >
                {l.label}
              </Link>
            ))}
            <div className="pt-3 pb-2">
              <Button asChild variant="primary" className="w-full" onClick={() => setOpen(false)}>
                <Link href="/prescriptions/templates">Nueva receta</Link>
              </Button>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
