// config/emojiTheme.ts
"use client";

export type EmojiMode = "native" | "mono" | "duotone";
type EmojiSettings = { mode?: EmojiMode; color?: string; accentColor?: string };

export const EMOJI_FALLBACK_TOKEN = "default";

const TOKEN_TO_REPR = {
  // Navegación principal
  tablero: "📊",
  agenda: "📅",
  calendario: "📅",
  pacientes: "🧑‍⚕️",
  laboratorio: "🧪",
  carpeta: "🗂️",        // Módulos
  modulos: "🗂️",        // alias
  recordatorios: "🔔",
  reportes: "📈",
  banco: "🏦",
  plan: "🧭",

  // Identidad / ajustes / marca
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

  ajustes: "⚙️",      // ajustes / settings
  compartir: "🤝",    // compartir acceso
  exportar: "📤",     // exportar CSV/archivos
  limpiar: "🧹",      // limpiar filtros/búsqueda
  usuario: "👤",      // perfil de usuario / ficha

  // Fallback
  [EMOJI_FALLBACK_TOKEN]: "❓",
} as const;

export const emojiTheme: {
  global: { mode: EmojiMode; color: string; accentColor: string };
} & Record<keyof typeof TOKEN_TO_REPR, string> = {
  global: {
    mode: "native",
    color: "currentColor",
    accentColor: "#D97A66",
  },
  ...TOKEN_TO_REPR,
};

// Tipos para <Emoji/>
export type EmojiTokenName = keyof typeof TOKEN_TO_REPR;
export type EmojiToken = EmojiTokenName;

// Helpers para <Emoji/>
const TOKEN_TO_CHAR: Record<string, string> = {
  ...Object.fromEntries(Object.entries(TOKEN_TO_REPR)),
  dashboard: TOKEN_TO_REPR.tablero,
  modules: TOKEN_TO_REPR.carpeta,
  bank: TOKEN_TO_REPR.banco,
  calendar: TOKEN_TO_REPR.calendario,
};

export function getEmojiChar(name: string): string {
  if (!name) return TOKEN_TO_REPR[EMOJI_FALLBACK_TOKEN];
  if (TOKEN_TO_CHAR[name]) return TOKEN_TO_CHAR[name];
  if (/[\p{Extended_Pictographic}]/u.test(name)) return name;
  return TOKEN_TO_REPR[EMOJI_FALLBACK_TOKEN];
}

const PER_EMOJI_SETTINGS: Record<string, EmojiSettings> = {
  "📊": { accentColor: "#3E4C59" },
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

export function getEmojiSettings(char: string): EmojiSettings {
  return PER_EMOJI_SETTINGS[char] ?? {};
}
