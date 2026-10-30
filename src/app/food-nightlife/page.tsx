import type { Metadata } from "next";
import { PageHero } from "@/components/sections/PageHero";
import { FilterableCards } from "@/components/sections/FilterableCards";
import { Section } from "@/components/ui/Section";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { SampleNote } from "@/components/ui/SampleNote";
import { InlineLink } from "@/components/ui/InlineLink";
import { foodFor, foodTabs } from "@/data/food";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Kanpur Street Food, Restaurants & Night Life | Kanpur Ki Kahaani",
  description:
    "Kanpur street food guide: Thaggu Ke Laddu, Arya Nagar chaat, midnight handi biryani and kulhad chai, plus the city's best restaurants, cafes and nights out.",
  path: "/food-nightlife",
  ogImage: "/og/food-nightlife",
});

export default function FoodPage() {
  return (
    <>
      <PageHero
        eyebrow="Explore"
        title="Food & Night Life"
        subtitle="Kanpur eats well — from handi biryani at midnight carts to slow coffee in mill-town cafes and rooftop evenings."
        crumbs={[{ name: "Explore", href: "/tourism" }, { name: "Food & Night Life" }]}
      />
      <Section labelledBy="taste-title">
        <SectionHeader id="taste-title" eyebrow="Taste" title="Where Kanpur Eats" intro="Street food, restaurants, cafes and nights out — choose your mood." />
        <FilterableCards
          mode="tabs"
          param="tab"
          label="Food categories"
          options={foodTabs.map((t) => ({ value: t.value, label: t.label }))}
          items={foodFor("kanpur").map((f) => ({
            key: f.slug,
            tags: [f.kind],
            card: { image: f.image, alt: f.alt, imageLabel: f.name, imageSublabel: f.eyebrow, eyebrow: f.eyebrow, title: f.name, description: f.description, chips: [f.area, f.price] },
          }))}
        />
        <SampleNote className="mt-8">Prices are indicative and some venue names are illustrative — check locally before you go.</SampleNote>
        <p className="mt-4 text-sm">
          Hungry for more? <InlineLink href="/blogs/eating-through-arya-nagar">Read our Arya Nagar food crawl</InlineLink>
        </p>
      </Section>
    </>
  );
}
