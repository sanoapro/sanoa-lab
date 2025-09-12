import type { ReactNode } from "react";
import Navbar from "./Navbar";

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    // SIN fondo aquí; el fondo global viene de globals.css (body → var(--app-bg))
    <div className="min-h-dvh text-[var(--color-brand-text)]">
      <Navbar />
      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
      <footer className="mt-12 border-t border-[var(--color-brand-border)] bg-white/60">
        <div className="mx-auto max-w-6xl px-4 py-4 text-xs text-[var(--color-brand-text)]/70">
          Hecho con 🤍 para LATAM — Sanoa
        </div>
      </footer>
    </div>
  );
}
