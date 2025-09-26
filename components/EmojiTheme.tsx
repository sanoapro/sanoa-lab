// config/emojiTheme.ts
"use client";

/**
 * Emoji config + helpers para ColorEmoji y Emoji.
 * - `emojiTheme`: tokens -> representación (texto emoji o directiva "lucide:IconName" / "svg:path")
 * - `getEmojiChar(name)`: nombre/token -> carácter emoji (para <Emoji/>)
 * - `getEmojiSettings(char)`: overrides por emoji (modo/color/acento)
 */

export type EmojiMode = "native" | "mono" | "duotone";
type EmojiSettings = { mode?: EmojiMode; color?: string; accentColor?: string };

// ========= Global theme =========

export const EMOJI_FALLBACK_TOKEN = "default";

/** Diccionario base de tokens → representación */
const TOKEN_TO_REPR = {
  // Navegación principal
  tablero: "📊",
  agenda: "📅",
  calendario: "📅",
  pacientes: "🧑‍⚕️",
  laboratorio: "🧪",
  carpeta: "🗂️", // Módulos
  modulos: "🗂️", // alias
  recordatorios: "🔔",
  reportes: "📈",
  banco: "🏦",
  plan: "🧭",

  // Identidad / cuenta / ajustes
  perfil: "🪪",
  desbloquear: "🔓",
  email: "✉️",
  llave: "🔑",
  salir: "🚪",
  logo: "🫧",

  // Acciones comunes
  ver: "👁️",
  buscar: "🔎",
  busqueda: "🔍",
  link: "🔗",
  enlace: "🔗",
  guardar: "💾",
  enviar: "📨",
  copiar: "📋",
  borrar: "🗑️",
  eliminar: "🗑️",
  agregar: "➕",
  descargar: "⬇️",
  subir: "⬆️",
  subirBandeja: "📤",
  archivo: "📄",
  documentos: "📄",
  etiquetas: "🏷️",
  actividad: "📜",
  imagen: "🖼️",
  siguiente: "➡️",
  anterior: "⬅️",
  atras: "◀️",
  refrescar: "🔄",
  actualizar: "🔄",
  ok: "✅",
  info: "ℹ️",
  alerta: "⚠️",
  hoja: "🍃",
  pago: "💳",
  cargas: "💰",
  nube: "☁️",
  instalar: "📲",
  home: "🏠",
  reloj: "⏰",

  // Plataformas
  ios: "🍎",
  android: "🤖",
  escritorio: "🖥️",

  // Piezas/plantillas
  puzzle: "🧩",

  // Suites de especialidad
  mente: "🧠",
  pulso: "💓",
  sonrisa: "🦷",
  equilibrio: "⚖️",

  // Fallback
  [EMOJI_FALLBACK_TOKEN]: "❓",
} as const;

/** Config global (colores/estilo) + tokens.  */
export const emojiTheme: {
  global: { mode: EmojiMode; color: string; accentColor: string };
} & Record<keyof typeof TOKEN_TO_REPR, string> = {
  global: {
    mode: "native",
    color: "currentColor",
    accentColor: "#D97A66", // terracota de marca
  },
  ...TOKEN_TO_REPR,
};

// ========= Tipos derivados =========

/** Tokens válidos para tipar props en componentes. */
export type EmojiTokenName = keyof typeof TOKEN_TO_REPR;
/** Compat con ColorEmoji.tsx */
export type EmojiToken = EmojiTokenName;

// ========= Helpers para <Emoji/> =========

/** Aliases adicionales SOLO para <Emoji/> (devuelven carácter emoji). */
const TOKEN_TO_CHAR: Record<string, string> = {
  ...Object.fromEntries(Object.entries(TOKEN_TO_REPR)), // copia
  // Aliases semánticos
  dashboard: TOKEN_TO_REPR.tablero,
  modules: TOKEN_TO_REPR.carpeta,
  bank: TOKEN_TO_REPR.banco,
  calendar: TOKEN_TO_REPR.calendario,
};

/**
 * Devuelve un carácter emoji “renderizable”.
 * Si `name` ya parece ser un emoji (longitud 1-2 code points), se regresa tal cual.
 */
export function getEmojiChar(name: string): string {
  if (!name) return TOKEN_TO_REPR[EMOJI_FALLBACK_TOKEN];
  // Si está en el diccionario
  if (TOKEN_TO_CHAR[name]) return TOKEN_TO_CHAR[name];
  // Si parece ya ser un emoji (muy simple: si no es alfanumérico típico)
  if (/[\p{Extended_Pictographic}]/u.test(name)) return name;
  // Fallback
  return TOKEN_TO_REPR[EMOJI_FALLBACK_TOKEN];
}

/** Overrides de estilo por carácter (opcional) */
const PER_EMOJI_SETTINGS: Record<string, EmojiSettings> = {
  "📊": { accentColor: "#3E4C59" }, // blue-gray
  "📅": { accentColor: "#2563eb" },
  "🧪": { accentColor: "#16a34a" },
  "🗂️": { accentColor: "#d97706" },
  "🔔": { accentColor: "#f59e0b" },
  "📈": { accentColor: "#0ea5e9" },
  "🏦": { accentColor: "#0ea5e9" },
  "🧭": { accentColor: "#8b5cf6" },
  "🧠": { accentColor: "#a855f7" },
  "💓": { accentColor: "#ef4444" },
  "🦷": { accentColor: "#6b7280" },
  "⚖️": { accentColor: "#10b981" },
};

/** Obtiene overrides por emoji (si existen) */
export function getEmojiSettings(char: string): EmojiSettings {
  return PER_EMOJI_SETTINGS[char] ?? {};
}
