// components/AppShell.tsx
import Navbar from "@/components/Navbar";

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[var(--color-brand-background)]">
      <Navbar />
      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
      <footer className="mt-16 border-t border-[var(--color-brand-border)]/80">
        <div className="mx-auto max-w-6xl px-4 py-6 text-sm text-[var(--color-brand-text)]/60">
          © {new Date().getFullYear()} Sanoa — Hecho con cariño.
        </div>
      </footer>
    </div>
  );
}
