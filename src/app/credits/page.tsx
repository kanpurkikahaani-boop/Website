import type { Metadata } from "next";
import Image from "next/image";
import { PageHero } from "@/components/sections/PageHero";
import { Section } from "@/components/ui/Section";
import { photos, type Photo } from "@/data/images";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Photo credits | Kanpur Ki Kahaani",
  description: "Who took the photographs on Kanpur Ki Kahaani, where they come from and under which licence.",
  path: "/credits",
});

const SOURCE: Record<Photo["source"], string> = {
  own: "Our team",
  wikimedia: "Wikimedia Commons",
  unsplash: "Unsplash",
  pexels: "Pexels",
  flickr: "Flickr",
};

/** Unsplash asks for referral parameters on every link back to it. */
const utm = (url: string, source: Photo["source"]) =>
  source === "unsplash" ? `${url}${url.includes("?") ? "&" : "?"}utm_source=kanpur_ki_kahaani&utm_medium=referral` : url;

const ext = { target: "_blank", rel: "noopener noreferrer" } as const;

/**
 * Required attribution for CC BY / CC BY-SA photos, and good practice for Unsplash and Pexels.
 * Generated from the photo manifest (src/data/images.ts), so it is always in sync.
 */
export default function CreditsPage() {
  const list = Object.entries(photos)
    .filter(([, p]) => p.credit !== false)
    .sort(([a], [b]) => a.localeCompare(b));
  return (
    <>
      <PageHero
        eyebrow="Kanpur Ki Kahaani"
        title="Photo credits"
        subtitle="Every photograph on this site is a real photo, used under its licence. Thank you to the photographers."
        crumbs={[{ name: "Photo credits" }]}
      />
      <Section labelledBy="credits-title">
        <h2 id="credits-title" className="sr-only">All photo credits</h2>
        {list.length === 0 ? (
          <p className="mx-auto max-w-xl text-center">
            No photos are credited yet. Places without a photo show an illustrated tile until a real, correctly licensed photograph is added.
          </p>
        ) : (
          <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {list.map(([key, p]) => (
              <li key={key} className="overflow-hidden rounded-2xl border border-border bg-surface">
                <div className="relative aspect-[4/3] bg-bg-alt">
                  <Image src={p.src} alt={p.alt} fill sizes="(min-width: 1024px) 360px, (min-width: 640px) 50vw, 100vw" className="object-cover" style={{ objectPosition: p.objectPosition }} />
                </div>
                <div className="space-y-1 p-4 text-sm">
                  <p className="font-semibold text-ink">
                    {p.subject}
                    {p.representative && <span className="ml-1.5 rounded-full bg-accent-soft px-2 py-0.5 text-[11px] font-semibold text-accent-ink">Representative image</span>}
                  </p>
                  <p>
                    Photo:{" "}
                    {p.authorUrl ? <a href={utm(p.authorUrl, p.source)} {...ext} className="text-primary hover:underline">{p.author}</a> : p.author}
                  </p>
                  <p>
                    Source:{" "}
                    {p.sourcePageUrl ? <a href={utm(p.sourcePageUrl, p.source)} {...ext} className="text-primary hover:underline">{SOURCE[p.source]}</a> : SOURCE[p.source]}
                    {" · "}Licence:{" "}
                    {p.licenseUrl ? <a href={p.licenseUrl} {...ext} className="text-primary hover:underline">{p.license}</a> : p.license}
                  </p>
                  {p.changes && <p className="text-muted">Changes: {p.changes}</p>}
                </div>
              </li>
            ))}
          </ul>
        )}
      </Section>
    </>
  );
}
