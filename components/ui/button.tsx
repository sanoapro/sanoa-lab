import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "btn-base select-none focus-visible:ring-2 focus-visible:ring-primary/60 disabled:opacity-50 disabled:pointer-events-none",
  {
    variants: {
      variant: {
        primary: "bg-primary text-primary-foreground hover:opacity-90 active:opacity-80",
        secondary: "bg-secondary text-secondary-foreground hover:opacity-90 active:opacity-80",
        outline: "border border-border bg-transparent hover:bg-muted",
        ghost: "bg-transparent hover:bg-muted",
        danger: "bg-danger text-danger-foreground hover:opacity-90 active:opacity-80",
        destructive: "bg-danger text-danger-foreground hover:opacity-90 active:opacity-80",
      },
      size: {
        sm: "h-10 px-3 text-sm",
        md: "h-11 px-4 text-base",
        lg: "h-12 px-5 text-base",
        icon: "h-11 w-11 p-0",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";

    return (
      <Comp
        className={cn(buttonVariants({ variant, size }), className)}
        ref={ref}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";

export { buttonVariants };
