import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHero } from "@/components/sections/PageHero";
import { Section } from "@/components/ui/Section";
import { NewsView } from "@/components/news/NewsView";
import { newsDescription, newsIntro, newsTitle } from "@/lib/news/copy";
import { GENRE_SLUGS, NEWS_CITIES, type Genre, type NewsCity } from "@/lib/news/taxonomy";
import { buildMetadata } from "@/lib/seo";

export const revalidate = 3600;
export const dynamicParams = false;

export function generateStaticParams() {
  return NEWS_CITIES.flatMap((city) => GENRE_SLUGS.map((genre) => ({ city, genre })));
}

export async function generateMetadata({ params }: PageProps<"/news/[city]/[genre]">): Promise<Metadata> {
  const { city, genre } = await params;
  return buildMetadata({
    title: `${newsTitle(city as NewsCity, genre as Genre)} | Kanpur Ki Kahaani`,
    description: newsDescription(city as NewsCity, genre as Genre),
    path: `/news/${city}/${genre}`,
    ogImage: "/og/news",
  });
}

export default async function CityGenreNewsPage({ params }: PageProps<"/news/[city]/[genre]">) {
  const { city, genre } = await params;
  if (!(NEWS_CITIES as readonly string[]).includes(city) || !(GENRE_SLUGS as string[]).includes(genre)) notFound();
  const c = city as NewsCity;
  const g = genre as Genre;
  const title = newsTitle(c, g);
  return (
    <>
      <PageHero
        eyebrow="Live · News"
        title={title}
        subtitle={newsIntro(c, g)}
        crumbs={[{ name: "News", href: "/news" }, { name: newsTitle(c), href: `/news/${c}` }, { name: title }]}
      />
      <Section>
        <NewsView filters={{ city: c, genre: g, page: 1 }} path={`/news/${c}/${g}`} pageTitle={title} landing />
      </Section>
    </>
  );
}
