import RegisterSW from '@/components/RegisterSW';
// app/(app)/layout.tsx
import type { Metadata } from "next";
import AppShell from "@/components/AppShell";
import AuthGate from "@/components/AuthGate";

export const metadata: Metadata = {
  title: "Sanoa — Tablero",
};

export default function AppGroupLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGate>
      <AppShell>{children}</AppShell>
    </AuthGate>
  );
}
