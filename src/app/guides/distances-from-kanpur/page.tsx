import type { Metadata } from "next";
import Link from "next/link";
import { Download, Plane, TrainFront, Car } from "lucide-react";
import { PageHero } from "@/components/sections/PageHero";
import { Section } from "@/components/ui/Section";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { JsonLd } from "@/components/seo/JsonLd";
import { CiteThisPage } from "@/components/seo/CiteThisPage";
import { kanpurInfo } from "@/data/cities";
import { absoluteUrl, site } from "@/data/site";
import { DISTANCES_PATH, DISTANCES_TITLE, DISTANCES_UPDATED, distanceRows } from "@/lib/distances";
import { breadcrumbJsonLd, buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Distances from Kanpur to Lucknow, Agra, Prayagraj, Varanasi & Ayodhya | Kanpur Ki Kahaani",
  description: "How far is Lucknow, Agra, Prayagraj, Varanasi or Ayodhya from Kanpur? Road and straight-line distances, drive and train times, airports and best season — free to cite.",
  path: DISTANCES_PATH,
});

const ICON = { train: TrainFront, road: Car, air: Plane };
const updatedLabel = new Date(`${DISTANCES_UPDATED}T00:00:00+05:30`).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Kolkata" });

/**
 * Reference guide (v11): one citable page with the travel facts other sites look for, plus a
 * CSV download and Dataset markup. Figures come from the city guides (src/data/cities.ts);
 * straight-line distances are computed from city-centre coordinates.
 */
export default function DistancesPage() {
  const rows = distanceRows();
  const url = absoluteUrl(DISTANCES_PATH);
  const dataset = {
    "@context": "https://schema.org",
    "@type": "Dataset",
    name: DISTANCES_TITLE,
    description: "Approximate road distance, straight-line distance, typical drive and train times, nearest airport and best season for travel from Kanpur to five nearby cities in Uttar Pradesh.",
    url,
    dateModified: DISTANCES_UPDATED,
    license: "https://creativecommons.org/licenses/by/4.0/",
    creator: { "@type": "Organization", name: site.name, url: site.url },
    isAccessibleForFree: true,
    spatialCoverage: { "@type": "Place", name: "Kanpur and nearby cities, Uttar Pradesh, India" },
    variableMeasured: ["Road distance (km)", "Straight-line distance (km)", "Drive time", "Train time", "Nearest airport", "Best time to visit"],
    distribution: [{ "@type": "DataDownload", encodingFormat: "text/csv", contentUrl: absoluteUrl(`${DISTANCES_PATH}.csv`) }],
  };

  return (
    <>
      <JsonLd data={[dataset, breadcrumbJsonLd([{ name: "Home", href: "/" }, { name: "Nearby Cities", href: "/nearby" }, { name: "Distances from Kanpur" }])]} />
      <PageHero
        eyebrow="Travel guide"
        title="Distances from Kanpur"
        subtitle="How far Lucknow, Agra, Prayagraj, Varanasi and Ayodhya are by road, rail and air — in one table you can cite."
        crumbs={[{ name: "Nearby Cities", href: "/nearby" }, { name: "Distances from Kanpur" }]}
      />

      <Section labelledBy="table-title">
        <SectionHeader id="table-title" eyebrow={`Updated ${updatedLabel}`} title="Kanpur to five nearby cities" intro="Sorted from nearest to farthest. Road distances and times are typical for the usual routes and change with traffic, roadworks and the train you take." />
        <div className="overflow-x-auto rounded-2xl border border-border bg-surface">
          <table className="w-full min-w-[920px] text-left text-sm">
            <caption className="sr-only">Distances and travel times from Kanpur to nearby cities</caption>
            <thead className="bg-dark text-[11px] uppercase tracking-[0.14em] text-accent">
              <tr>
                {["From Kanpur to", "By road (approx.)", "Straight line", "Drive", "Train", "Fastest way", "Nearest airport", "Best time"].map((h) => (
                  <th key={h} scope="col" className="px-4 py-3.5 font-bold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.city.slug} className="border-t border-border align-top">
                  <th scope="row" className="px-4 py-3.5">
                    <Link href={`/cities/${r.city.slug}`} className="font-display text-base font-semibold text-ink hover:text-primary">{r.city.name}</Link>
                  </th>
                  <td className="px-4 py-3.5 font-semibold text-ink">~{r.roadKm} km</td>
                  <td className="px-4 py-3.5">{r.straightKm} km</td>
                  <td className="px-4 py-3.5">{r.drive}</td>
                  <td className="px-4 py-3.5">{r.train}</td>
                  <td className="px-4 py-3.5">{r.fastest}</td>
                  <td className="px-4 py-3.5">{r.airport}</td>
                  <td className="px-4 py-3.5">{r.bestTime}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
          <a href={`${DISTANCES_PATH}.csv`} download className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 font-semibold text-white hover:bg-primary-hover">
            <Download size={15} aria-hidden /> Download as CSV
          </a>
          <span className="text-muted">Free to reuse under <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener noreferrer" className="underline">CC BY 4.0</a> — credit “{site.name}” with a link to this page.</span>
        </p>
      </Section>

      <Section tone="alt" labelledBy="routes-title">
        <SectionHeader id="routes-title" eyebrow="Route by route" title="How to get there" />
        <div className="grid gap-6 md:grid-cols-2">
          {rows.map((r) => (
            <article key={r.city.slug} aria-labelledby={`r-${r.city.slug}`} className="rounded-2xl border border-border bg-surface p-6">
              <h3 id={`r-${r.city.slug}`} className="font-display text-xl font-bold text-primary">Kanpur to {r.city.name}</h3>
              <p className="mt-1 text-sm text-muted">~{r.roadKm} km by road · {r.straightKm} km in a straight line · best {r.bestTime}</p>
              <ul className="mt-4 space-y-3">
                {r.city.gettingThere.map((m) => {
                  const Icon = ICON[m.mode];
                  return (
                    <li key={m.title} className="flex gap-3 text-[15px]">
                      <Icon size={18} className="mt-0.5 shrink-0 text-accent" aria-hidden />
                      <span><strong className="text-ink">{m.title}:</strong> {m.body}</span>
                    </li>
                  );
                })}
              </ul>
              <p className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-sm font-semibold">
                <Link href={`/cities/${r.city.slug}`} className="text-primary hover:underline">{r.city.name} travel guide →</Link>
                <Link href={`/tourism?cities=${r.city.slug}#planner`} className="text-primary hover:underline">Plan a trip with {r.city.name} →</Link>
              </p>
            </article>
          ))}
        </div>
      </Section>

      <Section labelledBy="method-title">
        <div className="max-w-[760px]">
          <SectionHeader id="method-title" eyebrow="Method" title="How these figures were worked out" className="mb-6" />
          <ul className="list-disc space-y-2 pl-5 text-[15.5px]">
            <li><strong>By road</strong> is the approximate driving distance on the usual highway route between city centres, rounded to the nearest 10 km.</li>
            <li><strong>Straight line</strong> is the great-circle distance between city-centre coordinates (Kanpur {`${kanpurInfo.lat}° N, ${kanpurInfo.lon}° E`}), calculated, not estimated.</li>
            <li><strong>Drive and train times</strong> are typical door-to-door ranges for a weekday; check live traffic and the current train timetable before you travel.</li>
            <li>Spotted something out of date? Tell us via any of our social profiles and we&apos;ll update the table and the date above.</li>
          </ul>
          <p className="mt-6 text-[15.5px]">
            Planning more than one city? Our <Link href="/nearby" className="font-semibold text-primary underline">nearby cities guide</Link> suggests multi-city circuits, and the{" "}
            <Link href="/weather" className="font-semibold text-primary underline">weather page</Link> has the forecast for each city.
          </p>
          <CiteThisPage url={url} title={DISTANCES_TITLE} updated={DISTANCES_UPDATED} />
        </div>
      </Section>
    </>
  );
}
