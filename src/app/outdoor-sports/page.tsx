import type { Metadata } from "next";
import { PageHero } from "@/components/sections/PageHero";
import { Section } from "@/components/ui/Section";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { ImageCard } from "@/components/ui/ImageCard";
import { FadeUp } from "@/components/ui/FadeUp";
import { InlineLink } from "@/components/ui/InlineLink";
import { JsonLd } from "@/components/seo/JsonLd";
import { outdoor } from "@/data/outdoor";
import { buildMetadata, touristAttractionsJsonLd } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Outdoor & Sports in Kanpur – Parks, Ghats & Green Park | Kanpur Ki Kahaani",
  description:
    "Outdoor things to do in Kanpur: cricket at Green Park Stadium, forest walks at Allen Forest Zoo, Moti Jheel evenings, Bithoor boating and the city's best parks.",
  path: "/outdoor-sports",
  ogImage: "/og/outdoor-sports",
});

export default function OutdoorPage() {
  return (
    <>
      <PageHero
        eyebrow="Explore"
        title="Outdoor & Sports"
        subtitle="River mornings, forest trails and roaring cricket stands — Kanpur's outdoors has a pace for everyone."
        crumbs={[{ name: "Explore", href: "/tourism" }, { name: "Outdoor & Sports" }]}
      />
      <Section labelledBy="outdoor-title">
        <SectionHeader id="outdoor-title" eyebrow="Open air" title="Parks, Ghats & Arenas" intro="Where Kanpur goes to breathe, play and cheer." />
        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {outdoor.map((o, i) => (
            <FadeUp as="li" key={o.slug} delay={(i % 3) * 0.06}>
              <ImageCard image={o.image} alt={o.alt} imageLabel={o.name} imageSublabel={o.type} eyebrow={o.type} title={o.name} description={o.description} chips={[o.area]} />
            </FadeUp>
          ))}
        </ul>
        <p className="mt-8 text-sm">
          Make a day of it — <InlineLink href="/weather">check Kanpur&apos;s weather</InlineLink>
        </p>
      </Section>
      <JsonLd
        data={touristAttractionsJsonLd(
          outdoor.map((o) => ({ name: o.name, description: o.description, area: o.area, city: "Kanpur" })),
          "Parks and sports venues in Kanpur",
        )}
      />
    </>
  );
}
