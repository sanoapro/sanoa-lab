import type { ReactNode } from "react";
import Navbar from "./Navbar";

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    // Fondo global ya viene de globals.css (body → --app-bg)
    <div className="min-h-svh text-[var(--color-brand-text)]">
      <Navbar />
      <main id="main" role="main" className="mx-auto max-w-6xl px-4 py-8">
        {children}
      </main>
      <footer
        role="contentinfo"
        className="surface-light mt-12 border-t border-[var(--color-brand-border)] bg-white/70 backdrop-blur"
      >
        <div className="mx-auto max-w-6xl px-4 py-4 text-xs text-[var(--color-brand-text)]/70">
          Hecho con 🤍 para LATAM — Sanoa
        </div>
      </footer>
    </div>
  );
}
