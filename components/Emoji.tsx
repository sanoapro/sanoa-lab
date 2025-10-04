"use client";

import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

interface EmojiProps extends HTMLAttributes<HTMLSpanElement> {
  className?: string;
  children: ReactNode;
  size?: number;
}

export default function Emoji({ className, children, size = 20, style, ...props }: EmojiProps) {
  return (
    <span
      className={cn("emoji align-[0.05em]", className)}
      style={{ fontSize: size, ...style }}
      {...props}
    >
      {children}
    </span>
  );
}
