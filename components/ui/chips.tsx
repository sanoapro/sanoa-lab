"use client";

import type { ReactNode } from "react";

type ChipProps = {
  label: string;
  active?: boolean;
  onClick?: () => void;
  iconLeft?: ReactNode;
};

export function Chip({ label, active, onClick, iconLeft }: ChipProps) {
  return (
    <button
      type="button"
      className="chip"
      data-active={active ? "true" : "false"}
      onClick={onClick}
      aria-pressed={!!active}
    >
      {iconLeft}
      {label}
    </button>
  );
}

export function ChipGroup({ children }: { children: ReactNode }) {
  return <div className="chips">{children}</div>;
}
