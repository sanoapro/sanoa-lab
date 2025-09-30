"use client";
import { PropsWithChildren } from "react";

export function Badge({ children }: PropsWithChildren) {
  return (
    <span className="inline-block text-xs px-2 py-0.5 rounded-full bg-black/5 dark:bg-white/10">
      {children}
    </span>
  );
}
