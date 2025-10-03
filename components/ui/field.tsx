import * as React from "react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type FieldProps = {
  label?: ReactNode;
  htmlFor?: string;
  required?: boolean;
  className?: string;
  description?: ReactNode;
  /** @deprecated Usa `description` en su lugar */
  hint?: ReactNode;
  children: ReactNode;
};

export function Field({
  label,
  htmlFor,
  required,
  className,
  description,
  hint,
  children,
}: FieldProps) {
  const descId = (description ?? hint) && htmlFor ? `${htmlFor}-desc` : undefined;

  return (
    <div className={cn("grid gap-2", className)}>
      {label && (
        <label htmlFor={htmlFor} className="text-sm font-medium text-foreground/80">
          {label}
          {required ? <span className="text-destructive ml-1">*</span> : null}
        </label>
      )}
      {children}
      {description ?? hint ? (
        <span id={descId} className="text-xs text-muted-foreground">
          {description ?? hint}
        </span>
      ) : null}
    </div>
  );
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.ComponentProps<"textarea">>(
  ({ className, ...props }: any, ref: any) => (
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
  ),
);
Textarea.displayName = "Textarea";
