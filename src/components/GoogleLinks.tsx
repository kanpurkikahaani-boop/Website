"use client";

import { Images, MapPin } from "lucide-react";
import { track } from "@/lib/analytics";
import type { GoogleItem } from "@/lib/googleQueries";
import { cn } from "@/lib/utils";

/**
 * "Map" + "Photos" buttons for an item (v9 Google links). Links only — they open Google Maps (the
 * app on phones) and a Google Images search in a new tab; nothing from Google is embedded.
 * Sits above a card's stretched link (relative z-10) and is never nested inside another link.
 */
export function GoogleLinks({ item, variant = "compact", className, tone = "light" }: { item: GoogleItem; variant?: "compact" | "large"; className?: string; tone?: "light" | "dark" }) {
  const large = variant === "large";
  const page = () => (typeof location === "undefined" ? "" : location.pathname);
  const base = large
    ? "inline-flex min-h-11 items-center gap-2 rounded-full border px-4 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coral"
    : "inline-flex min-h-11 items-center gap-1.5 rounded-full border px-3 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coral sm:min-h-8";
  const look =
    tone === "dark"
      ? "border-cream/40 bg-transparent text-cream hover:border-accent hover:text-accent"
      : "border-border bg-white text-ink hover:border-primary/40 hover:bg-primary-soft hover:text-primary";
  const icon = tone === "dark" ? "text-accent" : "text-primary";
  return (
    <div data-google-links="" className={cn("relative z-10 flex flex-wrap gap-2", className)}>
      <a
        href={item.mapsUrl}
        target="_blank"
        rel="noopener noreferrer nofollow"
        aria-label={`Open ${item.name} in Google Maps (new tab)`}
        onClick={() => track("google_maps_click", { item: item.name, type: item.type, page: page() })}
        className={cn(base, look)}
      >
        <MapPin size={large ? 16 : 14} aria-hidden className={icon} />
        {large ? "Open in Google Maps ↗" : "Map"}
      </a>
      <a
        href={item.imagesUrl}
        target="_blank"
        rel="noopener noreferrer nofollow"
        aria-label={`See photos of ${item.name} on Google Images (new tab)`}
        onClick={() => track("google_images_click", { item: item.name, type: item.type, page: page() })}
        className={cn(base, look)}
      >
        <Images size={large ? 16 : 14} aria-hidden className={icon} />
        {large ? "See photos on Google ↗" : "Photos"}
      </a>
    </div>
  );
}
