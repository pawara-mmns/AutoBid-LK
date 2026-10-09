import type { ComponentProps } from "react";
import { cn } from "@/lib/utils/cn";

export function Input({ className, ...props }: ComponentProps<"input">) {
  return <input data-slot="input" className={cn(
    "min-h-12 w-full rounded-md border border-border bg-background px-3 py-2 text-base text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-60 aria-invalid:border-red-700",
    className,
  )} {...props} />;
}
