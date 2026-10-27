import Image from "next/image";
import Link from "next/link";
import { hasLogo } from "@/lib/assets";
import { cn } from "@/lib/utils";

/** The circular badge on its own: the real logo if present, else a coral "KKK" disc. */
export function LogoMark({ size = 42, className }: { size?: number; className?: string }) {
  if (hasLogo) {
    return (
      <Image
        src="/brand/logo.png"
        alt=""
        width={size}
        height={size}
        className={cn("shrink-0 rounded-full object-cover", className)}
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <span
      aria-hidden
      style={{ width: size, height: size, fontSize: size * 0.3 }}
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full bg-coral font-display font-bold tracking-wider text-[#fdf3e7] ring-2 ring-[#f6dfb5]/70 ring-offset-0",
        className,
      )}
    >
      KKK
    </span>
  );
}

/** Logo + "Kanpur Ki Kahaani" wordmark. `tone="dark"` is used in the footer. */
export function Logo({ tone = "light", size = 42 }: { tone?: "light" | "dark"; size?: number }) {
  return (
    <Link href="/" className="group inline-flex items-center gap-2.5" aria-label="Kanpur Ki Kahaani — home">
      <LogoMark size={size} />
      <span
        className={cn(
          "font-display text-[19px] font-bold leading-none tracking-tight sm:text-[21px]",
          tone === "light" ? "text-ink" : "text-cream",
        )}
      >
        Kanpur <span className={tone === "light" ? "text-primary" : "text-accent"}>Ki</span> Kahaani
      </span>
    </Link>
  );
}
