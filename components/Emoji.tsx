"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export default function Emoji({ className, children }: { className?: string; children: ReactNode }) {
  return <span className={cn("emoji align-[0.05em]", className)}>{children}</span>;
}
