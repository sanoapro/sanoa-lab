import ThemeToggle from "@/components/ThemeToggle";
import SiteFooter from "@/components/SiteFooter";
import Toaster from "@/components/Toaster";
import type { Metadata } from "next";
import "./globals.css";
import { Poppins, Lato } from "next/font/google";
import Providers from "./providers";

/* Fuentes: expuestas como variables CSS */
const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-poppins",
});

const lato = Lato({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-lato",
});

export const metadata: Metadata = {
  title: "Sanoa Lab",
  description: "Ecosistema clínico modular — Sanoa Lab",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body
        className={`${poppins.variable} ${lato.variable} font-body text-[var(--color-brand-text)] bg-[var(--color-brand-background)] min-h-dvh`}
      >
        <Providers>
          {children}
          {/* Contenedor del portal de toasts (presente en SSR, poblado en cliente) */}
          <div id="toast-root" />
        </Providers>
      </body>
    </html>
  );
}
