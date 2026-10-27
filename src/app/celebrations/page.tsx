import type { Metadata } from "next";
import { PageHero } from "@/components/sections/PageHero";
import { FilterableCards } from "@/components/sections/FilterableCards";
import { Section } from "@/components/ui/Section";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { InlineLink } from "@/components/ui/InlineLink";
import { festivals } from "@/data/festivals";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Festivals in Kanpur – Ganga Mela, Holi & Dev Deepawali | Kanpur Ki Kahaani",
  description:
    "Kanpur's festival calendar: Holi and the city's unique Ganga Mela, Durga Puja, Diwali, Dev Deepawali at Bithoor and Chhath on the ghats — when to go and where.",
  path: "/celebrations",
  ogImage: "/og/celebrations",
});

const MONTHS = ["", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export default function CelebrationsPage() {
  const months = [...new Set(festivals.map((f) => f.monthIndex))].sort((a, b) => a - b);
  const options = [{ value: "all", label: "All months" }, ...months.map((m) => ({ value: MONTHS[m].toLowerCase(), label: MONTHS[m] }))];
  return (
    <>
      <PageHero
        eyebrow="Explore"
        title="Celebrations"
        subtitle="Kanpur celebrates loudly and lovingly — rivers of lamps, clouds of colour, and bazaars that stay awake all night."
        crumbs={[{ name: "Explore", href: "/tourism" }, { name: "Celebrations" }]}
      />
      <Section labelledBy="festivals-title">
        <SectionHeader
          id="festivals-title"
          eyebrow="Festivals"
          title="The City's Festival Calendar"
          intro="Dates follow the Hindu lunar calendar, so they shift a little each year."
        />
        <FilterableCards
          param="month"
          label="Filter festivals by month"
          options={options}
          items={festivals.map((f) => ({
            key: f.slug,
            tags: [MONTHS[f.monthIndex].toLowerCase(), ...(f.month.includes("October") && f.monthIndex !== 10 ? ["oct"] : [])],
            card: { image: f.image, alt: f.alt, imageLabel: f.name, imageSublabel: f.month, eyebrow: f.month, title: f.name, description: f.description, chips: [f.where] },
          }))}
        />
        <p className="mt-8 text-sm">
          Want exact dates? <InlineLink href="/events">See upcoming events</InlineLink>
        </p>
      </Section>
    </>
  );
}
