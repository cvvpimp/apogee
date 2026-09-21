import { cva, type VariantProps } from "class-variance-authority";
import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 font-medium transition-[opacity,transform,background-color] duration-150 ease-out active:not-disabled:scale-[0.96] disabled:opacity-40 disabled:pointer-events-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-line",
  {
    variants: {
      variant: {
        primary:
          "bg-cream text-ink hover:opacity-90",
        rail:
          "bg-rail-light text-cream border border-cream/15 hover:border-cream/30",
        ghost:
          "bg-transparent text-cream/80 hover:text-cream hover:bg-cream/5",
        shoot:
          "bg-line text-ink font-table tracking-widest uppercase hover:opacity-90",
      },
      size: {
        sm: "h-9 px-3 text-sm rounded-[8px]",
        md: "h-11 px-4 text-sm rounded-[10px]",
        lg: "h-12 px-5 text-base rounded-[12px]",
        icon: "size-11 rounded-[10px]",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  },
);

export function Button({
  className,
  variant,
  size,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<typeof buttonVariants>) {
  return (
    <button className={cn(buttonVariants({ variant, size }), className)} {...props} />
  );
}
