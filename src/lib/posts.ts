import "server-only";
import { createPublicClient } from "@/lib/supabase/public";

export type CitySlug = "kanpur" | "lucknow" | "agra" | "prayagraj" | "varanasi" | "ayodhya";

export interface Author {
  id: string;
  slug: string;
  name: string;
  bio: string;
  avatarUrl: string | null;
  website: string | null;
  instagram: string | null;
  /** Byline title, e.g. "Reddit & Medium Lead, Kanpur Ki Kahaani" (column added in 0009). */
  title: string | null;
}

export interface KeyFact {
  label: string;
  value: string;
}
export interface ReadingItem {
  title: string;
  url: string;
  publisher: string;
}
export interface GlossaryItem {
  term: string;
  definition: string;
  url: string;
  source: string;
}
export interface PlanItem {
  group: string;
  label: string;
  url: string;
}

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
  category: string | null;
  authorName: string;
  authorSlug: string | null;
}

export interface Post extends PostSummary {
  html: string;
  seoTitle: string | null;
  seoDescription: string | null;
  /** Byline: the linked author when set, else the legacy text column. */
  author: string;
  authorInfo: Author | null;
  updatedAt: string;
  standfirst: string | null;
  titleEmphasis: string | null;
  pullQuote: string | null;
  coverCaption: string | null;
  coverCredit: string | null;
  coverFocal: string | null;
  keyFacts: KeyFact[];
  furtherReading: ReadingItem[];
  glossary: GlossaryItem[];
  planVisit: PlanItem[];
}

// `authors(*)`: works both before and after migration 0009 adds `title`.
const AUTHOR_COLS = "authors(*)";
const SUMMARY_COLS = `id, slug, title, excerpt, cover_url, cover_alt, city, tags, published_at, reading_minutes, category, author, ${AUTHOR_COLS}`;
export const FULL_COLS = `${SUMMARY_COLS}, content_html, seo_title, seo_description, updated_at, standfirst, title_emphasis, pull_quote, cover_caption, cover_credit, key_facts, further_reading, glossary, plan_visit`;

function toAuthor(a: unknown): Author | null {
  const r = (Array.isArray(a) ? a[0] : a) as Row | null | undefined;
  if (!r) return null;
  return {
    id: String(r.id),
    slug: String(r.slug),
    name: String(r.name),
    bio: String(r.bio ?? ""),
    avatarUrl: (r.avatar_url as string) ?? null,
    website: (r.website as string) ?? null,
    instagram: (r.instagram as string) ?? null,
    title: (r.title as string) ?? null,
  };
}

const arr = <T,>(v: unknown): T[] => (Array.isArray(v) ? (v as T[]) : []);

export type Row = Record<string, unknown>;

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
    category: (r.category as string) ?? null,
    authorName: toAuthor(r.authors)?.name ?? String(r.author ?? "Kanpur Ki Kahaani"),
    authorSlug: toAuthor(r.authors)?.slug ?? null,
  };
}

export function toPost(r: Row): Post {
  return {
    ...toSummary(r),
    html: String(r.content_html ?? ""),
    seoTitle: (r.seo_title as string) ?? null,
    seoDescription: (r.seo_description as string) ?? null,
    author: toAuthor(r.authors)?.name ?? String(r.author ?? "Kanpur Ki Kahaani"),
    authorInfo: toAuthor(r.authors),
    updatedAt: String(r.updated_at ?? r.published_at),
    standfirst: (r.standfirst as string) ?? null,
    titleEmphasis: (r.title_emphasis as string) ?? null,
    pullQuote: (r.pull_quote as string) ?? null,
    coverCaption: (r.cover_caption as string) ?? null,
    coverCredit: (r.cover_credit as string) ?? null,
    coverFocal: (r.cover_focal as string) ?? null,
    keyFacts: arr<KeyFact>(r.key_facts),
    furtherReading: arr<ReadingItem>(r.further_reading),
    glossary: arr<GlossaryItem>(r.glossary),
    planVisit: arr<PlanItem>(r.plan_visit),
  };
}

export const POSTS_PER_PAGE = 9;

export interface PostQuery {
  city?: string;
  tag?: string;
  category?: string;
  author?: string;
  q?: string;
  page?: number;
}

/** Published posts, newest first, with optional filters. RLS hides drafts and future posts. */
export async function getPublishedPosts({ city, tag, category, author, q, page = 1 }: PostQuery = {}) {
  const db = createPublicClient();
  const from = (page - 1) * POSTS_PER_PAGE;
  // Posts only ever come from the admin-written `posts` table.
  if (!db) return { posts: [] as PostSummary[], total: 0 };
  let query = db
    .from("posts")
    .select(SUMMARY_COLS, { count: "exact" })
    .order("published_at", { ascending: false })
    .range(from, from + POSTS_PER_PAGE - 1);
  if (city) query = query.eq("city", city);
  if (tag) query = query.contains("tags", [tag]);
  if (category) query = query.eq("category", category);
  if (author) {
    const a = await getAuthor(author);
    if (!a) return { posts: [], total: 0 };
    query = query.eq("author_id", a.id);
  }
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
  if (!db) return null;
  let { data, error } = await db.from("posts").select(`${FULL_COLS}, cover_focal`).eq("slug", slug).maybeSingle();
  // Before migration 0008 runs, cover_focal doesn't exist yet: read the post without it.
  if (error?.code === "42703") ({ data, error } = await db.from("posts").select(FULL_COLS).eq("slug", slug).maybeSingle());
  if (error) console.error("[posts] get failed:", error.message);
  return data ? toPost(data as unknown as Row) : null;
}

/** An old slug that now redirects (301) to a post's current slug, if any. */
export async function getRedirectSlug(oldSlug: string): Promise<string | null> {
  const db = createPublicClient();
  if (!db) return null;
  const { data } = await db.from("post_redirects").select("posts(slug)").eq("old_slug", oldSlug).maybeSingle();
  const target = (Array.isArray(data?.posts) ? data.posts[0] : data?.posts) as { slug?: string } | null | undefined;
  return target?.slug && target.slug !== oldSlug ? target.slug : null;
}

/** All published slugs + dates, for the sitemap, RSS and static generation. */
export async function getAllPublished(): Promise<Post[]> {
  const db = createPublicClient();
  if (!db) return [];
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

export async function getAuthor(slug: string): Promise<Author | null> {
  const db = createPublicClient();
  if (!db) return null;
  const { data } = await db.from("authors").select("*").eq("slug", slug).maybeSingle();
  return toAuthor(data);
}

export async function getAllAuthors(): Promise<Author[]> {
  const db = createPublicClient();
  if (!db) return [];
  const { data } = await db.from("authors").select("*").order("name");
  return (data ?? []).map((a) => toAuthor(a)!).filter(Boolean);
}

/** Previous (older) and next (newer) published posts around this one. */
export async function getAdjacentPosts(post: PostSummary) {
  const all = await getAllPublished();
  const i = all.findIndex((p) => p.slug === post.slug);
  return { newer: i > 0 ? all[i - 1] : null, older: i >= 0 && i < all.length - 1 ? all[i + 1] : null };
}
