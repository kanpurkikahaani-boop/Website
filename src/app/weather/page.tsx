import type { Metadata } from "next";
import { CloudRain, Sun, ThermometerSun } from "lucide-react";
import { PageHero } from "@/components/sections/PageHero";
import { Section } from "@/components/ui/Section";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { IconBadge } from "@/components/ui/IconBadge";
import { TagChip } from "@/components/ui/TagChip";
import { cities } from "@/data/cities";
import { site } from "@/data/site";
import { buildMetadata } from "@/lib/seo";
import { FaqSection } from "@/components/faq/FaqSection";
import { faqPageInfo, faqs, weatherGroups } from "@/data/faqs";
import { WeatherClient } from "./WeatherClient";

export const metadata: Metadata = buildMetadata({
  title: "Kanpur Weather Today & Tomorrow – Live Rain Radar & Forecast | Kanpur Ki Kahaani",
  description:
    "Live Kanpur weather now: current temperature, rain today, tomorrow's forecast, hourly and 7-day outlook, and a live rain radar. Check the weather at your location too.",
  path: "/weather",
  ogImage: "/og/weather",
});

const seasons = [
  { icon: Sun, months: "October – March", tag: "Best", title: "Cool & clear", body: "Sunny days of 20–30°C and crisp evenings — perfect for ghats, walks and festivals. December–January nights can dip to 5°C with morning fog." },
  { icon: ThermometerSun, months: "April – June", tag: "Hot", title: "Peak summer", body: "Afternoons regularly cross 40°C. Plan sightseeing for early mornings and evenings, and lean on malls, museums and kulfi in between." },
  { icon: CloudRain, months: "July – September", tag: "Monsoon", title: "Green & humid", body: "Heavy showers cool the city and turn parks lush; expect humidity, waterlogging on some roads and dramatic skies over the Ganga." },
];

export default function WeatherPage() {
  const options = [
    { value: "kanpur", label: "Kanpur", lat: site.kanpur.lat, lon: site.kanpur.lon },
    ...cities.map((c) => ({ value: c.slug, label: c.name, lat: c.lat, lon: c.lon })),
  ];
  return (
    <>
      <PageHero
        eyebrow="Live"
        title="Kanpur Weather"
        subtitle="Live conditions on the banks of the Ganga, refreshed from the Open-Meteo service."
        crumbs={[{ name: "Live", href: "/events" }, { name: "Weather" }]}
      />
      <Section labelledBy="now-title">
        <SectionHeader id="now-title" eyebrow="Live" title="Kanpur weather right now" intro="Switch cities, or use your location, to check conditions before you head out." />
        <WeatherClient cities={options} />
      </Section>
      <Section tone="alt" labelledBy="seasons-title">
        <SectionHeader id="seasons-title" eyebrow="Seasons" title="Best Time to Visit" intro="Kanpur has three distinct seasons — here's what each one feels like." />
        <ul className="grid gap-6 md:grid-cols-3">
          {seasons.map((s) => (
            <li key={s.months} className="rounded-2xl border border-border bg-surface p-6">
              <div className="flex items-center justify-between">
                <IconBadge icon={s.icon} size={44} />
                <TagChip className={s.tag === "Best" ? "border-primary/30 bg-primary-soft text-primary" : ""}>{s.tag}</TagChip>
              </div>
              <p className="eyebrow mt-4">{s.months}</p>
              <h3 className="mt-1 text-xl font-semibold">{s.title}</h3>
              <p className="mt-2 text-[15px]">{s.body}</p>
            </li>
          ))}
        </ul>
      </Section>
      <FaqSection
        title={faqPageInfo.weather.title}
        items={faqs.weather}
        groups={weatherGroups}
        livePlace={{ lat: site.kanpur.lat, lon: site.kanpur.lon, label: "Kanpur" }}
        followSelectedPlace
      />
    </>
  );
}
