import "@/sentry.server.config";
import type { Metadata } from "next";
import "./globals.css";
import { Poppins, Lato } from "next/font/google";
import Providers from "./providers";
import Toaster from "@/components/Toaster";

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
        className={`${poppins.variable} ${lato.variable} antialiased text-[var(--color-brand-text)] min-h-dvh bg-transparent`}
      >
        <Providers>
          {children}
          {/* Contenedor del portal de toasts (presente en SSR, poblado en cliente) */}
          <div id="toast-root" />
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}