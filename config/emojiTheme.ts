// config/emojiTheme.ts

/** Modo de colorización para los emojis SVG (Twemoji) */
export type EmojiMode = "duotone" | "mono" | "native";

/** Overrides por emoji específico (clave = carácter del emoji) */
export type EmojiPerItem = {
  mode?: EmojiMode;      // "native" | "duotone" | "mono"
  color?: string;        // color base por emoji
  accentColor?: string;  // segundo tono por emoji
};

/** Tema global + overrides por emoji */
export const emojiTheme = {
  global: {
    mode: "duotone" as EmojiMode,                 // Modo global por defecto
    color: "var(--color-brand-primary)",          // Color base global
    accentColor: "var(--color-brand-coral)",      // Acento global
  },
  /** Overrides por emoji (usa el carácter como clave) */
  perEmoji: {
    "📧": { mode: "native" }, // correo nativo (buena visibilidad)
    "🌿": { mode: "native" }, // hojita Sanoa (opción 1)
    "🍃": { mode: "native" }, // hojita Sanoa (opción 2)
    "🗑️": { mode: "native" }, // bote de basura nativo
    "🌐": { mode: "native" }, // Google / globo nativo
    "🧭": { mode: "native" }, // tablero
    "📦": { mode: "native" }, // otros 
    "👀": { mode: "native" }, // ver 
    "📊": { mode: "native" }, // tablero 2 
    "🧪": { mode: "native" }, // laboratorio
    "🔐": { mode: "duotone" },// candado duotono
    "🔑": { mode: "duotone" },// llave duotono
    "👥": { mode: "native" },
    "👤": { mode: "native" },
    "🛟": { mode: "native" },
  } as Record<string, EmojiPerItem>,
};

/**
 * ============================
 *  Mapa semántico de emojis
 *  (¡edita aquí los íconos!)
 * ============================
 *
 * Cambia SOLO el carácter a la derecha para actualizar en toda la app.
 * Ejemplo: email: "✉️"
 */
export const emojiTokens = {
  // Auth / navegación
  email: "📧",
  login: "🔐",
  password: "🔑",
  enter: "➡️",
  logout: "🚪",
  register: "📝",
  home: "🏠",
  tablero: "🧭",
  sanoa: "🌿",

  // Archivos / acciones
  subir: "📤",
  descargar: "⬇️",
  copiar: "📋",
  ver: "👀",
  actualizar: "🔄",
  editar: "✏️",
  guardar: "💾",
  borrar: "🗑️",
  compartir: "🔗",
  enlace: "🔗",

  // Tipos de recurso
  carpeta: "📁",
  archivo: "📄",
  pdf: "📕",
  imagen: "🖼️",
  video: "🎬",

  // Sistema / estado
  ok: "✅",
  info: "ℹ️",
  alerta: "⚠️",
  error: "❌",
  ajustes: "⚙️",
  buscar: "🔎",
  calendario: "📅",
  tiempo: "⏰",

  // App / branding / varias
  globo: "🌐",
  marca: "🌿", // o "🍃"
  mundo: "🌍",
  volver: "⬅️",
  siguiente: "➡️",

  // Salud (por si te sirven en módulos clínicos)
  medico: "🩺",
  paciente: "🧑‍🤝‍🧑",
  cita: "📆",
  laboratorio: "🧪",
  receta: "💊",
  clinica: "🏥",
  ubicacion: "📍",
  camara: "📷",
} as const;

/** Nombre de token semántico permitido (tipado) */
export type EmojiTokenName = keyof typeof emojiTokens;

/**
 * Devuelve el carácter emoji a partir de un nombre semántico.
 * Si pasas un carácter directamente, lo devuelve tal cual.
 */
export function getEmojiChar(nameOrChar: EmojiTokenName | string): string {
  if (nameOrChar in emojiTokens) {
    return emojiTokens[nameOrChar as EmojiTokenName];
  }
  return nameOrChar;
}

/**
 * Devuelve el set de estilo efectivo (global + override por emoji).
 * Útil si quieres inspeccionar o componer estilos fuera del componente.
 */
export function getEmojiSettings(emojiChar: string) {
  const base = emojiTheme.global;
  const ov = emojiTheme.perEmoji[emojiChar] ?? {};
  return {
    mode: ov.mode ?? base.mode,
    color: ov.color ?? base.color,
    accentColor: ov.accentColor ?? base.accentColor,
  };
}
