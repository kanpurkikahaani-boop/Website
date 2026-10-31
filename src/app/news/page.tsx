import type { Metadata } from "next";
import { PageHero } from "@/components/sections/PageHero";
import { Section } from "@/components/ui/Section";
import { NewsView } from "@/components/news/NewsView";
import { cleanFilters } from "@/lib/news/query";
import { buildMetadata } from "@/lib/seo";

export async function generateMetadata({ searchParams }: PageProps<"/news">): Promise<Metadata> {
  const f = cleanFilters(await searchParams);
  const meta = buildMetadata({
    title: "Kanpur News Today – Lucknow, Agra, Varanasi & UP Headlines | Kanpur Ki Kahaani",
    description:
      "Today's Kanpur news plus Lucknow, Agra, Prayagraj, Varanasi and Ayodhya headlines from English and Hindi newspapers, refreshed every morning with source links.",
    path: "/news",
    ogImage: "/og/news",
  });
  // Filter combinations are crawlable via /news/[city]/[genre]; query-string variants stay out of the index.
  const filtered = f.city || f.genre || f.lang || f.page > 1;
  return filtered ? { ...meta, robots: { index: false, follow: true } } : meta;
}

export default async function NewsPage({ searchParams }: PageProps<"/news">) {
  const filters = cleanFilters(await searchParams);
  return (
    <>
      <PageHero
        eyebrow="Live"
        title="Kanpur News"
        subtitle="Headlines and happenings from across the city and its neighbours, gathered every morning from the newspapers we trust."
        crumbs={[{ name: "Live", href: "/events" }, { name: "News" }]}
      />
      <Section>
        <NewsView filters={filters} path="/news" pageTitle="Kanpur News" />
      </Section>
    </>
  );
}
