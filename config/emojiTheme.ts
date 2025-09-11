export const emojiTheme = {
  // Marca / generales
  logo: "svg:icons/logo", // asegura public/icons/logo.svg (placeholder abajo)
  info: "ℹ️",
  ok: "✅",
  error: "⚠️",

  // Navegación principal
  tablero: "��",
  cargas: "📤",
  perfil: "👤",

  // Autenticación
  email: "✉️",
  llave: "🔑",
  candado: "lucide:Lock",
  atras: "◀️",
  siguiente: "➡️",

  // Aliases / varios
  web: "🌐",
  leaf: "🍃",
  google: "G", // si no quieres SVG, esta letra funciona de mientras
} as const;

export const EMOJI_FALLBACK_TOKEN: keyof typeof emojiTheme = "info";
export type EmojiToken = keyof typeof emojiTheme;
