export type EmojiMode = "duotone" | "mono" | "native";

export const emojiTheme = {
  global: {
    mode: "duotone" as EmojiMode,
    color: "#D97A66",        // base terracota
    accentColor: "#3E4C59",  // texto (contraste)
  },
  // Overrides puntuales por emoji (incluye variantes sin/ con VS-16)
  perEmoji: {
    "📧": { mode: "native" as EmojiMode },
    "🌐": { mode: "native" as EmojiMode },
    "🗑": { mode: "native" as EmojiMode },
    "🗑️": { mode: "native" as EmojiMode },
    "🍃": { mode: "native" as EmojiMode },
    "🔐": { mode: "duotone" as EmojiMode },
    "🔑": { mode: "duotone" as EmojiMode },
  } as Record<string, { mode?: EmojiMode; color?: string; accentColor?: string }>,
};

// Mapa semántico → carácter (cambia aquí y se refleja en toda la app)
export const emojiTokens = {
  // auth & navegación
  login: "🔐",
  key: "🔑",
  email: "📧",
  google: "🌐",
  siguiente: "➡️",
  atras: "⬅️",
  home: "🏠",
  info: "ℹ️",
  alerta: "⚠️",
  copiar: "📋",
  espera: "⏳",

  // identidad / UX
  hoja: "🍃",
  usuario: "👤",
  pacientes: "👥",

  // tablero / secciones
  tablero: "🧭",
  laboratorio: "🧪",

  // archivos / storage
  subir: "⤴️",
  subirBandeja: "📤",
  carpeta: "🗂️",
  documentos: "🗂️",
  archivo: "📄",
  ver: "👁️",
  descargar: "⬇️",
  enlace: "🔗",
  borrar: "🗑️",
  refrescar: "🔄",
  imagen: "🖼️",
  limpiar: "🧹",
  guardar: "💾",
  salir: "🚪",

  // varios
  busqueda: "🔍",
  dashboard: "📊",
  puzzle: "🧩",
} as const;

export type EmojiTokenName = keyof typeof emojiTokens;

export function getEmojiChar(nameOrChar: string): string {
  if ((nameOrChar as EmojiTokenName) in emojiTokens) {
    return emojiTokens[nameOrChar as EmojiTokenName];
  }
  return nameOrChar;
}

function stripVS(s: string) {
  // quita variantes de estilo (VS-16) para que los overrides "agarren"
  return s.replace(/\uFE0F/g, "");
}

export function getEmojiSettings(emojiOrToken: string) {
  const char = getEmojiChar(emojiOrToken);
  const base = emojiTheme.global;
  const ov = emojiTheme.perEmoji[char] || emojiTheme.perEmoji[stripVS(char)] || {};
  return {
    mode: ov.mode ?? base.mode,
    color: ov.color ?? base.color,
    accentColor: ov.accentColor ?? base.accentColor,
  };
}
