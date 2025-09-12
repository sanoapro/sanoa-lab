import type { Metadata } from "next";
import "./globals.css";
import { Poppins, Lato } from "next/font/google";
import Providers from "./providers";

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
      <body className={`${poppins.variable} ${lato.variable} font-body text-[var(--color-brand-text)] min-h-dvh`}>
        <Providers>
          {children}
          <div id="toast-root" />
        </Providers>
      </body>
    </html>
  );
}
