"use client";

import { FacebookIcon, InstagramIcon, MediumIcon, RedditIcon, XIcon } from "@/components/ui/BrandIcons";
import { site, socials, type SocialPlatform } from "@/data/site";
import { track } from "@/lib/analytics";
import { cn } from "@/lib/utils";

const icons: Record<SocialPlatform, typeof InstagramIcon> = {
  instagram: InstagramIcon,
  facebook: FacebookIcon,
  x: XIcon,
  medium: MediumIcon,
  reddit: RedditIcon,
};

/** The five official profiles. `variant="bar"` = 32px hit areas for the top bar; `"footer"` = outlined circles. */
export function SocialLinks({ variant, className }: { variant: "bar" | "footer"; className?: string }) {
  return (
    <ul className={cn("flex items-center", variant === "bar" ? "gap-0.5" : "gap-2.5", className)} aria-label="Follow Kanpur Ki Kahaani">
      {socials.map(({ platform, label, url }) => {
        const Icon = icons[platform];
        return (
          <li key={platform}>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`${site.name} on ${label} (opens in a new tab)`}
              onClick={() => track("social_click", { platform, location: variant })}
              className={cn(
                "inline-flex items-center justify-center text-cream transition-colors hover:text-accent",
                variant === "bar"
                  ? "h-8 w-8 rounded-full"
                  : "h-10 w-10 rounded-full border border-cream/30 hover:border-accent",
              )}
            >
              <Icon size={variant === "bar" ? 18 : 17} />
            </a>
          </li>
        );
      })}
    </ul>
  );
}
