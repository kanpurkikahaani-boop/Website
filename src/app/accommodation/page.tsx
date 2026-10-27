import type { Metadata } from "next";
import { PageHero } from "@/components/sections/PageHero";
import { StayList } from "@/components/sections/StayList";
import { Section } from "@/components/ui/Section";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { SampleNote } from "@/components/ui/SampleNote";
import { InlineLink } from "@/components/ui/InlineLink";
import { stays } from "@/data/stays";
import { cities } from "@/data/cities";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Where to Stay in Kanpur – Hotels, Homestays & Budget Stays | Kanpur Ki Kahaani",
  description:
    "Where to stay in Kanpur and nearby cities: luxury hotels in Civil Lines, mid-range stays in Swaroop Nagar and budget homestays by the Bithoor ghats, by price.",
  path: "/accommodation",
  ogImage: "/og/accommodation",
});

export default function AccommodationPage() {
  const cityOptions = [{ value: "kanpur", label: "Kanpur" }, ...cities.map((c) => ({ value: c.slug, label: c.name }))];
  return (
    <>
      <PageHero
        eyebrow="Stay & Live"
        title="Accommodation"
        subtitle="Sleep easy — from heritage havelis in Civil Lines to homestays by the ghats of Bithoor."
        crumbs={[{ name: "Stay & Live", href: "/accommodation" }, { name: "Accommodation" }]}
      />
      <Section labelledBy="stays-title">
        <div className="flex flex-col justify-between gap-2 md:flex-row md:items-start">
          <SectionHeader id="stays-title" eyebrow="Stays" title="Pick Your Budget" intro="Filter by budget and city — then compare live prices on the booking site." />
          <span className="mb-6 inline-flex shrink-0 self-start rounded-full border border-accent/40 bg-accent-soft px-3 py-1 text-xs font-semibold text-accent-ink">
            Sample listings
          </span>
        </div>
        <StayList stays={stays} cityOptions={cityOptions} />
        <SampleNote className="mt-8">
          These are sample listings with indicative per-night prices. &ldquo;Book this stay&rdquo; opens a booking-site search for the
          area; we may earn a commission at no extra cost to you.
        </SampleNote>
        <p className="mt-4 text-sm">
          Not sure where to base yourself? <InlineLink href="/tourism#planner">Plan your days first</InlineLink>
        </p>
      </Section>
    </>
  );
}
