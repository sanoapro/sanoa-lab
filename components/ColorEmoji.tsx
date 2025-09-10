"use client";

import * as React from "react";
import clsx from "clsx";

export type Props = {
  token?: string;
  size?: number;
  toneA?: string;
  toneB?: string;
  className?: string;
};

const MAP: Record<string, string> = {
  enviar: "📤",
  atras: "◀️",
  refrescar: "🔄",
  info: "ℹ️",
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
  pacientes: "🧑‍⚕️",
  laboratorio: "🧪",
  archivo: "📄",
  ver: "👁️",
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
  imagen: "🖼️",
  limpiar: "🧹",
  salir: "🚪",
  buscar: "🔍",
  siguiente: "➡️",
  anterior: "⬅️",
  tablero: "📋",
};

export default function ColorEmoji({ token, size = 16, className }: Props) {
  const glyph = (token && MAP[token]) || "❓";
  const style: React.CSSProperties = {
    fontSize: size,
    lineHeight: 1,
    display: "inline-block",
    verticalAlign: "middle",
  };
  return (
    <span aria-hidden className={clsx("select-none", className)} style={style}>
      {glyph}
    </span>
  );
}
