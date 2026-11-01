"use client";

import Image from "next/image";
import Link from "next/link";
import { useId, useLayoutEffect, useRef, useState } from "react";
import { FacebookIcon, InstagramIcon, MediumIcon, RedditIcon, XIcon } from "@/components/ui/BrandIcons";
import type { SocialPlatform } from "@/data/site";
import { portraitAlt, socialLabel, socialUrl, type TeamMember } from "@/data/team";
import { cn } from "@/lib/utils";

const ICONS: Record<SocialPlatform, typeof InstagramIcon> = {
  instagram: InstagramIcon,
  facebook: FacebookIcon,
  medium: MediumIcon,
  reddit: RedditIcon,
  x: XIcon,
};

const initials = (name: string) =>
  name
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

/** 4:5 portrait on a warm-beige backdrop; initials avatar when the photo file is missing. */
function Portrait({ member, hasPhoto, priority }: { member: TeamMember; hasPhoto: boolean; priority?: boolean }) {
  const narrow = member.maxPhotoWidth;
  return (
    <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-[#efe3d6]">
      {hasPhoto ? (
        <div
          className={cn("absolute inset-0", narrow ? "mx-auto" : undefined)}
          style={{ ...(narrow ? { maxWidth: narrow } : {}), ...(member.zoom ? { transform: `scale(${member.zoom})`, transformOrigin: member.focal } : {}) }}
        >
          <Image
            src={member.photo}
            alt={portraitAlt(member)}
            fill
            priority={priority}
            // Crop-zoomed photos need proportionally more pixels to stay sharp.
            sizes={
              narrow
                ? `${narrow}px`
                : `(min-width: 1024px) ${Math.round(360 * (member.zoom ?? 1))}px, (min-width: 640px) ${Math.round(45 * (member.zoom ?? 1))}vw, ${Math.round(92 * (member.zoom ?? 1))}vw`
            }
            className="object-cover transition-transform duration-[900ms] ease-out group-hover:scale-[1.04] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
            style={{ objectPosition: member.focal }}
          />
        </div>
      ) : (
        <div
          role="img"
          aria-label={portraitAlt(member)}
          className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-coral to-primary"
        >
          <span className="font-display text-6xl font-bold text-white/95">{initials(member.name)}</span>
        </div>
      )}
    </div>
  );
}

export function TeamCard({ member, hasPhoto, index }: { member: TeamMember; hasPhoto: boolean; index: number }) {
  const [open, setOpen] = useState(false);
  const [clamped, setClamped] = useState(true);
  const bioRef = useRef<HTMLParagraphElement>(null);
  const bioId = useId();

  // Only offer "Read more" when the bio is actually longer than 4 lines.
  useLayoutEffect(() => {
    const el = bioRef.current;
    if (!el) return;
    const check = () => setClamped(el.scrollHeight > el.clientHeight + 1);
    check();
    const ro = new ResizeObserver(check);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const socialLinks = member.links.filter((l) => l.kind === "social");
  const textLinks = member.links.filter((l) => l.kind === "text");
  const personal = Object.entries(member.personal ?? {}).filter(([, v]) => v);

  return (
    <div
      data-reveal
      style={{ transitionDelay: `${(index % 3) * 90}ms` }}
      className="flex w-full max-w-[360px] sm:w-[calc(50%-12px)] lg:w-[calc(33.333%-16px)]"
    >
    <article
      className="group flex w-full flex-col rounded-2xl border border-border bg-white p-4 shadow-[0_1px_0_rgba(60,30,20,0.04)] transition duration-300 focus-within:ring-2 focus-within:ring-coral hover:-translate-y-0.5 hover:shadow-[0_18px_40px_-24px_rgba(60,30,20,0.45)] motion-reduce:hover:translate-y-0"
      aria-labelledby={`${member.slug}-name`}
    >
      <Portrait member={member} hasPhoto={hasPhoto} priority={index < 3} />
      <div className="flex flex-1 flex-col px-1.5 pb-1 pt-5">
        <p className="text-[12px] font-bold uppercase tracking-[0.2em] text-accent-ink">{member.role}</p>
        <h3 id={`${member.slug}-name`} className="mt-1.5 font-display text-[22px] font-semibold leading-tight text-ink">
          {member.name}
        </h3>
        <p
          ref={bioRef}
          id={bioId}
          className={cn("mt-3 text-[15px] leading-[1.6] text-muted", !open && "line-clamp-4")}
        >
          {member.bio}
        </p>
        {(clamped || open) && (
          <button
            type="button"
            aria-expanded={open}
            aria-controls={bioId}
            onClick={() => setOpen((o) => !o)}
            className="mt-1.5 self-start rounded text-sm font-semibold text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coral"
          >
            {open ? "Read less" : "Read more"}
            <span className="sr-only"> about {member.name}</span>
          </button>
        )}
        {(socialLinks.length > 0 || textLinks.length > 0 || personal.length > 0) && (
          <div className="mt-auto flex flex-wrap items-center gap-2 pt-5">
            {socialLinks.map((l) => {
              if (l.kind !== "social") return null;
              const Icon = ICONS[l.platform];
              return (
                <a
                  key={l.platform}
                  href={socialUrl(l.platform)}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Kanpur Ki Kahaani on ${socialLabel(l.platform)} (opens in a new tab)`}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border text-ink transition hover:border-primary hover:bg-primary hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coral"
                >
                  <Icon size={16} />
                </a>
              );
            })}
            {personal.map(([k, url]) => (
              <a
                key={k}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-semibold text-primary hover:underline"
              >
                {k === "linkedin" ? "LinkedIn" : "Instagram"} ↗<span className="sr-only"> ({member.name}, opens in a new tab)</span>
              </a>
            ))}
            {textLinks.map((l) =>
              l.kind === "text" ? (
                <Link key={l.href} href={l.href} className="ml-1 rounded text-sm font-semibold text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coral">
                  {l.label} →
                </Link>
              ) : null,
            )}
          </div>
        )}
      </div>
    </article>
    </div>
  );
}
