"use client";

import React, { createContext, useContext } from "react";
import type { EmojiMode } from "@/config/emojiTheme";

export type EmojiTheme = {
  mode?: EmojiMode; // modo global por defecto
  color?: string; // color global por defecto
  accentColor?: string; // acento global por defecto
  perEmoji?: Record<string, Record<string, string>>; // overrides por emoji
};

const EmojiThemeContext = createContext<EmojiTheme>({});

export function EmojiProvider({
  mode,
  color,
  accentColor,
  perEmoji,
  children,
}: React.PropsWithChildren<EmojiTheme>) {
  return (
    <EmojiThemeContext.Provider value={{ mode, color, accentColor, perEmoji }}>
      {children}
    </EmojiThemeContext.Provider>
  );
}

export function useEmojiTheme() {
  return useContext(EmojiThemeContext);
}
