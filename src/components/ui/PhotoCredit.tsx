"use client";

import { useId } from "react";
import { indexedPhoto } from "@/lib/photo-index";
import { cn } from "@/lib/utils";

/**
 * Tiny "ⓘ" on a card image that reveals the photo credit on hover/focus (full list on /credits).
 * Renders nothing for slots still on the fallback tile.
 */
export function PhotoCreditBadge({ imageKey, className }: { imageKey: string; className?: string }) {
  const id = useId();
  const p = indexedPhoto(imageKey);
  if (!p) return null;
  const text = `${p.representative ? "Representative image. " : ""}${p.credit}`;
  return (
    <span className={cn("absolute right-2 top-2 z-20", className)}>
      <button
        type="button"
        aria-describedby={id}
        aria-label="Photo credit"
        className="peer inline-flex h-6 w-6 items-center justify-center rounded-full bg-dark/55 text-[12px] font-bold text-cream backdrop-blur-sm transition hover:bg-dark/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coral"
      >
        i
      </button>
      <span
        id={id}
        role="tooltip"
        className="pointer-events-none absolute right-0 top-7 w-max max-w-[240px] rounded-md bg-dark px-2.5 py-1.5 text-[11px] leading-snug text-cream opacity-0 shadow transition-opacity peer-hover:opacity-100 peer-focus-visible:opacity-100"
      >
        {text}
      </span>
    </span>
  );
}

/** One-line visible credit for heroes and blog images (empty for fallback tiles). */
export function PhotoCreditLine({ imageKey, className }: { imageKey: string; className?: string }) {
  const p = indexedPhoto(imageKey);
  if (!p) return null;
  return <span className={className}>{p.representative ? "Representative image · " : ""}{p.credit}</span>;
}
