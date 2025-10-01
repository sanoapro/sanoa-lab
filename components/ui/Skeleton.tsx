"use client";

import * as React from "react";

type SkeletonProps = {
  className?: string;
  label?: string;
  /**
   * Oculta el skeleton de lectores de pantalla cuando ya existe otro
   * elemento con información del estado de carga.
   */
  ariaHidden?: boolean;
};

export default function Skeleton({
  className = "",
  label = "Cargando",
  ariaHidden = false,
}: SkeletonProps) {
  const accessibilityProps = ariaHidden
    ? { "aria-hidden": true }
    : { role: "status", "aria-label": label };

  return (
    <div
      {...accessibilityProps}
      className={["animate-pulse rounded-xl bg-slate-200/80 dark:bg-slate-700/70", className].join(
        " ",
      )}
    />
  );
}
