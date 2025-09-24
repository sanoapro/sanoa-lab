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

export const EMOJI_FALLBACK_TOKEN: keyof typeof emojiTheme = "info";
export type EmojiToken = keyof typeof emojiTheme;
