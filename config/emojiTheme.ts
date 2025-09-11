export const emojiTheme: Record<string, string> = {
  // Navbar / Dashboard
  tablero: "📊",
  cargas: "📤",
  perfil: "👤",

  // Comunes
  atras: "⬅️",
  adios: "👋",
  pacientes: "🧑‍⚕️",
  subir: "📤",
  archivos: "🗂️",
  ok: "✅",
  error: "❌",
  info: "ℹ️",
  hoja: "🍃",

  // Tu logo (usa el SVG de /public/icons/logo.svg)
  logo: "svg:/icons/logo.svg",
};

// Fallback cómodo
export function getEmoji(token?: string, fallback?: string) {
  if (!token) return fallback ?? "❓";
  return emojiTheme[token] ?? fallback ?? "❓";
}
