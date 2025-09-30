"use client";

import * as React from "react";

export default function Skeleton({
  className = "",
  label = "Cargando",
}: {
  className?: string;
  label?: string;
}) {
  return (
    <div
      role="status"
      aria-label={label}
      className={["animate-pulse rounded-xl bg-slate-200/80 dark:bg-slate-700/70", className].join(
        " ",
      )}
    />
  );
}
