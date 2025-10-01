import type { Metadata, Viewport } from "next";
import "./globals.css";
import Providers from "./providers";

const bodyClass =
  "font-body text-[var(--color-brand-text)] min-h-dvh antialiased bg-[length:100%_100%]";

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
      <body className={bodyClass}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
