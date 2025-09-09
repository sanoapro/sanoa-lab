export type EmojiMode = "duotone" | "mono" | "native";

type EmojiSettings = {
  mode?: EmojiMode;
  color?: string;
  accentColor?: string;
};

export const emojiTheme: {
  global: Required<EmojiSettings>;
  perEmoji: Record<string, EmojiSettings>;
} = {
  global: {
    mode: "duotone",
    color: "#D97A66", // terracota (brand)
    accentColor: "#3E4C59", // bluegray (texto/contraste)
  },
  // Overrides puntuales (incluye variantes sin/ con VS-16)
  perEmoji: {
    // Identidades que deben verse nativas
    "📧": { mode: "native" },
    "🌐": { mode: "native" },
    "🗑": { mode: "native" },
    "🗑️": { mode: "native" },
    "🍃": { mode: "native" },

    // Duotono para íconos de UI (buen contraste)
    "🔐": { mode: "duotone" },
    "🔑": { mode: "duotone" },
    "💾": { mode: "duotone" },
    "🧪": { mode: "duotone" },
    "📤": { mode: "duotone" },
    "🗂️": { mode: "duotone" },
    "👁️": { mode: "duotone" },

    // Puedes seguir afinando acá...
  },
};

// ====== TOKENS SEMÁNTICOS ======
export const emojiTokens = {
  // Auth / navegación
  email: "📧",
  enviar: "📨",
  atras: "⬅️",
  refrescar: "🔄",
  info: "ℹ️",
  candado: "🔐",
  guardar: "💾",
  siguiente: "➡️",
  web: "🌐",
  llave: "🔑",
  magia: "✨",
  reloj: "⏳",

  // App
  tablero: "🧭",
  subir: "��",
  carpeta: "🗂️",
  ver: "👁️",
  laboratorio: "🧪",

  // PWA / instalación
  offline: "📴",
  instalar: "📲",
  ok: "✅",
  ios: "🍎",
  android: "🤖",
  escritorio: "🖥️",
  home: "🏠",
  dashboard: "📊",
  actualizar: "🔄",
  nube: "☁️",
  archivo: "📄",
  descargar: "⬇️",
  copiar: "🔗",
  borrar: "🗑️",
  exportar: "📄",
  actividad: "📜",
};

export type EmojiTokenName = keyof typeof emojiTokens;

// ====== HELPERS ======
const VS16 = /\uFE0F/g;
export function stripVS(s: string) {
  return s.replace(VS16, "");
}

export function getEmojiChar(nameOrChar: string): string {
  if (nameOrChar in emojiTokens) {
    return (emojiTokens as Record<string, string>)[nameOrChar];
  }
  return nameOrChar;
}

export function getEmojiSettings(emojiChar: string): Required<EmojiSettings> {
  const base = emojiTheme.global;
  const ov = emojiTheme.perEmoji[emojiChar] || emojiTheme.perEmoji[stripVS(emojiChar)] || {};
  return {
    mode: (ov.mode || base.mode) as EmojiMode,
    color: ov.color ?? base.color,
    accentColor: ov.accentColor ?? base.accentColor,
  };
}

export type EmojiPerItem = EmojiSettings;
