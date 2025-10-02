import * as React from "react";
import { cn } from "@/lib/utils";

export type FieldProps = {
  label?: React.ReactNode;
  hint?: React.ReactNode;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
};

export function Field({ label, hint, required, children, className }: FieldProps) {
  return (
    <label className={cn("grid gap-2", className)}>
      {label && (
        <span className="text-sm font-medium text-foreground/80">
          {label}
          {required ? <span className="text-destructive ml-1">*</span> : null}
        </span>
      )}
      {children}
      {hint ? <span className="text-xs text-muted-foreground">{hint}</span> : null}
    </label>
  );
}

export { Input } from "./input";

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.ComponentProps<"textarea">>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        "w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none transition-colors",
        "placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
        "aria-invalid:border-destructive aria-invalid:ring-destructive/20",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  )
);
Textarea.displayName = "Textarea";
