"use client";

import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

type EmojiSize = "sm" | "md" | "lg";

const sizeMap: Record<EmojiSize, string> = {
  sm: "text-[1.1em]",
  md: "text-[1.35em]",
  lg: "text-[1.6em]",
};

interface EmojiProps extends HTMLAttributes<HTMLSpanElement> {
  className?: string;
  children: ReactNode;
  size?: EmojiSize;
}

export default function Emoji({ className, children, size = "md", ...props }: EmojiProps) {
  return (
    <span className={cn("emoji align-[0.05em]", sizeMap[size], className)} {...props}>
      {children}
    </span>
  );
}
