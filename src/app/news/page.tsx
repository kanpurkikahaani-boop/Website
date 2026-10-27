import type { Metadata } from "next";
import { PageHero } from "@/components/sections/PageHero";
import { FilterableCards } from "@/components/sections/FilterableCards";
import { Section } from "@/components/ui/Section";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { InlineLink } from "@/components/ui/InlineLink";
import { news } from "@/data/news";
import { cities } from "@/data/cities";
import { buildMetadata } from "@/lib/seo";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = buildMetadata({
  title: "Kanpur News – City Headlines & Happenings | Kanpur Ki Kahaani",
  description:
    "Kanpur news in one place: headlines on the metro, ghats, Green Park cricket, leather industry and festivals, plus news from Lucknow, Varanasi, Agra and Ayodhya.",
  path: "/news",
  ogImage: "/og/news",
});

export default function NewsPage() {
  const names: Record<string, string> = { kanpur: "Kanpur", ...Object.fromEntries(cities.map((c) => [c.slug, c.name])) };
  const sorted = [...news].sort((a, b) => b.date.localeCompare(a.date));
  const options = [{ value: "all", label: "All" }, ...Object.entries(names).map(([value, label]) => ({ value, label }))];
  return (
    <>
      <PageHero
        eyebrow="Live"
        title="Kanpur News"
        subtitle="Headlines and happenings from across the city, gathered in one place."
        crumbs={[{ name: "Live", href: "/events" }, { name: "News" }]}
      />
      <Section labelledBy="headlines-title">
        <div className="flex flex-col justify-between gap-2 md:flex-row md:items-start">
          <SectionHeader id="headlines-title" eyebrow="Headlines" title="The City This Week" intro="Newest first — tap a story to read it at the source." />
          <span className="mb-6 inline-flex shrink-0 self-start rounded-full border border-accent/40 bg-accent-soft px-3 py-1 text-xs font-semibold text-accent-ink">
            Sample headlines for demonstration
          </span>
        </div>
        <FilterableCards
          param="city"
          label="Filter news by city"
          options={options}
          fallback="all"
          emptyText="No headlines for this city yet."
          items={sorted.map((n) => ({
            key: n.slug,
            tags: [n.city],
            card: {
              image: n.image,
              alt: n.alt,
              imageLabel: n.headline,
              imageSublabel: names[n.city],
              eyebrow: `${n.source} · ${formatDate(n.date)}`,
              title: n.headline,
              footer: n.url === "#" ? (
                <span className="text-sm font-semibold text-muted" title="Link will be added when the real story is published">
                  Read story ↗ <span className="text-xs font-normal">(link coming soon)</span>
                </span>
              ) : (
                <InlineLink href={n.url} external>
                  Read story
                </InlineLink>
              ),
            },
          }))}
        />
      </Section>
    </>
  );
}
