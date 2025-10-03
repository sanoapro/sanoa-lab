// components/ui/field.tsx
import * as React from "react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type FieldProps = {
  label?: ReactNode;
  htmlFor?: string;              // ← NUEVO: conecta el <label> con el control
  required?: boolean;
  className?: string;
  description?: ReactNode;       // ← NUEVO: texto descriptivo bajo el control
  /** @deprecated Usa `description` en su lugar */
  hint?: ReactNode;              // alias retrocompatible
  children: React.ReactNode;
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
  // Si hay description/hint, generamos un id para aria-describedby (opcional)
  const descId = (description ?? hint) && htmlFor ? `${htmlFor}-desc` : undefined;

  return (
    <div className={cn("grid gap-2", className)}>
      {label && (
        <label
          // Sólo pone htmlFor si lo recibimos (si el control es externo)
          htmlFor={htmlFor}
          className="text-sm font-medium text-foreground/80"
        >
          {label}
          {required ? <span className="text-destructive ml-1">*</span> : null}
        </label>
      )}

      {/* Sugerencia: si quieres inyectar aria-describedby al hijo automáticamente,
          podríamos clonar el elemento. Por simplicidad lo dejamos al consumidor. */}
      {children}

      {description ?? hint ? (
        <span id={descId} className="text-xs text-muted-foreground">
          {description ?? hint}
        </span>
      ) : null}
    </div>
  );
}

// ❌ Eliminado el re-export circular que disparaba TS2303:
// export { Input } from "./input";

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.ComponentProps<"textarea">
>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(
      "w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none transition-colors",
      "placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
      "aria-invalid:border-destructive aria-invalid:ring-destructive/20",
      "disabled:cursor-not-allowed disabled:opacity-50",
      className
    )}
    {...props}
  />
));
Textarea.displayName = "Textarea";
