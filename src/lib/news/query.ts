import "server-only";
import { createPublicClient } from "@/lib/supabase/public";
import { GENRE_SLUGS, NEWS_CITIES } from "./taxonomy";

export const NEWS_PER_PAGE = 24;

export interface NewsItem {
  url: string;
  title: string;
  summary: string | null;
  sourceName: string;
  sourceHomepage: string | null;
  language: "en" | "hi";
  city: string;
  genre: string;
  publishedAt: string;
}

export interface NewsFilters {
  city?: string;
  genre?: string;
  lang?: string;
  q?: string;
  page?: number;
}

/** Only accept known values from the URL. */
export function cleanFilters(sp: Record<string, string | string[] | undefined>): Required<Omit<NewsFilters, "page">> & { page: number } {
  const s = (k: string) => (typeof sp[k] === "string" ? (sp[k] as string).trim() : "");
  return {
    city: (NEWS_CITIES as readonly string[]).includes(s("city")) ? s("city") : "",
    genre: (GENRE_SLUGS as string[]).includes(s("genre")) ? s("genre") : "",
    lang: ["en", "hi"].includes(s("lang")) ? s("lang") : "",
    q: s("q").slice(0, 80),
    page: Math.max(1, Math.min(50, Math.floor(Number(s("page"))) || 1)),
  };
}

export async function getNews({ city, genre, lang, q, page = 1 }: NewsFilters) {
  const db = createPublicClient();
  if (!db) return { items: [] as NewsItem[], total: 0, failed: true };
  let query = db
    .from("news_items")
    .select("url, title, summary, source_name, source_homepage, language, city, genre, published_at", { count: "exact" })
    .order("published_at", { ascending: false })
    .range(0, page * NEWS_PER_PAGE - 1); // "Load more" shows everything up to this page
  if (city) query = query.eq("city", city);
  if (genre) query = query.eq("genre", genre);
  if (lang) query = query.eq("language", lang);
  if (q) {
    const safe = q.replace(/[%_,()]/g, " ").trim();
    if (safe) query = query.or(`title.ilike.%${safe}%,summary.ilike.%${safe}%`);
  }
  const { data, count, error } = await query;
  if (error) {
    console.error("[news] query failed:", error.message);
    return { items: [], total: 0, failed: true };
  }
  return {
    items: (data ?? []).map((r) => ({
      url: r.url,
      title: r.title,
      summary: r.summary,
      sourceName: r.source_name,
      sourceHomepage: r.source_homepage,
      language: r.language,
      city: r.city,
      genre: r.genre,
      publishedAt: r.published_at,
    })) as NewsItem[],
    total: count ?? 0,
    failed: false,
  };
}

/** Finish time of the latest successful refresh (for "Last updated"). */
export async function getLastUpdated(): Promise<string | null> {
  const db = createPublicClient();
  if (!db) return null;
  const { data } = await db.from("news_runs").select("finished_at").eq("ok", true).order("finished_at", { ascending: false }).limit(1).maybeSingle();
  return data?.finished_at ?? null;
}

export function formatIST(iso: string) {
  return new Date(iso).toLocaleString("en-IN", { timeZone: "Asia/Kolkata", day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit", hour12: true }) + " IST";
}
