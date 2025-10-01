"use client";
import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import OrgSwitcherBadge from "./OrgSwitcherBadge";

export default function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 shadow-sm">
      <nav className="container h-[64px] flex items-center gap-3">
        <div className="flex items-center gap-3">
          <OrgSwitcherBadge />
          <Link href="/" className="font-bold text-lg" aria-label="Inicio Sanoa">
            Sanoa
          </Link>
        </div>

        <div className="ml-auto hidden md:flex items-center gap-6">
          <Link href="/consultorio" className="text-sm hover:opacity-80">Consultorio</Link>
          <Link href="/pacientes" className="text-sm hover:opacity-80">Pacientes</Link>
          <Link href="/especialidades" className="text-sm hover:opacity-80">Especialidades</Link>
          <Link href="/banco" className="text-sm hover:opacity-80">Banco</Link>
          <Button asChild variant="primary" size="md" className="font-bold">
            <Link href="/signup">Crear cuenta</Link>
          </Button>
        </div>

        {/* Mobile */}
        <button
          className="md:hidden btn-base ghost"
          aria-label="Menú"
          onClick={() => setOpen((s) => !s)}
        >
          ☰
        </button>
      </nav>

      {open && (
        <div className="md:hidden border-t border-border bg-background">
          <div className="container py-3 flex flex-col gap-2">
            <Link href="/consultorio" className="py-2">Consultorio</Link>
            <Link href="/pacientes" className="py-2">Pacientes</Link>
            <Link href="/especialidades" className="py-2">Especialidades</Link>
            <Link href="/banco" className="py-2">Banco</Link>
            <Button asChild variant="primary" className="mt-1">
              <Link href="/signup">Crear cuenta</Link>
            </Button>
          </div>
        </div>
      )}
    </header>
  );
}
