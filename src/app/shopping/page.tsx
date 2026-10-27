import type { Metadata } from "next";
import { PageHero } from "@/components/sections/PageHero";
import { Section } from "@/components/ui/Section";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { ImageCard } from "@/components/ui/ImageCard";
import { FadeUp } from "@/components/ui/FadeUp";
import { InlineLink } from "@/components/ui/InlineLink";
import { JsonLd } from "@/components/seo/JsonLd";
import { shoppingFor } from "@/data/shopping";
import { buildMetadata, touristAttractionsJsonLd } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Shopping in Kanpur – Best Markets & Bazaars | Kanpur Ki Kahaani",
  description:
    "Where to shop in Kanpur: Naveen Market, Gumti No. 5 bangles, Jajmau leather outlets, Bada Chauraha, Sisamau Bazaar and Z Square Mall — with the best time to go.",
  path: "/shopping",
  ogImage: "/og/shopping",
});

export default function ShoppingPage() {
  const markets = shoppingFor("kanpur");
  return (
    <>
      <PageHero
        eyebrow="Explore"
        title="Shopping Streets"
        subtitle="Kanpur shops like it lives — with gusto. Leather from Jajmau, bangles from Gumti, and bargains everywhere in between."
        crumbs={[{ name: "Explore", href: "/tourism" }, { name: "Shopping Streets" }]}
      />
      <Section labelledBy="bazaars-title">
        <SectionHeader id="bazaars-title" eyebrow="Bazaars" title="Markets & High Streets" intro="Seven places to shop, haggle and people-watch — plus when to go." />
        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {markets.map((m, i) => (
            <FadeUp as="li" key={m.slug} delay={(i % 3) * 0.06}>
              <ImageCard image={m.image} alt={m.alt} imageLabel={m.name} imageSublabel={m.area} eyebrow={m.area} title={m.name} description={m.knownFor} chips={[m.bestTime]} />
            </FadeUp>
          ))}
        </ul>
        <p className="mt-8 text-sm">
          Shopping makes you hungry — <InlineLink href="/food-nightlife">see where Kanpur eats</InlineLink>
        </p>
      </Section>
      <JsonLd
        data={touristAttractionsJsonLd(
          markets.map((m) => ({ name: m.name, description: m.knownFor, area: m.area, city: "Kanpur" })),
          "Markets in Kanpur",
        )}
      />
    </>
  );
}
