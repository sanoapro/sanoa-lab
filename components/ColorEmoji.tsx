// components/ColorEmoji.tsx
"use client";

import * as React from "react";

import Emoji from "./Emoji";
import { cn } from "@/lib/utils";

// Mapa de tokens usados en la app → emoji accesible
const MAP: Record<string, { char: string; label: string }> = {
  logo: { char: "🫶", label: "Sanoa" },
  tablero: { char: "📊", label: "Tablero" },
  agenda: { char: "📅", label: "Agenda" },
  pacientes: { char: "🧑‍⚕️", label: "Pacientes" },
  laboratorio: { char: "🧪", label: "Laboratorio" },
  carpeta: { char: "🗂️", label: "Especialidades" },
  recordatorios: { char: "⏰", label: "Recordatorios" },
  reportes: { char: "📈", label: "Reportes" },
  banco: { char: "🏦", label: "Banco" },
  plan: { char: "🗒️", label: "Plan" },
  ajustes: { char: "⚙️", label: "Ajustes" },
  perfil: { char: "👤", label: "Perfil" },
  desbloquear: { char: "🔓", label: "Cerrar sesión" },
  exportar: { char: "📤", label: "Exportar" },
  pago: { char: "💳", label: "Pago" },
  megafono: { char: "📣", label: "Promocionar" },
  recetas: { char: "💊", label: "Recetas" },
  plantilla: { char: "🧾", label: "Plantilla" },
  grafica: { char: "📊", label: "Gráfica" },
  tabla: { char: "📋", label: "Tabla" },
  actualizar: { char: "🔁", label: "Actualizar" },
  nube: { char: "☁️", label: "Nube" },
  mente: { char: "🧠", label: "Mente" },
  pulso: { char: "🫀", label: "Pulso" },
  equilibrio: { char: "⚖️", label: "Equilibrio" },
  sonrisa: { char: "😷", label: "Sonrisa" },
  banco_alerta: { char: "🔔", label: "Alerta bancaria" },
  atras: { char: "⬅️", label: "Atrás" },
  llave: { char: "🔑", label: "Llave" },
  firma: { char: "✍️", label: "Firma" },
  pdf: { char: "📄", label: "PDF" },
  buscador: { char: "🔎", label: "Buscador" },
  trabajo: { char: "💼", label: "Trabajo" },
};

export default function ColorEmoji({
  token,
  emoji,
  label,
  className,
  title,
  size = "md",
}: {
  token?: string;
  emoji?: string;
  label?: string;
  className?: string;
  title?: string;
  size?: "sm" | "md" | "lg" | number;
}) {
  const e = token ? MAP[token] : undefined;
  const char = emoji || e?.char || "❓";
  const aria = label || e?.label || emoji || token || "emoji";
  const variant = typeof size === "number" ? "md" : size;
  const style = typeof size === "number" ? { fontSize: `${size}px` } : undefined;
  return (
    <Emoji
      role="img"
      aria-label={aria}
      title={title || aria}
      className={cn("select-none", className)}
      size={variant}
      style={style}
    >
      {char}
    </Emoji>
  );
}
