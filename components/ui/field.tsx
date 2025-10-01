import * as React from "react";
import { cn } from "@/lib/utils";

type Props = {
  label: React.ReactNode;
  htmlFor?: string;
  hint?: string;
  error?: string;
  hintId?: string;
  errorId?: string;
  required?: boolean;
  className?: string;
  children: React.ReactNode;
};

export function Field({
  label,
  htmlFor,
  hint,
  error,
  hintId,
  errorId,
  required,
  className,
  children,
}: Props) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <label htmlFor={htmlFor} className="block text-sm font-medium">
        {label} {required && <span className="text-danger">*</span>}
      </label>
      {children}
      {hint && !error && (
        <p className="text-xs text-muted-foreground" id={hintId}>
          {hint}
        </p>
      )}
      {error && (
        <p className="text-xs text-danger" id={errorId} role="alert" aria-live="polite">
          {error}
        </p>
      )}
    </div>
  );
}

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean };
export const Input = React.forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, invalid, ...props },
  ref
) {
  return (
    <input
      ref={ref}
      className={cn(
        "block w-full h-11 rounded-lg border bg-background px-3 text-base",
        "placeholder:text-muted-foreground/70",
        "focus:outline-none focus:ring-2 focus:ring-primary/60",
        invalid ? "border-danger" : "border-border",
        className
      )}
      {...props}
    />
  );
});

type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement> & { invalid?: boolean };
export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { className, invalid, rows = 6, ...props },
  ref
) {
  return (
    <textarea
      ref={ref}
      rows={rows}
      className={cn(
        "block w-full rounded-lg border bg-background px-3 py-2 text-base",
        "placeholder:text-muted-foreground/70",
        "focus:outline-none focus:ring-2 focus:ring-primary/60",
        invalid ? "border-danger" : "border-border",
        className
      )}
      {...props}
    />
  );
});
