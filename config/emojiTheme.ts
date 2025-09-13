export const emojiTheme = {
  // Marca / generales
  logo: "svg:icons/logo", // asegura public/icons/logo.svg (placeholder abajo)
  info: "ℹ️",
  ok: "✅",
  error: "⚠️",

  // Navegación principal
  tablero: "📊",
  cargas: "📤",
  perfil: "👤",
  pacientes: "🙋🏻‍♀️",

  // Autenticación
  email: "✉️",
  llave: "🔑",
  candado: "lucide:Lock",
  atras: "◀️",
  siguiente: "➡️",
  laboratorio: "🧪",
  archivo: "📄",
  ver: "👁️‍🗨️",
  link: "🔗",
  borrar: "🗑️",
  carpeta: "📁",
  subir: "📤",
  actividad: "🧭",
  documentos: "📚",
  subirBandeja: "🗂️",
  descargar: "⬇️",
  enlace: "🔗",
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
  copiar: "📋",
  home: "🏠",
  instalar: "⬇️",
  ok: "✅",
  ios: "",
  android: "🤖",
  escritorio: "🖥️",
  busqueda: "🔎",
  dashboard: "📊",
  puzzle: "🧩",
  reloj: "⏳",
  exportar: "📄",
  desbloquear: "🔓",
  eliminar: "❎",
  nuevo: "💆🏻‍♀️",
  perfil: "🆔",
  compartir: "🫱🏻‍🫲🏼",
  ajustes: "⚙️",
  ajustes2: "🛠️",
  ayuda: "🆘",
  chat: "💬",
  notificaciones: "🔔",
  mensajes: "✉️",
  
  

  // Aliases / varios
  web: "🌐",
  leaf: "🍃",
  google: "G", // si no quieres SVG, esta letra funciona de mientras
} as const;

export const EMOJI_FALLBACK_TOKEN: keyof typeof emojiTheme = "info";
export type EmojiToken = keyof typeof emojiTheme;
