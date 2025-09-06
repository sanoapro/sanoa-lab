// app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";
import { Poppins, Lato } from "next/font/google";

import { EmojiProvider } from "@/components/EmojiTheme";
import { emojiTheme } from "@/config/emojiTheme";

/* Cargamos fuentes y exponemos variables CSS:
   --font-poppins y --font-lato (las usamos en @theme) */
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
    <html
      lang="es"
      // Este atributo es opcional, pero útil si quisieras forzar modo desde HTML:
      data-emoji-mode={emojiTheme.global.mode}
    >
      <body className={`${poppins.variable} ${lato.variable} font-body text-brand-text bg-brand-background`}>
        <EmojiProvider
          mode={emojiTheme.global.mode}
          color={emojiTheme.global.color}
          accentColor={emojiTheme.global.accentColor}
          perEmoji={emojiTheme.perEmoji}
        >
          {children}
        </EmojiProvider>
      </body>
    </html>
  );
}
