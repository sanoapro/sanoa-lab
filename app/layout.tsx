import type { Metadata, Viewport } from "next";
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
      <body
        className={`${poppins.variable} ${lato.variable} font-body text-[var(--color-brand-text)] min-h-dvh antialiased`}
      >
        {/* Nodo para portales de toasts */}
        <div id="toast-root" />
        {/* Providers (incluye ToastProvider) */}
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
