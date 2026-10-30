import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Clock } from "lucide-react";
import { Breadcrumbs } from "@/components/sections/Breadcrumbs";
import { InlineSignup } from "@/components/sections/InlineSignup";
import { ShareButtons } from "@/components/sections/ShareButtons";
import { SocialLinks } from "@/components/layout/SocialLinks";
import { Section } from "@/components/ui/Section";
import { ImageCard } from "@/components/ui/ImageCard";
import { ImageWithFallback } from "@/components/ui/ImageWithFallback";
import { LinkButton } from "@/components/ui/Button";
import { JsonLd } from "@/components/seo/JsonLd";
import { absoluteUrl, mediumUrl, site } from "@/data/site";
import { hasLogo } from "@/lib/assets";
import { cityName } from "@/lib/city-names";
import { getAllPublished, getPostBySlug, getRelatedPosts } from "@/lib/posts";
import { buildMetadata } from "@/lib/seo";
import { formatDate } from "@/lib/utils";

// ISR: prebuilt at deploy, refreshed on publish via revalidatePath, and every 5 minutes at most.
export const revalidate = 300;

export async function generateStaticParams() {
  return (await getAllPublished()).map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: PageProps<"/blogs/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) return { title: "Story not found", robots: { index: false } };
  return buildMetadata({
    title: `${post.seoTitle || post.title} | Kanpur Ki Kahaani`,
    description: post.seoDescription || post.excerpt,
    path: `/blogs/${post.slug}`,
    ogImage: `/blogs/${post.slug}/opengraph-image`,
    type: "article",
    publishedTime: post.publishedAt,
  });
}

export default async function BlogPostPage({ params }: PageProps<"/blogs/[slug]">) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) notFound();
  const related = await getRelatedPosts(post, 3);
  const url = absoluteUrl(`/blogs/${post.slug}`);
  const place = cityName(post.city);

  return (
    <>
      <article>
        <header className="relative overflow-hidden bg-dark">
          <div
            aria-hidden
            className="pointer-events-none absolute -right-32 -top-40 h-[480px] w-[480px] rounded-full opacity-60 blur-3xl"
            style={{ background: "radial-gradient(circle, rgba(200,144,46,0.38) 0%, rgba(142,43,30,0.22) 45%, transparent 70%)" }}
          />
          <div className="container-site relative max-w-3xl py-14 md:py-20">
            <p className="eyebrow text-accent">Stories{place ? ` · ${place}` : ""}{post.tags[0] ? ` · ${post.tags[0]}` : ""}</p>
            <h1 className="mt-3 text-[34px] font-bold leading-[1.1] tracking-tight text-white md:text-[52px]">{post.title}</h1>
            {post.excerpt && <p className="mt-4 text-cream/75">{post.excerpt}</p>}
            <p className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-cream/70">
              <span>By {post.author}</span>
              <time dateTime={post.publishedAt}>{formatDate(post.publishedAt.slice(0, 10))}</time>
              <span className="inline-flex items-center gap-1.5">
                <Clock size={14} aria-hidden className="text-accent" /> {post.readingMinutes} min read
              </span>
            </p>
          </div>
        </header>
        <Breadcrumbs crumbs={[{ name: "Home", href: "/" }, { name: "Blogs", href: "/blogs" }, { name: post.title }]} />

        <div className="container-site max-w-3xl py-10 md:py-14">
          <div className="relative aspect-[16/9] overflow-hidden rounded-3xl">
            <ImageWithFallback src={post.coverUrl ?? "/images/kanpur/blog-cover.jpg"} alt={post.coverAlt ?? post.title} label={post.title} sublabel={place} fill priority sizes="(min-width: 768px) 720px, 100vw" className="object-cover" />
          </div>
          <ShareButtons className="mt-6 flex-wrap" url={url} title={post.title} context={`blog_${post.slug}`} />
          {/* content_html is sanitized on the server (sanitize-html allowlist) before it is stored */}
          <div className="prose-kkk mt-8" dangerouslySetInnerHTML={{ __html: post.html }} />

          <InlineSignup />

          <div className="flex flex-col gap-6 border-t border-border pt-8 sm:flex-row sm:items-center sm:justify-between">
            <ShareButtons className="flex-wrap" url={url} title={post.title} context={`blog_${post.slug}_end`} />
            <LinkButton href="/tourism#planner">Plan your Kanpur trip</LinkButton>
          </div>
          <div className="mt-8 flex flex-col gap-4 rounded-2xl bg-dark p-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="eyebrow text-accent">Follow the Kahaani</p>
              <a href={mediumUrl} target="_blank" rel="noopener noreferrer" className="mt-1 inline-block font-display text-lg text-white hover:text-accent">
                Read more on Medium ↗
              </a>
            </div>
            <SocialLinks variant="footer" />
          </div>
        </div>
      </article>

      {related.length > 0 && (
        <Section tone="alt" labelledBy="related-title">
          <p className="eyebrow">Keep reading</p>
          <h2 id="related-title" className="mt-2 mb-8 text-[30px] font-bold text-primary md:text-[36px]">Related Posts</h2>
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
        </Section>
      )}

      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Article",
          headline: post.title,
          description: post.seoDescription || post.excerpt,
          datePublished: post.publishedAt,
          dateModified: post.updatedAt,
          author: { "@type": "Organization", name: post.author, url: site.url },
          publisher: {
            "@type": "Organization",
            name: site.name,
            logo: { "@type": "ImageObject", url: hasLogo ? absoluteUrl("/brand/logo.png") : absoluteUrl("/icon") },
          },
          image: post.coverUrl?.startsWith("https://") ? post.coverUrl : absoluteUrl(`/blogs/${post.slug}/opengraph-image`),
          mainEntityOfPage: url,
          keywords: post.tags.join(", "),
        }}
      />
    </>
  );
}
