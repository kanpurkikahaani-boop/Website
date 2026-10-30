import type { Metadata } from "next";
import Link from "next/link";
import { Search } from "lucide-react";
import { PageHero } from "@/components/sections/PageHero";
import { Section } from "@/components/ui/Section";
import { ImageCard } from "@/components/ui/ImageCard";
import { ImageWithFallback } from "@/components/ui/ImageWithFallback";
import { TagChip } from "@/components/ui/TagChip";
import { CITY_OPTIONS, cityName } from "@/lib/city-names";
import { getAllTags, getPublishedPosts, POSTS_PER_PAGE } from "@/lib/posts";
import { buildMetadata } from "@/lib/seo";
import { cn, formatDate } from "@/lib/utils";

export async function generateMetadata({ searchParams }: PageProps<"/blogs">): Promise<Metadata> {
  const sp = await searchParams;
  const filtered = ["city", "tag", "q", "page"].some((k) => sp[k]);
  const meta = buildMetadata({
    title: "Kanpur Travel Blog – Stories, Food Trails & Day Trips | Kanpur Ki Kahaani",
    description:
      "Travel journals and deep-dives on Kanpur and nearby cities: street food trails, heritage walks, festivals and weekend trips to Lucknow, Agra, Varanasi and more.",
    path: "/blogs",
    ogImage: "/og/blogs",
  });
  // Filtered/paginated views point search engines at the main list.
  return filtered ? { ...meta, robots: { index: false, follow: true } } : meta;
}

const str = (v: string | string[] | undefined) => (typeof v === "string" ? v.trim() : "");

export default async function BlogsPage({ searchParams }: PageProps<"/blogs">) {
  const sp = await searchParams;
  const city = CITY_OPTIONS.some((c) => c.slug === str(sp.city)) ? str(sp.city) : "";
  const tag = str(sp.tag).slice(0, 40);
  const q = str(sp.q).slice(0, 80);
  const page = Math.max(1, Math.floor(Number(sp.page)) || 1);
  const [{ posts, total }, tags] = await Promise.all([getPublishedPosts({ city, tag, q, page }), getAllTags()]);
  const pages = Math.max(1, Math.ceil(total / POSTS_PER_PAGE));
  const isFiltered = Boolean(city || tag || q);
  const featured = !isFiltered && page === 1 ? posts[0] : undefined;
  const grid = featured ? posts.slice(1) : posts;

  const href = (patch: Record<string, string | undefined>) => {
    const next = new URLSearchParams();
    const merged = { city, tag, q, ...patch };
    for (const [k, v] of Object.entries(merged)) if (v) next.set(k, v);
    const s = next.toString();
    return s ? `/blogs?${s}` : "/blogs";
  };

  return (
    <>
      <PageHero
        eyebrow="Stories"
        title="From Our Blogs"
        subtitle="Travel journals and deep-dives from writers who love this city"
        crumbs={[{ name: "Blogs" }]}
      />
      <Section labelledBy="blog-list-title">
        <h2 id="blog-list-title" className="sr-only">All stories</h2>

        {featured && (
          <Link href={`/blogs/${featured.slug}`} className="group mb-12 grid overflow-hidden rounded-3xl border border-border bg-surface md:grid-cols-2">
            <div className="relative aspect-[16/10] overflow-hidden md:aspect-auto md:min-h-[340px]">
              <div className="absolute inset-0 transition-transform duration-500 group-hover:scale-[1.03]">
                <ImageWithFallback src={featured.coverUrl ?? "/images/kanpur/blog-cover.jpg"} alt={featured.coverAlt ?? featured.title} label={featured.title} fill priority sizes="(min-width: 768px) 560px, 100vw" className="object-cover" />
              </div>
            </div>
            <div className="flex flex-col justify-center p-7 md:p-10">
              <p className="eyebrow">Latest story{featured.city ? ` · ${cityName(featured.city)}` : ""}</p>
              <h3 className="mt-2 text-[28px] font-bold leading-tight text-ink group-hover:text-primary md:text-[34px]">{featured.title}</h3>
              <p className="mt-3">{featured.excerpt}</p>
              <p className="mt-4 text-sm">
                {formatDate(featured.publishedAt.slice(0, 10))} · {featured.readingMinutes} min read
              </p>
              <span className="mt-5 text-sm font-semibold text-primary">Read the story →</span>
            </div>
          </Link>
        )}

        <div className="mb-8 space-y-4 rounded-2xl border border-border bg-surface p-4 md:p-5">
          <form action="/blogs" role="search" className="flex gap-2">
            {city && <input type="hidden" name="city" value={city} />}
            {tag && <input type="hidden" name="tag" value={tag} />}
            <label htmlFor="blog-q" className="sr-only">Search stories</label>
            <div className="relative flex-1">
              <Search size={16} aria-hidden className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
              <input id="blog-q" name="q" defaultValue={q} placeholder="Search stories" className="h-11 w-full rounded-full border border-border bg-bg pl-10 pr-4 text-sm text-ink focus:border-primary focus:outline-none" />
            </div>
            <button className="rounded-full bg-primary px-5 text-sm font-semibold text-white hover:bg-primary-hover">Search</button>
          </form>
          <PillRow label="Filter by city">
            <Pill href={href({ city: undefined, page: undefined })} active={!city}>All</Pill>
            {CITY_OPTIONS.map((c) => (
              <Pill key={c.slug} href={href({ city: c.slug, page: undefined })} active={city === c.slug}>{c.name}</Pill>
            ))}
          </PillRow>
          {tags.length > 0 && (
            <PillRow label="Filter by tag">
              <Pill href={href({ tag: undefined, page: undefined })} active={!tag} small>All tags</Pill>
              {tags.map((t) => (
                <Pill key={t} href={href({ tag: t, page: undefined })} active={tag === t} small>#{t}</Pill>
              ))}
            </PillRow>
          )}
        </div>

        {grid.length === 0 && !featured ? (
          <p className="rounded-2xl border border-dashed border-border p-10 text-center">
            No stories match yet. <Link href="/blogs" className="font-semibold text-primary underline">See all stories</Link>
          </p>
        ) : (
          <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {grid.map((p) => (
              <li key={p.slug}>
                <ImageCard
                  image={p.coverUrl ?? "/images/kanpur/blog-cover.jpg"}
                  alt={p.coverAlt ?? p.title}
                  imageLabel={p.title}
                  eyebrow={[cityName(p.city), p.tags[0]].filter(Boolean).join(" · ") || "Story"}
                  title={p.title}
                  description={p.excerpt}
                  chips={[formatDate(p.publishedAt.slice(0, 10)), `${p.readingMinutes} min read`]}
                  href={`/blogs/${p.slug}`}
                />
              </li>
            ))}
          </ul>
        )}

        {pages > 1 && (
          <nav aria-label="Pagination" className="mt-10 flex flex-wrap justify-center gap-2">
            {Array.from({ length: pages }, (_, i) => i + 1).map((n) => (
              <Link key={n} href={href({ page: n > 1 ? String(n) : undefined })} aria-current={n === page ? "page" : undefined}
                className={cn("inline-flex h-10 min-w-10 items-center justify-center rounded-full px-3 text-sm font-semibold", n === page ? "bg-primary text-white" : "border border-border bg-surface text-ink hover:border-primary")}>
                {n}
              </Link>
            ))}
          </nav>
        )}
        <p className="mt-8 text-center text-sm">
          <a href="/blogs/rss.xml" className="font-semibold text-primary hover:underline">Subscribe via RSS</a>
          <span className="mx-2">·</span>
          <TagChip>{total} {total === 1 ? "story" : "stories"}</TagChip>
        </p>
      </Section>
    </>
  );
}

function PillRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <nav aria-label={label} className="flex flex-wrap gap-2">
      {children}
    </nav>
  );
}

function Pill({ href, active, small, children }: { href: string; active: boolean; small?: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      aria-current={active ? "true" : undefined}
      scroll={false}
      className={cn(
        "rounded-full border font-medium transition-colors",
        small ? "px-3 py-1 text-[13px]" : "px-4 py-2 text-sm",
        active ? "border-primary bg-primary text-white" : "border-border bg-surface text-ink hover:border-primary/50 hover:text-primary",
      )}
    >
      {children}
    </Link>
  );
}
