import Link from "next/link";
import { Clock } from "lucide-react";
import { Breadcrumbs } from "@/components/sections/Breadcrumbs";
import { InlineSignup } from "@/components/sections/InlineSignup";
import { ShareButtons } from "@/components/sections/ShareButtons";
import { ImageCard } from "@/components/ui/ImageCard";
import { ImageWithFallback } from "@/components/ui/ImageWithFallback";
import { indexedPhoto } from "@/lib/photo-index";
import { PhotoCreditLine } from "@/components/ui/PhotoCredit";
import { JsonLd } from "@/components/seo/JsonLd";
import { ReadingProgress } from "@/components/blog/ReadingProgress";
import { ArticleToc, MobileToc } from "@/components/blog/ArticleToc";
import {
  AuthorAvatar,
  AuthorBox,
  FurtherReading,
  GlossarySection,
  KeyFactsBox,
  MoreToExplore,
  PlanVisitCard,
  PrevNext,
  TagChips,
  tagLabel,
} from "@/components/blog/ArticleSections";
import { absoluteUrl, site } from "@/data/site";
import { categoryName } from "@/lib/blog-categories";
import { hasLogo } from "@/lib/assets";
import { cityName } from "@/lib/city-names";
import { extractToc } from "@/lib/content/enrich";
import { htmlToText } from "@/lib/content/sanitize";
import type { Post, PostSummary } from "@/lib/posts";
import { formatDate } from "@/lib/utils";


/** Title with an optional emphasised phrase in gold italics (keeps the author's emphasis). */
function Title({ title, emphasis }: { title: string; emphasis: string | null }) {
  const i = emphasis ? title.indexOf(emphasis) : -1;
  if (!emphasis || i < 0) return <>{title}</>;
  return (
    <>
      {title.slice(0, i)}
      <em className="font-display italic text-[#b07a1f]">{emphasis}</em>
      {title.slice(i + emphasis.length)}
    </>
  );
}

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * The public article template. Used by /blogs/[slug] and by the admin preview, so a preview looks
 * exactly like the live page. `preview` adds a banner and leaves out structured data.
 */
export function ArticleView({
  post,
  related,
  adjacent,
  preview = false,
}: {
  post: Post;
  related: PostSummary[];
  adjacent: { newer: PostSummary | null; older: PostSummary | null };
  preview?: false | "draft" | "scheduled" | "published";
}) {
  const url = absoluteUrl(`/blogs/${post.slug}`);
  const place = cityName(post.city);
  const category = categoryName(post.category);
  const updated = new Date(post.updatedAt).getTime() - new Date(post.publishedAt).getTime() > DAY_MS;
  const shortTitle = post.title.length > 48 ? (post.seoTitle?.split(":")[0] ?? post.title.slice(0, 45) + "…") : post.title;

  // Split the author's text at the first H2 so site boxes can sit after the intro, outside the prose.
  const firstH2 = post.html.search(/<h2[\s>]/);
  const intro = firstH2 > 0 ? post.html.slice(0, firstH2) : post.html;
  const rest = firstH2 > 0 ? post.html.slice(firstH2) : "";
  const toc = [{ id: "introduction", text: "Introduction", badge: null }, ...extractToc(post.html)];
  const wordCount = htmlToText(post.html.replace(/<span class="sr-only">[^<]*<\/span>/g, "")).split(/\s+/).length;
  const cover = post.coverUrl ?? "/images/kanpur/blog-cover.jpg";
  // Topic for box titles, e.g. "Navaratri in Kanpur" from "Navaratri in Kanpur: 9-Day Guide …".
  const topic = post.seoTitle?.split(/[:|–]/)[0].trim() || shortTitle;
  const festival = post.category === "celebrations" && post.tags[0] ? `${tagLabel(post.tags[0])} ` : "";
  const planTitle = `Plan your ${festival}visit`;

  return (
    <>
      {preview && (
        <p role="status" className="sticky top-0 z-[95] bg-dark px-4 py-2 text-center text-sm font-semibold text-accent">
          Preview — {preview === "published" ? "this is how the live post looks with your latest saved changes" : preview === "scheduled" ? "scheduled, not visible to readers yet" : "draft, not visible to readers"}
        </p>
      )}
      <ReadingProgress targetId="article-body" />
      <Breadcrumbs crumbs={[{ name: "Home", href: "/" }, { name: "Blogs", href: "/blogs" }, { name: shortTitle }]} />

      <article className="pb-16">
        <header className="container-site max-w-[800px] pt-10 text-center md:pt-14">
          <p className="eyebrow">
            {category ? <Link href={`/blogs?category=${post.category}`} className="hover:text-primary">{category}</Link> : "Stories"}
            {place && (
              <>
                {" · "}
                <Link href={`/blogs?city=${post.city}`} className="hover:text-primary">{place}</Link>
              </>
            )}
          </p>
          <h1 className="mt-3 text-[32px] font-bold leading-[1.12] tracking-tight text-ink md:text-[50px]">
            <Title title={post.title} emphasis={post.titleEmphasis} />
          </h1>
          {(post.standfirst || post.excerpt) && (
            <p className="mx-auto mt-4 max-w-[680px] text-[18px] leading-relaxed text-muted md:text-[20px]">{post.standfirst || post.excerpt}</p>
          )}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-4 gap-y-3 text-sm">
            <span className="flex items-center gap-2.5">
              <AuthorAvatar author={post.authorInfo} name={post.author} size={40} />
              <span>
                By{" "}
                {post.authorInfo ? (
                  <Link href={`/blogs/author/${post.authorInfo.slug}`} className="font-semibold text-ink hover:text-primary">{post.author}</Link>
                ) : (
                  <strong className="text-ink">{post.author}</strong>
                )}
                {post.authorInfo?.title && <span className="text-muted"> · {post.authorInfo.title}</span>}
              </span>
            </span>
            <span>
              Published <time dateTime={post.publishedAt} className="font-semibold text-ink">{formatDate(post.publishedAt.slice(0, 10), { long: true }).replace(/^\w+, /, "")}</time>
            </span>
            {updated && (
              <span>
                Updated <time dateTime={post.updatedAt}>{formatDate(post.updatedAt.slice(0, 10))}</time>
              </span>
            )}
            <span className="inline-flex items-center gap-1.5">
              <Clock size={14} aria-hidden className="text-accent" /> {post.readingMinutes} min read
            </span>
          </div>
          <ShareButtons className="mt-5 flex-wrap justify-center" url={url} title={post.title} context={`blog_${post.slug}`} />
        </header>

        <figure className="container-site mt-8 max-w-[1080px]">
          <div className="relative aspect-[16/9] overflow-hidden rounded-2xl">
            <ImageWithFallback src={cover} alt={post.coverAlt ?? post.title} label={post.title} sublabel={place} fill priority sizes="(min-width: 1080px) 1040px, 100vw" className="object-cover" style={post.coverFocal ? { objectPosition: post.coverFocal } : undefined} />
          </div>
          {(post.coverCaption || post.coverCredit || indexedPhoto(cover)) && (
            <figcaption className="mt-2 text-center text-xs text-muted">
              {post.coverCaption}
              {post.coverCaption && (post.coverCredit || indexedPhoto(cover)) && " — "}
              {post.coverCredit || <PhotoCreditLine imageKey={cover} />}
            </figcaption>
          )}
        </figure>

        <div className="container-site mt-10 grid max-w-[1080px] gap-10 lg:grid-cols-[minmax(0,680px)_300px] lg:justify-between">
          <div className="min-w-0">
            {toc.length > 2 && <MobileToc items={toc} />}
            <div id="article-body" data-link-group="A" className="prose-kkk article-body mt-6 lg:mt-0">
              <div id="introduction" className="scroll-mt-28" dangerouslySetInnerHTML={{ __html: intro }} />
              {post.pullQuote && (
                <blockquote className="pull-quote">
                  <p>&ldquo;{post.pullQuote}&rdquo;</p>
                  <cite>— {post.author}</cite>
                </blockquote>
              )}
              <KeyFactsBox title={`${topic} at a glance`} facts={post.keyFacts} />
              {/* content_html is sanitized on the server (allowlist) before it is stored */}
              <div dangerouslySetInnerHTML={{ __html: rest }} />
            </div>

            <div className="lg:hidden">
              <div className="mt-10">
                <PlanVisitCard title={planTitle} items={post.planVisit} />
              </div>
            </div>
            <GlossarySection items={post.glossary} />
            <FurtherReading items={post.furtherReading} />
            <MoreToExplore city={post.city} />
            <TagChips tags={post.tags} />
            <AuthorBox author={post.authorInfo} name={post.author} />
            <InlineSignup />
            <PrevNext newer={adjacent.newer} older={adjacent.older} />
          </div>

          <aside className="hidden lg:block" aria-label="Article tools">
            <div className="sticky top-24 space-y-6">
              {toc.length > 2 && <ArticleToc items={toc} />}
              <PlanVisitCard title={planTitle} items={post.planVisit} />
            </div>
          </aside>
        </div>
      </article>

      {related.length > 0 && (
        <section aria-labelledby="related-title" className="section-pad bg-bg-alt">
          <div className="container-site">
            <p className="eyebrow">Keep reading</p>
            <h2 id="related-title" className="mt-2 mb-8 text-[30px] font-bold text-primary md:text-[36px]">Related stories</h2>
            <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((p) => (
                <li key={p.slug}>
                  <ImageCard
                    image={p.coverUrl ?? "/images/kanpur/blog-cover.jpg"}
                    alt={p.coverAlt ?? p.title}
                    imageLabel={p.title}
                    eyebrow={cityName(p.city) || "Story"}
                    title={p.title}
                    description={p.excerpt}
                    chips={[formatDate(p.publishedAt.slice(0, 10)), `${p.readingMinutes} min read`]}
                    href={`/blogs/${p.slug}`}
                  />
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {!preview && <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BlogPosting",
          headline: post.title,
          description: post.seoDescription || post.excerpt,
          image: [cover.startsWith("https://") ? cover : absoluteUrl(cover), absoluteUrl(`/blogs/${post.slug}/opengraph-image`)],
          datePublished: post.publishedAt,
          dateModified: post.updatedAt,
          author: post.authorInfo
            ? {
                "@type": "Person",
                name: post.author,
                url: absoluteUrl(`/blogs/author/${post.authorInfo.slug}`),
                ...(post.authorInfo.title ? { jobTitle: post.authorInfo.title.replace(/, Kanpur Ki Kahaani$/, "") } : {}),
                ...(post.authorInfo.avatarUrl ? { image: post.authorInfo.avatarUrl.startsWith("/") ? absoluteUrl(post.authorInfo.avatarUrl) : post.authorInfo.avatarUrl } : {}),
              }
            : { "@type": "Organization", name: post.author, url: site.url },
          publisher: {
            "@type": "Organization",
            name: site.name,
            url: site.url,
            logo: { "@type": "ImageObject", url: hasLogo ? absoluteUrl("/brand/logo.png") : absoluteUrl("/icon") },
          },
          mainEntityOfPage: { "@type": "WebPage", "@id": url },
          ...(category ? { articleSection: category } : {}),
          keywords: post.tags.map(tagLabel).join(", "),
          wordCount,
          inLanguage: "en-IN",
          ...(post.tags.includes("navaratri")
            ? {
                about: [
                  { "@type": "Thing", name: "Navaratri", sameAs: "https://en.wikipedia.org/wiki/Navaratri" },
                  { "@type": "Thing", name: "Durga Puja", sameAs: "https://en.wikipedia.org/wiki/Durga_Puja" },
                ],
                mentions: ["Baradevi Temple", "Swaroop Nagar", "Civil Lines", "Kanpur Bengali Club"].map((name) => ({
                  "@type": "Place",
                  name,
                  address: { "@type": "PostalAddress", addressLocality: "Kanpur", addressRegion: "Uttar Pradesh", addressCountry: "IN" },
                })),
              }
            : {}),
        }}
      />}
    </>
  );
}
