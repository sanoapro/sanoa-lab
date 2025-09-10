"use client";

import ColorEmoji from "./ColorEmoji";
import { emojiTheme, getEmojiChar, getEmojiSettings, EmojiTokenName } from "@/config/emojiTheme";

type Props =
  | { name: EmojiTokenName; size?: number; className?: string; title?: string }
  | { name: string; size?: number; className?: string; title?: string };

export default function Emoji(props: Props) {
  const { name, size = 22, className = "", title } = props as any;
  const char = getEmojiChar(name);
  const settings = getEmojiSettings(char);

  return (
    <ColorEmoji
      emoji={char}
      size={size}
      mode={settings.mode ?? emojiTheme.global.mode}
      color={settings.color ?? emojiTheme.global.color}
      accentColor={settings.accentColor ?? emojiTheme.global.accentColor}
      className={className}
      title={title}
    />
  );
}
