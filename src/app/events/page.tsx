import type { Metadata } from "next";
import { PageHero } from "@/components/sections/PageHero";
import { EventList } from "@/components/sections/EventList";
import { BmsCityStrip } from "@/components/events/BmsCityStrip";
import { Section } from "@/components/ui/Section";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { JsonLd } from "@/components/seo/JsonLd";
import { absoluteUrl } from "@/data/site";
import { getEventsLastRefreshed, getUpcomingEvents } from "@/lib/events";
import { formatIST } from "@/lib/news/query";
import { CITY_LABELS, type NewsCity } from "@/lib/news/taxonomy";
import { buildMetadata } from "@/lib/seo";

// Re-rendered at most every 5 minutes, instantly when the admin publishes, and after the daily cron.
export const revalidate = 300;

export const metadata: Metadata = buildMetadata({
  title: "Events in Kanpur Today – Concerts, Comedy & Festivals | Kanpur Ki Kahaani",
  description:
    "What's on in Kanpur, Lucknow, Agra, Prayagraj, Varanasi and Ayodhya: live BookMyShow listings for each city plus our pick of upcoming events, with booking links.",
  path: "/events",
  ogImage: "/og/events",
});

export default async function EventsPage() {
  const [events, lastRefreshed] = await Promise.all([getUpcomingEvents(), getEventsLastRefreshed()]);
  const refreshed = lastRefreshed ?? new Date().toISOString();

  const eventLd = events.map((e) => ({
    "@context": "https://schema.org",
    "@type": "Event",
    name: e.title,
    startDate: e.startAt,
    endDate: e.endAt ?? e.startAt,
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    ...(e.imageUrl ? { image: e.imageUrl } : {}),
    location: {
      "@type": "Place",
      name: e.venue || CITY_LABELS[e.city as NewsCity]?.en,
      address: { "@type": "PostalAddress", addressLocality: CITY_LABELS[e.city as NewsCity]?.en, addressRegion: "Uttar Pradesh", addressCountry: "IN" },
    },
    url: absoluteUrl("/events"),
    ...(e.bmsUrl || e.sourceUrl ? { offers: { "@type": "Offer", url: e.bmsUrl ?? e.sourceUrl, availability: "https://schema.org/InStock" } } : {}),
  }));

  return (
    <>
      <PageHero
        eyebrow="Live"
        title="Upcoming Events"
        subtitle="Concerts, comedy, melas and marathons — see what's on today in Kanpur and its neighbours, and book in a tap."
        crumbs={[{ name: "Live", href: "/events" }, { name: "Upcoming Events" }]}
      />
      <Section labelledBy="bms-title">
        <SectionHeader id="bms-title" eyebrow="Live on BookMyShow" title="What's On Today" intro="BookMyShow keeps these city pages current — tap a city to see today's events and book tickets." />
        <BmsCityStrip />
        <p className="mt-4 text-xs text-muted">Opens BookMyShow in a new tab. Kanpur Ki Kahaani isn&apos;t affiliated with BookMyShow.</p>
      </Section>
      <Section tone="alt" labelledBy="calendar-title">
        <SectionHeader id="calendar-title" eyebrow="Our picks" title="Don't Miss These" intro="Hand-picked events from our team, soonest first." align="center" />
        <p className="-mt-6 mb-8 text-center text-xs text-muted">Updated daily · Last refreshed {formatIST(refreshed)}</p>
        <EventList
          events={events.map((e) => ({
            id: e.id,
            title: e.title,
            category: e.category,
            city: e.city,
            venue: e.venue,
            startAt: e.startAt,
            endAt: e.endAt,
            bmsUrl: e.bmsUrl,
            sourceUrl: e.sourceUrl,
          }))}
        />
      </Section>
      {eventLd.length > 0 && <JsonLd data={eventLd} />}
    </>
  );
}
