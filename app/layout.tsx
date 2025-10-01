import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import Providers from "./providers";
import AppShell from "@/components/AppShell"; // ← ajusta la ruta si es necesario

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });
const jakarta = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--font-display" });

// Centraliza las clases del <body> (mantiene antialias y variables de fuente)
const bodyClass = `${inter.variable} ${jakarta.variable} antialiased`;

export const metadata: Metadata = {
  title: "Sanoa Lab",
  description: "Ecosistema clínico modular — Sanoa Lab",
  icons: { icon: "/icons/logo.svg" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#d97a66",
  colorScheme: "light dark",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={bodyClass} data-theme="light">
        <Providers>
          <AppShell>{children}</AppShell>
        </Providers>
      </body>
    </html>
  );
}
