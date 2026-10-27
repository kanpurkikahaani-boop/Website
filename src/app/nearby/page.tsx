import type { Metadata } from "next";
import Link from "next/link";
import { Route } from "lucide-react";
import { PageHero } from "@/components/sections/PageHero";
import { HubSpokeMap } from "@/components/sections/HubSpokeMap";
import { CityCard } from "@/components/sections/CityCard";
import { Section } from "@/components/ui/Section";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { IconBadge } from "@/components/ui/IconBadge";
import { TagChip } from "@/components/ui/TagChip";
import { FadeUp } from "@/components/ui/FadeUp";
import { JsonLd } from "@/components/seo/JsonLd";
import { cities } from "@/data/cities";
import { buildMetadata, touristDestinationJsonLd } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Weekend Trips from Kanpur – Lucknow, Agra, Varanasi & More | Kanpur Ki Kahaani",
  description:
    "Plan weekend trips from Kanpur to Lucknow, Agra, Prayagraj, Varanasi and Ayodhya: distances, train and road times, best seasons and multi-city circuits.",
  path: "/nearby",
  ogImage: "/og/nearby",
});

const circuits = [
  { name: "Nawabi Weekend", route: "Kanpur → Lucknow", days: "2 days", cities: ["lucknow"], body: "Kebabs, imambaras and chikankari — the easiest getaway, by intercity train or a quick highway drive." },
  { name: "Spiritual Ganga Trail", route: "Kanpur → Prayagraj → Varanasi", days: "4–5 days", cities: ["prayagraj", "varanasi"], body: "Follow the river from the Sangam to the ghats of Kashi, with aartis at both ends." },
  { name: "Ram Path", route: "Kanpur → Lucknow → Ayodhya", days: "3 days", cities: ["lucknow", "ayodhya"], body: "A Nawabi stopover, then on to the new Ram Mandir and evening aarti on the Saryu." },
  { name: "Mughal Detour", route: "Kanpur → Agra", days: "2 days", cities: ["agra"], body: "Sunrise at the Taj Mahal, an afternoon at Agra Fort and sunset from Mehtab Bagh." },
];

export default function NearbyPage() {
  return (
    <>
      <PageHero
        eyebrow="Nearby Cities"
        title="Beyond Kanpur"
        subtitle="Kanpur sits at the heart of Uttar Pradesh's great travel circuit. Five legendary cities are a train ride or a highway drive away."
        crumbs={[{ name: "Nearby Cities", href: "/nearby" }, { name: "Overview" }]}
      />

      <Section labelledBy="hub-title">
        <SectionHeader id="hub-title" eyebrow="The circuit" title="Kanpur, the Hub" intro="Tap a city to open its guide. Lines show approximate road distance from Kanpur." />
        <HubSpokeMap />
      </Section>

      <Section tone="alt" labelledBy="compare-title">
        <SectionHeader id="compare-title" eyebrow="Compare" title="Which City Next?" intro="Kanpur to Lucknow, Agra, Varanasi, Prayagraj and Ayodhya at a glance." />
        <div className="overflow-x-auto rounded-2xl border border-border bg-surface">
          <table className="w-full min-w-[760px] text-left text-sm">
            <caption className="sr-only">Comparison of nearby cities from Kanpur</caption>
            <thead className="bg-dark text-[11px] uppercase tracking-[0.16em] text-accent">
              <tr>
                {["City", "Distance from Kanpur", "By road", "By train", "Best for", "Best time"].map((h) => (
                  <th key={h} scope="col" className="px-5 py-4 font-bold">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {cities.map((c) => (
                <tr key={c.slug} className="border-t border-border">
                  <th scope="row" className="px-5 py-4">
                    <Link href={`/cities/${c.slug}`} className="font-display text-base font-semibold text-ink hover:text-primary">
                      {c.name}
                    </Link>
                    <span lang="hi" className="ml-2 font-deva text-primary">
                      {c.hindi}
                    </span>
                  </th>
                  <td className="px-5 py-4">~{c.distanceKm} km</td>
                  <td className="px-5 py-4">{c.driveTime}</td>
                  <td className="px-5 py-4">{c.trainTime}</td>
                  <td className="px-5 py-4">{c.bestFor}</td>
                  <td className="px-5 py-4">{c.bestTime}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-xs">Times and distances are approximate and depend on route and traffic.</p>
      </Section>

      <Section labelledBy="circuits-title">
        <SectionHeader id="circuits-title" eyebrow="Suggested circuits" title="Ready-Made Routes" intro="Pick a route and open it in the planner with the cities already selected." />
        <ul className="grid gap-6 md:grid-cols-2">
          {circuits.map((c, i) => (
            <FadeUp as="li" key={c.name} delay={(i % 2) * 0.06}>
              <Link
                href={`/tourism?cities=${c.cities.join(",")}#planner`}
                className="group flex h-full flex-col rounded-2xl border border-border bg-surface p-6 transition hover:-translate-y-0.5 hover:shadow-[0_14px_34px_-18px_rgba(60,30,20,0.35)]"
              >
                <div className="flex items-start justify-between gap-4">
                  <IconBadge icon={Route} size={44} />
                  <TagChip>{c.days}</TagChip>
                </div>
                <p className="eyebrow mt-4">{c.route}</p>
                <h3 className="mt-1 text-2xl font-semibold group-hover:text-primary">{c.name}</h3>
                <p className="mt-2 text-[15px]">{c.body}</p>
                <span className="mt-auto pt-4 text-sm font-semibold text-primary">Open in the planner →</span>
              </Link>
            </FadeUp>
          ))}
        </ul>
      </Section>

      <Section tone="alt" labelledBy="cities-title">
        <SectionHeader id="cities-title" eyebrow="City guides" title="Five Cities, One Journey" />
        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {cities.map((c) => (
            <li key={c.slug}>
              <CityCard city={c} from="nearby" />
            </li>
          ))}
        </ul>
      </Section>
      <JsonLd
        data={cities.map((c) =>
          touristDestinationJsonLd({ name: c.name, description: c.shortIntro, path: `/cities/${c.slug}`, lat: c.lat, lon: c.lon }),
        )}
      />
    </>
  );
}
