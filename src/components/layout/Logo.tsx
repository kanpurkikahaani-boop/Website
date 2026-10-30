import Image from "next/image";
import Link from "next/link";
import { hasLogo } from "@/lib/assets";
import { cn } from "@/lib/utils";

if (!hasLogo && process.env.NODE_ENV === "development") {
  console.error(
    "\n\x1b[41m\x1b[97m KKK LOGO MISSING \x1b[0m public/brand/logo.png not found — showing the coral KKK placeholder. Add the logo file and restart `npm run dev`.\n",
  );
}

/**
 * The circular badge on its own: the real logo if present, else a coral "KKK" disc.
 * `decorative` hides it from screen readers when a wordmark sits next to it.
 */
export function LogoMark({ size = 42, className, decorative = true }: { size?: number; className?: string; decorative?: boolean }) {
  if (hasLogo) {
    return (
      <Image
        src="/brand/logo.png"
        alt={decorative ? "" : "Kanpur Ki Kahaani logo"}
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
      <LogoMark size={size} decorative={false} />
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
