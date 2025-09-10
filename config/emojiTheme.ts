export const emojiTheme = {
  // Marca / generales
  logo: "svg:icons/logo",
  info: "ℹ️",
  ok: "✅",
  error: "⚠️",

  // Navegación principal
  tablero: "📊",
  pacientes: "🙋🏻‍♀️",
  perfil: "🆔",
  cargas: "📤", // usado como "Importar"
  agenda: "🗓️", // NUEVO
  calendario: "🗓️", // alias por compatibilidad
  laboratorio: "🧪",
  banco: "🏦",
  megafono: "📣",
  plan: "🗒️",
  pago: "💳",
  reportes: "📈",
  grafica: "📊",
  tabla: "📋",
  recordatorios: "⏰",
  recetas: "💊",
  plantilla: "🧾",
  actualizar: "🔁",
  nube: "☁️",
  atras: "⬅️",
  llave: "🔑",
  firma: "✍️",
  pdf: "📄",
  buscador: "🔎",
  trabajo: "💼",

  // Archivos / acciones
  archivo: "📄",
  carpeta: "📁",
  documentos: "📚",
  subir: "📤",
  subirBandeja: "🗂️",
  descargar: "⬇️",
  enlace: "🔗",
  ver: "👁️‍🗨️",
  borrar: "🗑️",
  copiar: "📋",
  refrescar: "🔄", // NUEVO
  desbloquear: "🔓",

  // UI / sistema
  usuario: "👤",
  imagen: "📸",
  limpiar: "🧹",
  salir: "🚪",
  buscar: "🔍",
  siguiente: "➡️",
  anterior: "⬅️",
  email: "✉️",
  candado: "🔒",
  guardar: "💾",
  hoja: "📄",
  alerta: "⚠️",
  home: "🏠",
  instalar: "⬇️",
  ios: "",
  android: "🤖",
  escritorio: "🖥️",
  busqueda: "🔎",
  dashboard: "📊",
  puzzle: "🧩",
  reloj: "⏳",
  exportar: "📄",
  eliminar: "❎",
  nuevo: "✨",
  compartir: "🫱🏻‍🫲🏼",
  ajustes: "⚙️",
  ajustes2: "🛠️",
  ayuda: "🆘",
  chat: "💬",
  notificaciones: "🔔",

  // “Iconos” nominales (por si tu UI los usa como tokens)
  ArrowLeft: "⬅️",
  Loader2: "🔄",
  Trash2: "🗑️",
  Download: "📥",
  Copy: "📋",
  History: "🕒",

  // Aliases / varios
  web: "🌐",
  leaf: "🍃",
  google: "G",
} as const;

<<<<<<< HEAD
export const EMOJI_FALLBACK_TOKEN: keyof typeof emojiTheme = "info";
export type EmojiToken = keyof typeof emojiTheme;
=======
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

export type EmojiPerItem = {
  // overrides por emoji, p.ej. { "📝": { fg: "#222", bg: "#eee" } }
  [emoji: string]: { fg?: string; bg?: string };
};
>>>>>>> 9675004 (chore: sync tipos Supabase, export Patient/Gender, path en patient_files, logging robusto, ESLint relax)
