import type { ReactNode } from "react";
import Navbar from "./Navbar";

export default function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh bg-[var(--color-brand-background)] text-[var(--color-brand-text)]">
      <Navbar />
      <main className="mx-auto max-w-6xl px-4 py-8">
        {children}
      </main>
      <footer className="mt-12 border-t border-[var(--color-brand-border)] bg-white/60">
        <div className="mx-auto max-w-6xl px-4 py-4 text-xs text-[var(--color-brand-text)]/70">
          Hecho con 🤍 para LATAM — Sanoa
        </div>
      </footer>
    </div>
  );
}
