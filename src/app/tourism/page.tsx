import type { Metadata } from "next";
import { PageHero } from "@/components/sections/PageHero";
import { PlaceGrid } from "@/components/sections/PlaceGrid";
import { ItineraryPlanner } from "@/components/sections/ItineraryPlanner";
import { Section } from "@/components/ui/Section";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { InlineLink } from "@/components/ui/InlineLink";
import { JsonLd } from "@/components/seo/JsonLd";
import { kanpurPlaces } from "@/data/places";
import { buildMetadata, touristAttractionsJsonLd } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Tourism in Kanpur – Places to Visit & Itinerary Planner | Kanpur Ki Kahaani",
  description:
    "Places to visit in Kanpur — JK Temple, Bithoor ghats, Memorial Church, Allen Forest Zoo and more — plus a free planner that builds your day-by-day Kanpur trip.",
  path: "/tourism",
  ogImage: "/og/tourism",
});

export default function TourismPage() {
  return (
    <>
      <PageHero
        eyebrow="Explore"
        title="Tourism in Kanpur"
        subtitle="From ancient ghats to mill-town landmarks, here are the places that tell Kanpur's story — plus a planner to stitch them into your perfect trip."
        crumbs={[{ name: "Explore", href: "/tourism" }, { name: "Tourism & Itinerary Planner" }]}
      />
      <Section labelledBy="sights-title">
        <SectionHeader
          id="sights-title"
          eyebrow="Sights"
          title="Places to Visit"
          intro="Fourteen places to visit in Kanpur, from riverside heritage to bazaars — filter by what you love."
        />
        <PlaceGrid places={kanpurPlaces} cityLabel="Kanpur" />
      </Section>
      <Section tone="alt" id="planner" labelledBy="planner-title">
        <SectionHeader
          id="planner-title"
          eyebrow="Itinerary"
          title="Plan Your Itinerary"
          intro="Pick your days and interests, add a nearby city if you like, and we'll build a day-by-day plan grouped by area to keep travel short."
        />
        <ItineraryPlanner />
        <p className="mt-6 text-sm">
          Thinking bigger? <InlineLink href="/nearby">See suggested circuits beyond Kanpur</InlineLink>
        </p>
      </Section>
      <JsonLd
        data={touristAttractionsJsonLd(
          kanpurPlaces.map((p) => ({ name: p.name, description: p.description, area: p.area, city: "Kanpur" })),
          "Places to visit in Kanpur",
        )}
      />
    </>
  );
}
