import Link from "next/link";
import { ImageWithFallback } from "./ImageWithFallback";
import { TagChip } from "./TagChip";
import { cn } from "@/lib/utils";

export interface ImageCardProps {
  image: string;
  alt: string;
  /** Label for the fallback tile (usually the place name) */
  imageLabel?: string;
  imageSublabel?: string;
  eyebrow?: string;
  title: string;
  /** Optional Devanagari name rendered after the title */
  hindi?: string;
  description?: React.ReactNode;
  chips?: string[];
  href?: string;
  /** Extra content under the chips (links, prices…) */
  footer?: React.ReactNode;
  headingLevel?: "h2" | "h3";
  sizes?: string;
  priority?: boolean;
  className?: string;
  onClick?: () => void;
}

/**
 * White rounded card: 4:3 image → gold eyebrow → Playfair title → one-liner → chips.
 * The whole card is clickable when `href` is set (stretched link), while still allowing
 * nested footer links to stay clickable.
 */
export function ImageCard({
  image,
  alt,
  imageLabel,
  imageSublabel,
  eyebrow,
  title,
  hindi,
  description,
  chips,
  href,
  footer,
  headingLevel: H = "h3",
  sizes = "(min-width: 1024px) 360px, (min-width: 640px) 50vw, 100vw",
  priority,
  className,
  onClick,
}: ImageCardProps) {
  return (
    <article
      className={cn(
        "group relative flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-surface transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_14px_34px_-18px_rgba(60,30,20,0.35)]",
        className,
      )}
    >
      <div className="relative aspect-[4/3] overflow-hidden">
        <div className="absolute inset-0 transition-transform duration-500 ease-out group-hover:scale-[1.04]">
          <ImageWithFallback
            src={image}
            alt={alt}
            label={imageLabel ?? title}
            sublabel={imageSublabel}
            fill
            sizes={sizes}
            priority={priority}
            className="object-cover"
          />
        </div>
      </div>
      <div className="flex flex-1 flex-col p-5">
        {eyebrow && <p className="eyebrow mb-1.5 text-[11px]">{eyebrow}</p>}
        <H className="text-[19px] font-semibold leading-snug text-ink">
          {href ? (
            <Link href={href} onClick={onClick} className="after:absolute after:inset-0 after:content-[''] focus-visible:outline-none">
              {title}
            </Link>
          ) : (
            title
          )}
          {hindi && (
            <span lang="hi" className="ml-2 font-deva text-base font-medium text-primary">
              {hindi}
            </span>
          )}
        </H>
        {description && <p className="mt-1.5 text-sm leading-relaxed text-muted">{description}</p>}
        {chips && chips.length > 0 && (
          <ul className="mt-3.5 flex flex-wrap gap-1.5" aria-label="Details">
            {chips.map((c) => (
              <li key={c}>
                <TagChip>{c}</TagChip>
              </li>
            ))}
          </ul>
        )}
        {footer && <div className="relative z-10 mt-auto pt-4">{footer}</div>}
      </div>
    </article>
  );
}
