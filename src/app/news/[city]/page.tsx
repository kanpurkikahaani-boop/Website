import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHero } from "@/components/sections/PageHero";
import { Section } from "@/components/ui/Section";
import { NewsView } from "@/components/news/NewsView";
import { newsDescription, newsIntro, newsTitle } from "@/lib/news/copy";
import { NEWS_CITIES, type NewsCity } from "@/lib/news/taxonomy";
import { buildMetadata } from "@/lib/seo";

export const revalidate = 3600;
export const dynamicParams = false;

export function generateStaticParams() {
  return NEWS_CITIES.map((city) => ({ city }));
}

export async function generateMetadata({ params }: PageProps<"/news/[city]">): Promise<Metadata> {
  const { city } = await params;
  const c = city as NewsCity;
  return buildMetadata({ title: `${newsTitle(c)} Today | Kanpur Ki Kahaani`, description: newsDescription(c), path: `/news/${c}`, ogImage: "/og/news" });
}

export default async function CityNewsPage({ params }: PageProps<"/news/[city]">) {
  const { city } = await params;
  if (!(NEWS_CITIES as readonly string[]).includes(city)) notFound();
  const c = city as NewsCity;
  const title = newsTitle(c);
  return (
    <>
      <PageHero eyebrow="Live · News" title={title} subtitle={newsIntro(c)} crumbs={[{ name: "News", href: "/news" }, { name: title }]} />
      <Section>
        <NewsView filters={{ city: c, page: 1 }} path={`/news/${c}`} pageTitle={title} landing />
      </Section>
    </>
  );
}
