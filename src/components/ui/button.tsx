import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils/cn";

// shadcn/ui Radix pattern, adapted for a minimum 44px touch target and wrapping copy.
const buttonVariants = cva(
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-md px-5 py-3 text-center text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary-hover active:bg-primary-active",
        outline: "border border-border bg-background text-foreground hover:bg-muted active:bg-secondary",
        ghost: "text-foreground hover:bg-muted active:bg-secondary",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

function Button({ className, variant, asChild = false, type, ...props }:
  React.ComponentProps<"button"> & VariantProps<typeof buttonVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "button";
  return <Comp data-slot="button" className={cn(buttonVariants({ variant, className }))}
    {...(!asChild ? { type: type ?? "button" } : {})} {...props} />;
}

export { Button, buttonVariants };
