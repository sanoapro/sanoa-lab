// components/ColorEmoji.tsx
"use client";

import * as React from "react";

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
  label,
  className,
  title,
}: {
  token: string;
  label?: string;
  className?: string;
  title?: string;
}) {
  const e = MAP[token] || { char: "❓", label: token };
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
