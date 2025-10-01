import * as React from "react";
import { cn } from "@/lib/utils";

type Props = React.HTMLAttributes<HTMLDivElement> & { text: string };
export function Tooltip({ text, className, children, ...props }: Props) {
  return (
    <div className={cn("relative inline-block group", className)} {...props}>
      {children}
      <div
        role="tooltip"
        className={cn(
          "pointer-events-none absolute z-50 -translate-x-1/2 left-1/2 mt-2",
          "rounded-md bg-foreground text-background text-xs px-2 py-1",
          "opacity-0 group-hover:opacity-100 transition ease-soft"
        )}
      >
        {text}
      </div>
    </div>
  );
}
