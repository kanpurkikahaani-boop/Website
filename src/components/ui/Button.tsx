import Link from "next/link";
import { cn } from "@/lib/utils";

type Variant = "primary" | "outline-light" | "outline" | "gold";

const variants: Record<Variant, string> = {
  primary: "bg-primary text-white hover:bg-primary-hover shadow-sm",
  "outline-light": "border border-white/70 text-white hover:bg-white hover:text-ink",
  outline: "border border-primary text-primary hover:bg-primary hover:text-white",
  gold: "bg-accent text-dark hover:brightness-95",
};

export const buttonClass = (variant: Variant = "primary", className?: string) =>
  cn(
    "inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-semibold transition-colors duration-200 disabled:opacity-60",
    variants[variant],
    className,
  );

interface LinkButtonProps extends React.ComponentProps<typeof Link> {
  variant?: Variant;
}

export function LinkButton({ variant = "primary", className, ...props }: LinkButtonProps) {
  return <Link className={buttonClass(variant, className)} {...props} />;
}
