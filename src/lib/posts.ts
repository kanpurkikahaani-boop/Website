import "server-only";
import { posts as legacyPosts } from "@/data/blog";
import { renderPostContent } from "@/lib/content/render";
import { textToTiptap } from "@/lib/content/from-text";
import { createPublicClient } from "@/lib/supabase/public";

export type CitySlug = "kanpur" | "lucknow" | "agra" | "prayagraj" | "varanasi" | "ayodhya";

export interface PostSummary {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  coverUrl: string | null;
  coverAlt: string | null;
  city: CitySlug | null;
  tags: string[];
  publishedAt: string;
  readingMinutes: number;
}

export interface Post extends PostSummary {
  html: string;
  seoTitle: string | null;
  seoDescription: string | null;
  author: string;
  updatedAt: string;
}

const SUMMARY_COLS = "id, slug, title, excerpt, cover_url, cover_alt, city, tags, published_at, reading_minutes";
const FULL_COLS = `${SUMMARY_COLS}, content_html, seo_title, seo_description, author, updated_at`;

type Row = Record<string, unknown>;

function toSummary(r: Row): PostSummary {
  return {
    id: String(r.id),
    slug: String(r.slug),
    title: String(r.title),
    excerpt: String(r.excerpt ?? ""),
    coverUrl: (r.cover_url as string) ?? null,
    coverAlt: (r.cover_alt as string) ?? null,
    city: (r.city as CitySlug) ?? null,
    tags: (r.tags as string[]) ?? [],
    publishedAt: String(r.published_at),
    readingMinutes: Number(r.reading_minutes ?? 1),
  };
}

function toPost(r: Row): Post {
  return {
    ...toSummary(r),
    html: String(r.content_html ?? ""),
    seoTitle: (r.seo_title as string) ?? null,
    seoDescription: (r.seo_description as string) ?? null,
    author: String(r.author ?? "Kanpur Ki Kahaani"),
    updatedAt: String(r.updated_at ?? r.published_at),
  };
}

/** Built-in fallback (the three original stories) when Supabase isn't configured. */
const legacyTags: Record<string, string[]> = {
  "48-hours-in-kanpur": ["itineraries", "first-timers", "heritage"],
  "eating-through-arya-nagar": ["food", "street-food"],
  "mills-that-built-a-city": ["history", "industry"],
};
function legacy(): Post[] {
  return legacyPosts.map((p) => {
    const { html, minutes } = renderPostContent(textToTiptap(p.body));
    const publishedAt = `${p.date}T06:00:00+05:30`;
    return {
      id: p.slug,
      slug: p.slug,
      title: p.title,
      excerpt: p.excerpt,
      coverUrl: p.image,
      coverAlt: p.alt,
      city: "kanpur",
      tags: legacyTags[p.slug] ?? [],
      publishedAt,
      readingMinutes: minutes,
      html,
      seoTitle: p.title,
      seoDescription: p.description,
      author: "Kanpur Ki Kahaani",
      updatedAt: publishedAt,
    };
  });
}

export const POSTS_PER_PAGE = 9;

export interface PostQuery {
  city?: string;
  tag?: string;
  q?: string;
  page?: number;
}

/** Published posts, newest first, with optional filters. RLS hides drafts and future posts. */
export async function getPublishedPosts({ city, tag, q, page = 1 }: PostQuery = {}) {
  const db = createPublicClient();
  const from = (page - 1) * POSTS_PER_PAGE;
  if (!db) {
    let list: PostSummary[] = legacy();
    if (city) list = list.filter((p) => p.city === city);
    if (tag) list = list.filter((p) => p.tags.includes(tag));
    if (q) list = list.filter((p) => `${p.title} ${p.excerpt}`.toLowerCase().includes(q.toLowerCase()));
    return { posts: list.slice(from, from + POSTS_PER_PAGE), total: list.length };
  }
  let query = db
    .from("posts")
    .select(SUMMARY_COLS, { count: "exact" })
    .order("published_at", { ascending: false })
    .range(from, from + POSTS_PER_PAGE - 1);
  if (city) query = query.eq("city", city);
  if (tag) query = query.contains("tags", [tag]);
  if (q) {
    const safe = q.replace(/[%_,()]/g, " ").trim();
    if (safe) query = query.or(`title.ilike.%${safe}%,excerpt.ilike.%${safe}%`);
  }
  const { data, count, error } = await query;
  if (error) {
    console.error("[posts] list failed:", error.message);
    return { posts: [], total: 0 };
  }
  return { posts: (data ?? []).map(toSummary), total: count ?? 0 };
}

export async function getLatestPosts(n = 3) {
  const { posts } = await getPublishedPosts();
  return posts.slice(0, n);
}

export async function getPostBySlug(slug: string): Promise<Post | null> {
  const db = createPublicClient();
  if (!db) return legacy().find((p) => p.slug === slug) ?? null;
  const { data, error } = await db.from("posts").select(FULL_COLS).eq("slug", slug).maybeSingle();
  if (error) console.error("[posts] get failed:", error.message);
  return data ? toPost(data) : null;
}

/** All published slugs + dates, for the sitemap, RSS and static generation. */
export async function getAllPublished(): Promise<Post[]> {
  const db = createPublicClient();
  if (!db) return legacy();
  const { data, error } = await db.from("posts").select(FULL_COLS).order("published_at", { ascending: false }).limit(500);
  if (error) {
    console.error("[posts] all failed:", error.message);
    return [];
  }
  return (data ?? []).map(toPost);
}

/** Same city or shared tag first, then newest. */
export async function getRelatedPosts(post: PostSummary, n = 3) {
  const all = (await getAllPublished()).filter((p) => p.slug !== post.slug);
  const score = (p: PostSummary) => (p.city && p.city === post.city ? 2 : 0) + p.tags.filter((t) => post.tags.includes(t)).length;
  return all.sort((a, b) => score(b) - score(a) || b.publishedAt.localeCompare(a.publishedAt)).slice(0, n);
}

/** Distinct tags across published posts (for filter pills). */
export async function getAllTags() {
  const all = await getAllPublished();
  return [...new Set(all.flatMap((p) => p.tags))].sort();
}
