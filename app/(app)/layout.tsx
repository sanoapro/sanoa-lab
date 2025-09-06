// app/(app)/layout.tsx
import type { ReactNode } from "react";
import AppShell from "@/components/AppShell"; // ya existe en tu repo

export default function AppGroupLayout({ children }: { children: ReactNode }) {
  // Si AppShell necesita props, pásalas aquí.
  // Mantengo esto minimal para no pisar tu AppShell actual.
  return <AppShell>{children}</AppShell>;
}
