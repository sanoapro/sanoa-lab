// config/emojiTheme.ts
// Mapa de tokens → emoji o svg:<ruta-sin-.svg> (usado por <ColorEmoji/>)
const emojiTheme: Record<string, string> = {
  // Marca
  logo: "svg:icons/logo",

  // Navegación principal
  tablero: "🧭",
  cargas: "📤",
  perfil: "👤",

  // Acciones comunes
  info: "ℹ️",
  llave: "🔑",
  atras: "◀️",
  email: "✉️",
  web: "🌐",
  siguiente: "➡️",
  candado: "🔒",

  // Fallbacks conocidos
  ok: "✅",
  error: "⚠️",
};

export default emojiTheme;
