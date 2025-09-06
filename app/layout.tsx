import type { Metadata } from "next";
import "./globals.css";
import { Poppins, Lato } from "next/font/google";
import Providers from "./providers";

/* Fuentes expuestas como variables CSS */
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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body
        className={`${poppins.variable} ${lato.variable} font-body text-brand-text bg-brand-background`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
