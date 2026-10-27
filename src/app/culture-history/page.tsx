import type { Metadata } from "next";
import { PageHero } from "@/components/sections/PageHero";
import { Timeline } from "@/components/sections/Timeline";
import { Section } from "@/components/ui/Section";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { ImageCard } from "@/components/ui/ImageCard";
import { FadeUp } from "@/components/ui/FadeUp";
import { InlineLink } from "@/components/ui/InlineLink";
import { JsonLd } from "@/components/seo/JsonLd";
import { landmarks, timeline } from "@/data/history";
import { buildMetadata, touristAttractionsJsonLd } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Kanpur History & Culture – From Jajmau to the Mills | Kanpur Ki Kahaani",
  description:
    "Explore Kanpur's history: ancient Jajmau, sacred Bithoor, the 1857 Siege of Cawnpore, the Manchester of the East mills and heritage landmarks to visit today.",
  path: "/culture-history",
  ogImage: "/og/culture-history",
});

export default function CultureHistoryPage() {
  return (
    <>
      <PageHero
        eyebrow="Explore"
        title="Culture & History"
        subtitle="Two millennia of stories live here — ancient mounds, sacred ghats, a siege that shook an empire, and the mills that clothed one."
        crumbs={[{ name: "Explore", href: "/tourism" }, { name: "Culture & History" }]}
      />
      <Section labelledBy="timeline-title">
        <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
          <div>
            <SectionHeader
              id="timeline-title"
              eyebrow="Timeline"
              title="Kanpur Through the Ages"
              intro="From a riverside settlement to the Manchester of the East — and the city it's becoming now."
            />
            <InlineLink href="/blog/mills-that-built-a-city">Read: The Mills That Built a City</InlineLink>
          </div>
          <Timeline entries={timeline.map((e) => ({ label: e.era, title: e.title, body: e.description }))} />
        </div>
      </Section>
      <Section tone="alt" labelledBy="heritage-title">
        <SectionHeader
          id="heritage-title"
          eyebrow="Heritage"
          title="Landmarks That Remember"
          intro="Six places where you can stand inside Kanpur's history."
        />
        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {landmarks.map((l, i) => (
            <FadeUp as="li" key={l.slug} delay={(i % 3) * 0.06}>
              <ImageCard image={l.image} alt={l.alt} imageLabel={l.name} imageSublabel={l.era} eyebrow={l.era} title={l.name} description={l.description} />
            </FadeUp>
          ))}
        </ul>
        <p className="mt-8 text-sm">
          Ready to see them? <InlineLink href="/tourism#planner">Add them to your itinerary</InlineLink>
        </p>
      </Section>
      <JsonLd
        data={touristAttractionsJsonLd(
          landmarks.map((l) => ({ name: l.name, description: l.description, city: "Kanpur" })),
          "Heritage landmarks in Kanpur",
        )}
      />
    </>
  );
}
