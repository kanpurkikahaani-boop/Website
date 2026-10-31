import type { Genre, NewsCity } from "@/lib/news/taxonomy";

/**
 * News sources — top national and Hindi newspapers only.
 *
 * Every feed is checked live each time it is fetched (daily cron, or the hourly fallback when
 * Supabase isn't set up): a feed only contributes headlines if it returns HTTP 200 with valid
 * RSS/Atom. Dead or moved feeds are skipped automatically and listed on /admin/news, so a
 * wrong URL here can never break the page. Directory links are likewise only shown after they
 * return HTTP 200 (see src/lib/news/directory.ts).
 */
export interface NewsSource {
  name: string;
  homepage: string;
  feedUrl: string;
  language: "en" | "hi";
  scope: "national" | "regional" | "aggregator";
  city?: NewsCity;
  genre?: Genre;
  active: boolean;
}

export type DirectoryGroup = "national-en" | "national-hi" | NewsCity;

export interface DirectoryLink {
  group: DirectoryGroup;
  name: string;
  url: string;
}

const CITY_HI: Record<NewsCity, { slug: string; hi: string; en: string }> = {
  kanpur: { slug: "kanpur", hi: "कानपुर", en: "Kanpur" },
  lucknow: { slug: "lucknow", hi: "लखनऊ", en: "Lucknow" },
  agra: { slug: "agra", hi: "आगरा", en: "Agra" },
  prayagraj: { slug: "prayagraj", hi: "प्रयागराज", en: "Prayagraj" },
  varanasi: { slug: "varanasi", hi: "वाराणसी", en: "Varanasi" },
  ayodhya: { slug: "ayodhya", hi: "अयोध्या", en: "Ayodhya" },
};
const cityList = Object.keys(CITY_HI) as NewsCity[];

const en = (s: Omit<NewsSource, "language" | "active">): NewsSource => ({ ...s, language: "en", active: true });
const hi = (s: Omit<NewsSource, "language" | "active">): NewsSource => ({ ...s, language: "hi", active: true });

export const newsSources: NewsSource[] = [
  // ── National · English ──────────────────────────────────────────
  en({ name: "The Times of India", homepage: "https://timesofindia.indiatimes.com", feedUrl: "https://timesofindia.indiatimes.com/rssfeeds/-2128936835.cms", scope: "national" }),
  en({ name: "The Hindu", homepage: "https://www.thehindu.com", feedUrl: "https://www.thehindu.com/news/national/feeder/default.rss", scope: "national" }),
  en({ name: "The Hindu", homepage: "https://www.thehindu.com", feedUrl: "https://www.thehindu.com/news/national/other-states/feeder/default.rss", scope: "national" }),
  en({ name: "Hindustan Times", homepage: "https://www.hindustantimes.com", feedUrl: "https://www.hindustantimes.com/feeds/rss/india-news/rssfeed.xml", scope: "national" }),
  en({ name: "The Indian Express", homepage: "https://indianexpress.com", feedUrl: "https://indianexpress.com/section/india/feed/", scope: "national" }),
  en({ name: "NDTV", homepage: "https://www.ndtv.com", feedUrl: "https://feeds.feedburner.com/ndtvnews-india-news", scope: "national" }),
  en({ name: "India Today", homepage: "https://www.indiatoday.in", feedUrl: "https://www.indiatoday.in/rss/1206514", scope: "national" }),
  // ── City desks · English ────────────────────────────────────────
  en({ name: "The Times of India", homepage: "https://timesofindia.indiatimes.com/city/kanpur", feedUrl: "https://timesofindia.indiatimes.com/rssfeeds/3947060.cms", scope: "regional", city: "kanpur" }),
  en({ name: "The Times of India", homepage: "https://timesofindia.indiatimes.com/city/lucknow", feedUrl: "https://timesofindia.indiatimes.com/rssfeeds/-2128819658.cms", scope: "regional", city: "lucknow" }),
  en({ name: "The Times of India", homepage: "https://timesofindia.indiatimes.com/city/agra", feedUrl: "https://timesofindia.indiatimes.com/rssfeeds/4118215.cms", scope: "regional", city: "agra" }),
  en({ name: "The Times of India", homepage: "https://timesofindia.indiatimes.com/city/allahabad", feedUrl: "https://timesofindia.indiatimes.com/rssfeeds/3947071.cms", scope: "regional", city: "prayagraj" }),
  en({ name: "The Times of India", homepage: "https://timesofindia.indiatimes.com/city/varanasi", feedUrl: "https://timesofindia.indiatimes.com/rssfeeds/3947051.cms", scope: "regional", city: "varanasi" }),
  en({ name: "Hindustan Times", homepage: "https://www.hindustantimes.com/cities/lucknow-news", feedUrl: "https://www.hindustantimes.com/feeds/rss/cities/lucknow-news/rssfeed.xml", scope: "regional", city: "lucknow" }),
  en({ name: "The Indian Express", homepage: "https://indianexpress.com/section/cities/lucknow/", feedUrl: "https://indianexpress.com/section/cities/lucknow/feed/", scope: "regional", city: "lucknow" }),
  // ── National · Hindi ────────────────────────────────────────────
  hi({ name: "Dainik Jagran", homepage: "https://www.jagran.com", feedUrl: "https://www.jagran.com/rss/news/national.xml", scope: "national" }),
  hi({ name: "Amar Ujala", homepage: "https://www.amarujala.com", feedUrl: "https://www.amarujala.com/rss/breaking-news.xml", scope: "national" }),
  hi({ name: "Hindustan", homepage: "https://www.livehindustan.com", feedUrl: "https://api.livehindustan.com/feeds/rss/national/rssfeed.xml", scope: "national" }),
  hi({ name: "Dainik Bhaskar", homepage: "https://www.bhaskar.com", feedUrl: "https://www.bhaskar.com/rss-v1--category-1061.xml", scope: "national" }),
  hi({ name: "Navbharat Times", homepage: "https://navbharattimes.indiatimes.com", feedUrl: "https://navbharattimes.indiatimes.com/rssfeedstopstories.cms", scope: "national" }),
  // ── City editions · Hindi ───────────────────────────────────────
  ...cityList.flatMap((c) => [
    hi({ name: "Amar Ujala", homepage: `https://www.amarujala.com/uttar-pradesh/${CITY_HI[c].slug}`, feedUrl: `https://www.amarujala.com/rss/uttar-pradesh/${CITY_HI[c].slug}.xml`, scope: "regional", city: c }),
    hi({ name: "Dainik Jagran", homepage: `https://www.jagran.com/uttar-pradesh/${CITY_HI[c].slug}-city-news-hindi.html`, feedUrl: `https://www.jagran.com/rss/uttar-pradesh/${CITY_HI[c].slug}-city.xml`, scope: "regional", city: c }),
    hi({ name: "Hindustan", homepage: `https://www.livehindustan.com/uttar-pradesh/${CITY_HI[c].slug}`, feedUrl: `https://api.livehindustan.com/feeds/rss/uttar-pradesh/${CITY_HI[c].slug}/rssfeed.xml`, scope: "regional", city: c }),
  ]),
];

export function activeSources() {
  return newsSources.filter((s) => s.active);
}

/** Candidate directory links. Only those that return HTTP 200 are rendered (checked hourly). */
export const directoryCandidates: DirectoryLink[] = [
  { group: "national-en", name: "The Times of India", url: "https://timesofindia.indiatimes.com" },
  { group: "national-en", name: "The Hindu", url: "https://www.thehindu.com" },
  { group: "national-en", name: "Hindustan Times", url: "https://www.hindustantimes.com" },
  { group: "national-en", name: "The Indian Express", url: "https://indianexpress.com" },
  { group: "national-en", name: "NDTV", url: "https://www.ndtv.com" },
  { group: "national-en", name: "India Today", url: "https://www.indiatoday.in" },
  { group: "national-hi", name: "Dainik Jagran", url: "https://www.jagran.com" },
  { group: "national-hi", name: "Amar Ujala", url: "https://www.amarujala.com" },
  { group: "national-hi", name: "Hindustan", url: "https://www.livehindustan.com" },
  { group: "national-hi", name: "Dainik Bhaskar", url: "https://www.bhaskar.com" },
  { group: "national-hi", name: "Navbharat Times", url: "https://navbharattimes.indiatimes.com" },
  // City desks: every city-specific source homepage above
  ...newsSources
    .filter((s) => s.city)
    .map((s) => ({
      group: s.city as DirectoryGroup,
      name: `${s.name} — ${s.language === "hi" ? CITY_HI[s.city!].hi : CITY_HI[s.city!].en}`,
      url: s.homepage,
    })),
];
