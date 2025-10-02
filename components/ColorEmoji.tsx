// components/ColorEmoji.tsx
"use client";

import * as React from "react";
import { emojiTheme } from "@/config/emojiTheme";

// Mapa de tokens usados en la app → emoji accesible
const MAP: Record<string, { char: string; label: string }> = {
  logo: { char: "🫶", label: "Sanoa" },
  tablero: { char: "📊", label: "Tablero" },
  agenda: { char: "📅", label: "Agenda" },
  pacientes: { char: "🧑‍⚕️", label: "Pacientes" },
  laboratorio: { char: "🧪", label: "Laboratorio" },
  carpeta: { char: "🗂️", label: "Áreas Pro" },
  recordatorios: { char: "⏰", label: "Recordatorios" },
  reportes: { char: "📈", label: "Reportes" },
  banco: { char: "🏦", label: "Banco" },
  plan: { char: "🪙", label: "Plan" },
  ajustes: { char: "⚙️", label: "Ajustes" },
  perfil: { char: "👤", label: "Perfil" },
  desbloquear: { char: "🔓", label: "Cerrar sesión" },
  exportar: { char: "📤", label: "Exportar" },
  compartir: { char: "🔗", label: "Compartir" },
  nuevo: { char: "➕", label: "Nuevo" },
  agregar: { char: "➕", label: "Agregar" },
  programar: { char: "⏱️", label: "Programar" },
  editar: { char: "✏️", label: "Editar" },
  guardar: { char: "💾", label: "Guardar" },
  pago: { char: "💳", label: "Pago" },
  megafono: { char: "📣", label: "Promocionar" },
  recetas: { char: "🧾", label: "Recetas" },
  mente: { char: "🧠", label: "Mente" },
  pulso: { char: "🫀", label: "Pulso" },
  equilibrio: { char: "⚖️", label: "Equilibrio" },
  sonrisa: { char: "😷", label: "Sonrisa" },
  banco_alerta: { char: "🔔", label: "Alerta bancaria" },
};

export default function ColorEmoji({
  token,
  label,
  className,
  title,
}: {
  token: string;
  label?: string;
  className?: string;
  title?: string;
}) {
  const themeChar = resolveFromTheme(token);
  const e = MAP[token] || (themeChar ? { char: themeChar, label: token } : { char: "❓", label: token });
  const aria = label || e.label || token;
  return (
    <span
      role="img"
      aria-label={aria}
      title={title || aria}
      className={["inline-block leading-none select-none", className || ""].join(" ")}
    >
      {e.char}
    </span>
  );
}

function resolveFromTheme(token: string): string | null {
  const entry = (emojiTheme as Record<string, unknown>)[token];
  if (!entry || typeof entry !== "string") return null;
  if (entry.startsWith("svg:") || entry.startsWith("lucide:")) return null;
  return entry;
}
