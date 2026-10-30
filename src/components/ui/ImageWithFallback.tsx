"use client";

import Image, { type ImageProps } from "next/image";
import { useId, useState } from "react";
import { imageExists } from "@/lib/assets";
import { cn } from "@/lib/utils";

type Props = Omit<ImageProps, "src" | "alt"> & {
  src: string;
  alt: string;
  /** Text shown on the gradient tile when the photo isn't available yet */
  label: string;
  /** Smaller sub-label (e.g. city) */
  sublabel?: string;
  tone?: "warm" | "dusk" | "river" | "dark";
  /** Hide the text on the tile (e.g. full-bleed heroes that have their own headline) */
  hideLabel?: boolean;
};

const tones = {
  warm: "from-[#c86a4b] via-[#a8432f] to-[#5c1f16]",
  dusk: "from-[#d9a24a] via-[#b0612f] to-[#5b2318]",
  river: "from-[#7a8f88] via-[#5b6b62] to-[#2e2a26]",
  dark: "from-[#4a2e26] via-[#2c1d19] to-[#1c1412]",
};

/** Hash a label into a stable tone so neighbouring tiles look varied. */
function pickTone(label: string): keyof typeof tones {
  const keys = Object.keys(tones) as (keyof typeof tones)[];
  let h = 0;
  for (const ch of label) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return keys[h % 3];
}

/**
 * Renders a local photo via next/image. If the file is missing (or fails to load)
 * it renders a warm gradient tile with the place name, so the site always looks finished.
 * Must be placed inside a positioned parent when using `fill`.
 */
export function ImageWithFallback({ src, alt, label, sublabel, tone, hideLabel, className, fill, ...rest }: Props) {
  const [failed, setFailed] = useState(false);
  const pid = `jaali-${useId().replace(/:/g, "")}`;
  const present = (imageExists(src) || src.startsWith("https://")) && !failed;

  if (!present) {
    const t = tones[tone ?? pickTone(label)];
    return (
      <div
        role="img"
        aria-label={alt}
        className={cn(
          "flex items-end overflow-hidden bg-gradient-to-br p-5 text-left",
          t,
          fill ? "absolute inset-0 h-full w-full" : "",
          className,
        )}
      >
        <svg aria-hidden className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.14]">
          <defs>
            <pattern id={pid} width="28" height="28" patternUnits="userSpaceOnUse">
              <path d="M14 0 L28 14 L14 28 L0 14 Z" fill="none" stroke="#fff" strokeWidth="1" />
              <circle cx="14" cy="14" r="2.5" fill="#fff" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill={`url(#${pid})`} />
        </svg>
        <span aria-hidden className={cn("relative", hideLabel && "hidden")}>
          {sublabel && (
            <span className="mb-1 block text-[10px] font-bold uppercase tracking-[0.2em] text-[#f6dfb5]">
              {sublabel}
            </span>
          )}
          <span className="block font-display text-xl font-semibold leading-tight text-white drop-shadow-sm">
            {label}
          </span>
        </span>
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill={fill}
      className={className}
      onError={() => setFailed(true)}
      {...rest}
    />
  );
}
