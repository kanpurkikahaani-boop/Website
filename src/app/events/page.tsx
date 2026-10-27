import type { Metadata } from "next";
import { PageHero } from "@/components/sections/PageHero";
import { EventList } from "@/components/sections/EventList";
import { Section } from "@/components/ui/Section";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { SampleNote } from "@/components/ui/SampleNote";
import { JsonLd } from "@/components/seo/JsonLd";
import { events } from "@/data/events";
import { cities } from "@/data/cities";
import { absoluteUrl } from "@/data/site";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Upcoming Events in Kanpur & Nearby Cities 2026–27 | Kanpur Ki Kahaani",
  description:
    "What's on in Kanpur, Lucknow, Agra, Prayagraj, Varanasi and Ayodhya: Dev Deepawali, Deepotsav, Lucknow Mahotsav, Magh Mela, Taj Mahotsav and Ganga Mela dates.",
  path: "/events",
  ogImage: "/og/events",
});

const cityOptions = [
  { value: "all" as const, label: "All" },
  { value: "kanpur" as const, label: "Kanpur" },
  ...cities.map((c) => ({ value: c.slug, label: c.name })),
];

export default function EventsPage() {
  const cityName = (slug: string) => cityOptions.find((c) => c.value === slug)?.label ?? slug;
  const eventLd = events.map((e) => ({
    "@context": "https://schema.org",
    "@type": "Event",
    name: e.title,
    description: e.description,
    startDate: e.start,
    endDate: e.end ?? e.start,
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    location: {
      "@type": "Place",
      name: e.venue,
      address: { "@type": "PostalAddress", addressLocality: cityName(e.city), addressRegion: "Uttar Pradesh", addressCountry: "IN" },
    },
    url: absoluteUrl(`/events?city=${e.city}`),
  }));

  return (
    <>
      <PageHero
        eyebrow="Live"
        title="Upcoming Events"
        subtitle="Marathons, melas and music — here's what Kanpur and its neighbours have on the calendar."
        crumbs={[{ name: "Live", href: "/events" }, { name: "Upcoming Events" }]}
      />
      <Section labelledBy="calendar-title">
        <SectionHeader id="calendar-title" eyebrow="Calendar" title="Don't Miss These" intro="Sorted soonest first. Past events disappear automatically." align="center" />
        <EventList events={events} cityOptions={cityOptions} />
        <SampleNote className="mx-auto mt-8 max-w-[720px] justify-center">
          Dates are indicative — confirm with organisers. Listings are samples for demonstration.
        </SampleNote>
      </Section>
      <JsonLd data={eventLd} />
    </>
  );
}
