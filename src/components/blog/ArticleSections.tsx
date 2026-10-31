import Link from "next/link";
import { ArrowLeft, ArrowRight, MapPin, Sparkles } from "lucide-react";
import { SocialLinks } from "@/components/layout/SocialLinks";
import { isExternalHref } from "@/lib/content/enrich";
import { CITY_OPTIONS, cityName } from "@/lib/city-names";
import type { Author, GlossaryItem, KeyFact, PlanItem, PostSummary, ReadingItem } from "@/lib/posts";
import { cn } from "@/lib/utils";

/** A link that follows the site rules: internal = same tab; external = new tab + noopener noreferrer + ↗ + sr text. */
export function ArticleLink({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) {
  if (isExternalHref(href)) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={cn("ext", className)}>
        {children}
        <span className="sr-only"> (opens in new tab)</span>
      </a>
    );
  }
  return (
    <Link href={href} className={className}>
      {children}
    </Link>
  );
}

const card = "rounded-2xl border border-border bg-surface p-5 md:p-6";
const h = "font-display text-xl font-bold text-primary";

/** Site-written summary box (clearly outside the author's prose). */
export function KeyFactsBox({ title, facts }: { title: string; facts: KeyFact[] }) {
  if (!facts.length) return null;
  return (
    <aside aria-label={title} className="not-prose my-8 rounded-2xl border border-accent/40 bg-accent-soft/60 p-5 md:p-6">
      <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-accent-ink">
        <Sparkles size={14} aria-hidden /> {title}
      </p>
      <dl className="mt-3 grid gap-x-6 gap-y-2 sm:grid-cols-[auto_1fr]">
        {facts.map((f) => (
          <div key={f.label} className="contents">
            <dt className="font-semibold text-ink">{f.label}</dt>
            <dd className="text-ink/80">{f.value}</dd>
          </div>
        ))}
      </dl>
    </aside>
  );
}

export function PlanVisitCard({ title, items }: { title: string; items: PlanItem[] }) {
  if (!items.length) return null;
  const groups = [...new Set(items.map((i) => i.group))];
  return (
    <aside aria-label={title} data-link-group="C" className={cn(card, "article-links")}>
      <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-accent-ink">
        <MapPin size={14} aria-hidden /> Plan your visit
      </p>
      <h2 className="mt-1 font-display text-lg font-bold text-ink">{title}</h2>
      {groups.map((g) => (
        <div key={g} className="mt-4">
          <h3 className="text-xs font-bold uppercase tracking-[0.14em] text-muted">{g}</h3>
          <ul className="mt-1.5 space-y-1.5 text-[14px]">
            {items
              .filter((i) => i.group === g)
              .map((i) => (
                <li key={i.url}>
                  <ArticleLink href={i.url}>{i.label}</ArticleLink>
                </li>
              ))}
          </ul>
        </div>
      ))}
    </aside>
  );
}

export function GlossarySection({ items }: { items: GlossaryItem[] }) {
  if (!items.length) return null;
  return (
    <section aria-labelledby="glossary-title" data-link-group="D" className={cn(card, "article-links mt-10")}>
      <h2 id="glossary-title" className={h}>Words in this story</h2>
      <p className="mt-1 text-sm text-muted">Short definitions from the Kanpur Ki Kahaani team.</p>
      <dl className="mt-4 grid gap-4 sm:grid-cols-2">
        {items.map((g) => (
          <div key={g.term}>
            <dt className="font-display font-semibold text-ink">{g.term}</dt>
            <dd className="mt-0.5 text-sm text-ink/80">
              {g.definition}{" "}
              <ArticleLink href={g.url} className="whitespace-nowrap font-semibold">
                Learn more{g.source ? ` on ${g.source}` : ""}
              </ArticleLink>
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

export function FurtherReading({ items }: { items: ReadingItem[] }) {
  if (!items.length) return null;
  return (
    <section aria-labelledby="further-title" data-link-group="E" className="article-links mt-10">
      <h2 id="further-title" className={h}>Further reading &amp; sources</h2>
      <ol className="mt-4 list-decimal space-y-2 pl-6 text-[15px] marker:font-semibold marker:text-accent-ink">
        {items.map((r) => (
          <li key={r.url}>
            <ArticleLink href={r.url}>{r.title}</ArticleLink>
            {r.publisher && <span className="text-muted"> — {r.publisher}</span>}
          </li>
        ))}
      </ol>
    </section>
  );
}

/** Internal "more to explore" links tailored to the post's city. */
export function MoreToExplore({ city }: { city: string | null }) {
  const base = [
    { href: "/tourism", label: "Places to visit in Kanpur" },
    { href: "/outdoor-sports", label: "Kanpur outdoors & sports" },
    { href: "/nearby", label: "Weekend trips from Kanpur" },
    { href: `/news/${city ?? "kanpur"}/lifestyle-culture`, label: `${cityName(city) || "Kanpur"} culture news` },
    { href: "/blogs", label: "All our stories" },
  ];
  const cities = CITY_OPTIONS.filter((c) => c.slug !== "kanpur" && c.slug !== city).map((c) => ({
    href: `/cities/${c.slug}`,
    label: `${c.name} travel guide`,
  }));
  return (
    <section aria-labelledby="explore-title" data-link-group="F" className="mt-10">
      <h2 id="explore-title" className={h}>More Kahaani to explore</h2>
      <ul className="mt-4 grid gap-3 sm:grid-cols-2">
        {[...base, ...cities].map((l) => (
          <li key={l.href}>
            <Link href={l.href} className="group flex items-center justify-between rounded-xl border border-border bg-surface px-4 py-3 text-sm font-semibold text-ink transition hover:border-primary hover:text-primary">
              {l.label}
              <ArrowRight size={15} aria-hidden className="transition-transform group-hover:translate-x-0.5" />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

export const tagLabel = (t: string) => t.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");

export function TagChips({ tags }: { tags: string[] }) {
  if (!tags.length) return null;
  return (
    <nav aria-label="Tags" data-link-group="G" className="mt-10 flex flex-wrap gap-2">
      {tags.map((t) => (
        <Link key={t} href={`/blogs?tag=${encodeURIComponent(t)}`} className="rounded-full border border-border bg-bg-alt px-3 py-1 text-[13px] font-medium text-ink hover:border-primary hover:text-primary">
          #{tagLabel(t)}
        </Link>
      ))}
    </nav>
  );
}

export function AuthorAvatar({ author, name, size = 48 }: { author: Author | null; name: string; size?: number }) {
  const initials = name.split(/\s+/).map((w) => w[0]).join("").slice(0, 2).toUpperCase();
  if (author?.avatarUrl) {
    // eslint-disable-next-line @next/next/no-img-element -- small avatar from our own storage
    return <img src={author.avatarUrl} alt="" width={size} height={size} className="shrink-0 rounded-full object-cover" style={{ width: size, height: size }} />;
  }
  return (
    <span aria-hidden className="inline-flex shrink-0 items-center justify-center rounded-full bg-coral font-display font-bold text-dark" style={{ width: size, height: size, fontSize: size * 0.36 }}>
      {initials}
    </span>
  );
}

export function AuthorBox({ author, name }: { author: Author | null; name: string }) {
  return (
    <section aria-labelledby="author-title" data-link-group="H" className={cn(card, "mt-10 flex flex-col gap-5 sm:flex-row")}>
      <AuthorAvatar author={author} name={name} size={72} />
      <div className="min-w-0 flex-1">
        <p className="eyebrow text-[10.5px]">About the writer</p>
        <h2 id="author-title" className="mt-1 font-display text-xl font-bold text-ink">
          {author ? <Link href={`/blogs/author/${author.slug}`} className="hover:text-primary">{name}</Link> : name}
        </h2>
        {author?.bio && <p className="mt-1.5 text-[15px]">{author.bio}</p>}
        {author && (
          <Link href={`/blogs?author=${author.slug}`} className="mt-2 inline-block text-sm font-semibold text-primary hover:underline">
            More stories by {name.split(" ")[0]} →
          </Link>
        )}
        <div className="mt-4 rounded-xl bg-dark p-3">
          <p className="mb-1 px-1 text-[10.5px] font-bold uppercase tracking-[0.18em] text-accent">Follow Kanpur Ki Kahaani</p>
          <SocialLinks variant="bar" />
        </div>
      </div>
    </section>
  );
}

export function PrevNext({ newer, older }: { newer: PostSummary | null; older: PostSummary | null }) {
  if (!newer && !older) return null;
  return (
    <nav aria-label="More stories" className="mt-10 grid gap-4 sm:grid-cols-2">
      {older ? (
        <Link href={`/blogs/${older.slug}`} className={cn(card, "group block hover:border-primary")}>
          <span className="flex items-center gap-1 text-xs font-bold uppercase tracking-[0.14em] text-accent-ink"><ArrowLeft size={14} aria-hidden /> Previous story</span>
          <span className="mt-1 block font-display font-semibold text-ink group-hover:text-primary">{older.title}</span>
        </Link>
      ) : <span />}
      {newer && (
        <Link href={`/blogs/${newer.slug}`} className={cn(card, "group block text-right hover:border-primary")}>
          <span className="flex items-center justify-end gap-1 text-xs font-bold uppercase tracking-[0.14em] text-accent-ink">Next story <ArrowRight size={14} aria-hidden /></span>
          <span className="mt-1 block font-display font-semibold text-ink group-hover:text-primary">{newer.title}</span>
        </Link>
      )}
    </nav>
  );
}
